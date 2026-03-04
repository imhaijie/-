"use client";

import { useEffect, useState, useMemo } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import {
  fetchGameState,
  subscribeToGameState,
} from "@/lib/avalon/sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getVoteHistory } from "@/lib/avalon/store";
import type { GameState, VoteHistoryEntry, QuestResult } from "@/lib/avalon/types";
import { QUEST_TEAM_SIZE, DOUBLE_FAIL_QUESTS, ROLE_INFO } from "@/lib/avalon/types";
import {
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  Shield,
  Skull,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function getPhaseLabel(phase: string, state: GameState): string {
  const questNum = state.currentQuest;
  const leaderName = state.players[state.currentLeaderIndex]?.name || "";

  switch (phase) {
    case "setup":
      return "等待游戏开始";
    case "night":
      return "夜晚阶段 - 查看身份";
    case "team_building":
      return `第${questNum}轮 - ${leaderName}正在组队`;
    case "team_vote":
      return `第${questNum}轮 - 投票中`;
    case "vote_result":
      return `第${questNum}轮 - 投票结果`;
    case "quest":
      return `第${questNum}轮 - 执行任务中`;
    case "quest_result":
      return `第${questNum}轮 - 任务结果`;
    case "lady_of_lake":
      return `第${questNum}轮 - 湖中女士`;
    case "assassination":
      return "刺杀阶段";
    case "game_over":
      return "游戏结束";
    default:
      return phase;
  }
}

function QuestProgressBar({ state }: { state: GameState }) {
  const questResults = state.quests.map((q) => q.result);

  return (
    <div className="flex items-center justify-center gap-3">
      {[1, 2, 3, 4, 5].map((q) => {
        const result = questResults[q - 1];
        const isActive = q === state.currentQuest;
        const size = QUEST_TEAM_SIZE[state.playerCount]?.[q - 1] || 0;
        const requiresDoubleFail = DOUBLE_FAIL_QUESTS[state.playerCount]?.includes(q);

        return (
          <div
            key={q}
            className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full font-bold transition-all lg:h-20 lg:w-20 ${
              result === "success"
                ? "bg-good/20 text-good ring-2 ring-good/50"
                : result === "fail"
                ? "bg-evil/20 text-evil ring-2 ring-evil/50"
                : isActive
                ? "bg-primary text-primary-foreground ring-2 ring-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {result === "success" ? (
              <Shield className="h-8 w-8 lg:h-10 lg:w-10" />
            ) : result === "fail" ? (
              <Skull className="h-8 w-8 lg:h-10 lg:w-10" />
            ) : (
              <>
                <span className="text-2xl font-bold leading-none lg:text-3xl">{size}</span>
                <span className="text-xs leading-none opacity-70">人</span>
              </>
            )}
            {requiresDoubleFail && result === "pending" && (
              <span className="absolute -bottom-1 rounded bg-amber-500/20 px-1.5 text-[10px] text-amber-400">
                2失败
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VoteHistorySection({ state, voteHistory }: { state: GameState; voteHistory: VoteHistoryEntry[] }) {
  const questResults = state.quests.map((q) => q.result);

  // Group vote history by quest
  const votesByQuest = voteHistory.reduce((acc, vote) => {
    if (!acc[vote.questNumber]) {
      acc[vote.questNumber] = [];
    }
    acc[vote.questNumber].push(vote);
    return acc;
  }, {} as Record<number, typeof voteHistory>);

  if (voteHistory.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ThumbsUp className="h-5 w-5" />
            投票记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">暂无投票记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ThumbsUp className="h-5 w-5" />
          投票记录
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(votesByQuest).map(([questNum, votes]) => {
          const questResult = questResults[Number(questNum) - 1];
          const quest = state.quests[Number(questNum) - 1];

          return (
            <div key={questNum}>
              {/* Quest header */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">第 {questNum} 轮</span>
                {questResult && questResult !== "pending" && (
                  <Badge
                    variant="outline"
                    className={`${
                      questResult === "success"
                        ? "border-good/50 bg-good/10 text-good"
                        : "border-evil/50 bg-evil/10 text-evil"
                    }`}
                  >
                    {questResult === "success" ? (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        成功
                      </>
                    ) : (
                      <>
                        <Skull className="mr-1 h-3 w-3" />
                        失败 ({quest?.failCount}张失败)
                      </>
                    )}
                  </Badge>
                )}
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Vote records */}
              <div className="space-y-3">
                {votes.map((vote, idx) => (
                  <div
                    key={`${questNum}-${idx}`}
                    className={`rounded-xl border-2 p-4 ${
                      vote.approved
                        ? "border-good/30 bg-good/5"
                        : "border-evil/30 bg-evil/5"
                    }`}
                  >
                    {/* Leader and team */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">{vote.leaderName}</span>
                      </div>
                      <span className="text-muted-foreground">{">"}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {vote.teamMemberNames.map((name, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-auto ${
                          vote.approved
                            ? "border-good/50 bg-good/10 text-good"
                            : "border-evil/50 bg-evil/10 text-evil"
                        }`}
                      >
                        {vote.approved ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            通过
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            否决
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Individual votes */}
                    <div className="flex flex-wrap gap-1.5">
                      {state.players.map((player) => {
                        const playerVote = vote.votes[player.id];
                        if (!playerVote) return null;
                        const isApprove = playerVote === "approve";

                        return (
                          <div
                            key={player.id}
                            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                              isApprove
                                ? "bg-good/20 text-good"
                                : "bg-evil/20 text-evil"
                            }`}
                          >
                            {isApprove ? (
                              <ThumbsUp className="h-3 w-3" />
                            ) : (
                              <ThumbsDown className="h-3 w-3" />
                            )}
                            <span>{player.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CurrentStatusCard({ state }: { state: GameState }) {
  const leader = state.players[state.currentLeaderIndex];
  const teamSize = QUEST_TEAM_SIZE[state.playerCount]?.[state.currentQuest - 1] || 0;
  const currentProposal = state.currentProposal;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          当前状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">当前阶段</span>
          <Badge variant="default" className="text-sm">
            {getPhaseLabel(state.phase, state)}
          </Badge>
        </div>

        {state.phase !== "setup" && state.phase !== "game_over" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">当前队长</span>
              <div className="flex items-center gap-1.5">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-semibold">{leader?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">本轮出征人数</span>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">{teamSize} 人</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">连续否决次数</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full transition-all ${
                      i <= state.consecutiveRejects
                        ? i === 5
                          ? "bg-evil"
                          : "bg-primary"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentProposal && currentProposal.teamMemberIds.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="mb-2 block text-sm text-muted-foreground">当前提议队伍</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProposal.teamMemberIds.map((id) => {
                    const player = state.players.find((p) => p.id === id);
                    return (
                      <Badge key={id} variant="secondary">
                        {player?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {state.phase === "game_over" && (
          <div className="rounded-lg bg-background/50 p-4 text-center">
            <div
              className={`mb-2 text-2xl font-bold ${
                state.winner === "good" ? "text-good" : "text-evil"
              }`}
            >
              {state.winner === "good" ? "正义方胜利" : "邪恶方胜利"}
            </div>
            <p className="text-muted-foreground">{state.winReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerListCard({ state }: { state: GameState }) {
  const showRoles = state.phase === "game_over";

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          玩家列表 ({state.players.length}人)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {state.players.map((player, index) => {
            const isLeader = index === state.currentLeaderIndex;
            const roleInfo = player.role ? ROLE_INFO[player.role] : null;

            return (
              <div
                key={player.id}
                className={`rounded-lg border p-2 ${
                  isLeader ? "border-primary bg-primary/5" : "border-border/50 bg-background/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isLeader && <Crown className="h-4 w-4 text-primary" />}
                  <span className="font-medium">{player.name}</span>
                </div>
                {showRoles && roleInfo && (
                  <Badge
                    variant="outline"
                    className={`mt-1 text-xs ${
                      roleInfo.alignment === "good"
                        ? "border-good/50 text-good"
                        : "border-evil/50 text-evil"
                    }`}
                  >
                    {roleInfo.nameZh}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreCard({ state }: { state: GameState }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="py-4">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-good" />
              <span className="text-3xl font-bold text-good">{state.goodWins}</span>
            </div>
            <span className="text-sm text-muted-foreground">正义方</span>
          </div>
          <div className="text-3xl font-bold text-muted-foreground">:</div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-evil">{state.evilWins}</span>
              <Skull className="h-6 w-6 text-evil" />
            </div>
            <span className="text-sm text-muted-foreground">邪恶方</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlayerPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const voteHistory = useMemo(() => {
    if (!state) return [];
    return getVoteHistory(state);
  }, [state]);

  // Load initial state
  useEffect(() => {
    async function loadState() {
      setIsLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setIsConfigured(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const savedState = await fetchGameState();
        if (savedState) {
          setState(savedState);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.warn("[v0] Failed to fetch game state:", error);
        setIsConfigured(false);
      }
      setIsLoading(false);
    }

    loadState();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConfigured) return;
    
    const unsubscribe = subscribeToGameState((newState) => {
      setState(newState);
      setLastUpdated(new Date());
      setIsConnected(true);
    });

    // Heartbeat to check connection
    const heartbeat = setInterval(() => {
      setIsConnected(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, [isConfigured]);

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className="flex min-h-[100dvh] items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">正在加载游戏状态...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isConfigured) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-amber-500/10 p-6">
              <WifiOff className="h-12 w-12 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">数据库未配置</h1>
            <p className="text-center text-muted-foreground">
              Supabase 数据库尚未配置，无法使用实时同步功能。
              <br />
              请联系管理员配置数据库连接。
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            返回主持人页面
          </Link>
        </div>
      </ThemeProvider>
    );
  }

  if (!state || state.phase === "setup") {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-6">
              <Eye className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">玩家观看模式</h1>
            <p className="text-center text-muted-foreground">
              游戏尚未开始，请等待主持人设置游戏。
              <br />
              游戏开始后此页面将自动刷新。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            实时监听中...
          </div>
          <Link
            href="/"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            前往主持人页面
          </Link>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-[100dvh] bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">游戏进程</h1>
                <p className="text-xs text-muted-foreground">只读模式 - 实时同步</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                  isConnected
                    ? "bg-good/10 text-good"
                    : "bg-evil/10 text-evil"
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    已连接
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    断开连接
                  </>
                )}
              </div>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  更新于 {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto space-y-6 p-4 pb-20">
          {/* Quest progress */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg">任务进度</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestProgressBar state={state} />
            </CardContent>
          </Card>

          {/* Score */}
          <ScoreCard state={state} />

          {/* Current status */}
          <CurrentStatusCard state={state} />

          {/* Players */}
          <PlayerListCard state={state} />

          {/* Vote history */}
          <VoteHistorySection state={state} voteHistory={voteHistory} />
        </main>

        {/* Footer with link to host */}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container mx-auto flex items-center justify-center">
            <Link
              href="/"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              前往主持人页面
            </Link>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
