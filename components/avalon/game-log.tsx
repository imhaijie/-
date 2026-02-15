"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ScrollText,
  Shield,
  Skull,
  ThumbsUp,
  ThumbsDown,
  Users,
  Crown,
  Waves,
} from "lucide-react";
import { useGame } from "@/lib/avalon/store";

export function GameLog() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);

  const completedQuests = state.quests.filter((q) => q.result !== "pending");

  // Count all proposals across all quests (including current)
  const totalProposals = state.quests.reduce((sum, q) => sum + q.proposals.length, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        >
          <ScrollText className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] bg-card sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ScrollText className="h-5 w-5 text-primary" />
            游戏记录
          </SheetTitle>
          <SheetDescription>
            记录所有任务、投票和组队历史
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "calc(100dvh - 120px)" }}>
          {/* Score */}
          <div className="flex gap-3">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[hsl(210_80%_55%/0.08)] px-3 py-2">
              <Shield className="h-4 w-4 text-good" />
              <span className="text-lg font-bold text-good">
                {state.goodWins}
              </span>
              <span className="text-xs text-good/70">成功</span>
            </div>
            <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[hsl(0_72%_51%/0.08)] px-3 py-2">
              <Skull className="h-4 w-4 text-evil" />
              <span className="text-lg font-bold text-evil">
                {state.evilWins}
              </span>
              <span className="text-xs text-evil/70">失败</span>
            </div>
          </div>

          {/* Lady of the Lake history */}
          {state.ladyOfLakeHistory.length > 0 && (
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Waves className="h-3.5 w-3.5" />
                湖中女士记录
              </h4>
              <div className="space-y-1">
                {state.ladyOfLakeHistory.map((record, i) => (
                  <div key={i} className="text-xs text-foreground/80">
                    {state.players.find((p) => p.id === record.from)?.name}
                    {" -> "}
                    {state.players.find((p) => p.id === record.to)?.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quest records */}
          {completedQuests.length === 0 && totalProposals === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无记录
            </p>
          ) : (
            <>
              {/* Show all proposals from all quests */}
              {state.quests.map((quest) => (
                <div
                  key={quest.questNumber}
                  className="rounded-lg border border-border bg-secondary/20 p-3"
                >
                  {/* Quest header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          quest.result === "success"
                            ? "bg-good/20 text-good"
                            : quest.result === "fail"
                            ? "bg-evil/20 text-evil"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {quest.questNumber}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        第{quest.questNumber}轮
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        quest.result === "success"
                          ? "bg-good/15 text-good"
                          : quest.result === "fail"
                          ? "bg-evil/15 text-evil"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {quest.result === "success"
                        ? "成功"
                        : quest.result === "fail"
                        ? `失败 (${quest.failCount}败)`
                        : "进行中"}
                    </span>
                  </div>

                  {/* Final team (for completed quests) */}
                  {quest.result !== "pending" && quest.finalTeam.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs text-muted-foreground">
                        <Users className="mr-1 inline h-3 w-3" />
                        执行队伍
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {quest.finalTeam.map((id) => (
                          <span
                            key={id}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground"
                          >
                            {state.players.find((p) => p.id === id)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proposals history */}
                  {quest.proposals.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        投票记录 ({quest.proposals.length}次)
                      </p>
                      {quest.proposals.map((proposal, pi) => (
                        <div
                          key={pi}
                          className="mb-1 rounded-md bg-background/50 px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Crown className="h-3 w-3" />
                              {state.players.find(
                                (p) => p.id === proposal.leaderId
                              )?.name}
                            </span>
                            <span
                              className={
                                proposal.approved
                                  ? "text-good"
                                  : "text-evil"
                              }
                            >
                              {proposal.approved === null
                                ? ""
                                : proposal.approved
                                ? "通过"
                                : "否决"}
                            </span>
                          </div>
                          {/* Vote details */}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(proposal.votes).map(
                              ([playerId, vote]) => (
                                <span
                                  key={playerId}
                                  className={`flex items-center gap-0.5 text-xs ${
                                    vote === "approve"
                                      ? "text-good"
                                      : "text-evil"
                                  }`}
                                >
                                  {vote === "approve" ? (
                                    <ThumbsUp className="h-2.5 w-2.5" />
                                  ) : (
                                    <ThumbsDown className="h-2.5 w-2.5" />
                                  )}
                                  {state.players.find(
                                    (p) => p.id === Number(playerId)
                                  )?.name}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
