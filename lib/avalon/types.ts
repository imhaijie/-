// ============================================================
// Avalon Game Types & Constants
// ============================================================

export type Role =
  | "merlin"
  | "percival"
  | "loyal_servant"
  | "unfaithful_servant" // New: good alignment but can play fail cards
  | "assassin"
  | "morgana"
  | "mordred"
  | "oberon"
  | "minion";

export type Alignment = "good" | "evil";

export interface RoleInfo {
  id: Role;
  name: string;
  nameZh: string;
  alignment: Alignment;
  description: string;
  isSpecial: boolean;
  canPlayFail?: boolean; // For unfaithful servant
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  merlin: {
    id: "merlin",
    name: "Merlin",
    nameZh: "梅林",
    alignment: "good",
    description: "知道所有邪恶玩家的身份（莫德雷德除外），但必须隐藏自己的身份",
    isSpecial: true,
  },
  percival: {
    id: "percival",
    name: "Percival",
    nameZh: "派西维尔",
    alignment: "good",
    description: "知道谁是梅林（但莫甘娜也会亮出身份，造成混淆）",
    isSpecial: true,
  },
  loyal_servant: {
    id: "loyal_servant",
    name: "Loyal Servant",
    nameZh: "忠臣",
    alignment: "good",
    description: "亚瑟王的忠诚仆从，没有特殊能力",
    isSpecial: false,
  },
  unfaithful_servant: {
    id: "unfaithful_servant",
    name: "Unfaithful Servant",
    nameZh: "不忠诚的仆人",
    alignment: "good",
    description: "好人阵营，但可以出失败牌。可能是内鬼、被胁迫者或有自己的目的",
    isSpecial: true,
    canPlayFail: true, // Special flag for quest phase
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    nameZh: "刺客",
    alignment: "evil",
    description: "游戏结束时可以刺杀梅林，若刺中则邪恶方获胜",
    isSpecial: true,
  },
  morgana: {
    id: "morgana",
    name: "Morgana",
    nameZh: "莫甘娜",
    alignment: "evil",
    description: "在派西维尔看来与梅林相同，用于混淆好人阵营",
    isSpecial: true,
  },
  mordred: {
    id: "mordred",
    name: "Mordred",
    nameZh: "莫德雷德",
    alignment: "evil",
    description: "梅林无法看到莫德雷德，使梅林的信息不完整",
    isSpecial: true,
  },
  oberon: {
    id: "oberon",
    name: "Oberon",
    nameZh: "奥伯伦",
    alignment: "evil",
    description: "不知道其他邪恶玩家是谁，其他邪恶玩家也不知道他",
    isSpecial: true,
  },
  minion: {
    id: "minion",
    name: "Minion",
    nameZh: "爪牙",
    alignment: "evil",
    description: "莫德雷德的普通随从，知道其他邪恶玩家",
    isSpecial: false,
  },
};

// Team size for each quest based on player count
export const QUEST_TEAM_SIZE: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
  11: [3, 4, 4, 5, 5],
  12: [3, 4, 4, 5, 5],
};

// Quests that require 2 fail cards (4th quest for 7+ players)
export const DOUBLE_FAIL_QUESTS: Record<number, number[]> = {
  5: [],
  6: [],
  7: [4],
  8: [4],
  9: [4],
  10: [4],
  11: [4],
  12: [4],
};

// Good/Evil count per player count
export const ALIGNMENT_COUNT: Record<number, { good: number; evil: number }> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
  11: { good: 7, evil: 4 },
  12: { good: 8, evil: 4 },
};

// Recommended role configs per player count
export const RECOMMENDED_ROLES: Record<number, Role[]> = {
  5: ["merlin", "percival", "loyal_servant", "assassin", "morgana"],
  6: ["merlin", "percival", "loyal_servant", "loyal_servant", "assassin", "morgana"],
  7: ["merlin", "percival", "loyal_servant", "loyal_servant", "assassin", "morgana", "oberon"],
  8: ["merlin", "percival", "loyal_servant", "loyal_servant", "loyal_servant", "assassin", "morgana", "minion"],
  9: ["merlin", "percival", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "assassin", "morgana", "minion"],
  10: ["merlin", "percival", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "assassin", "morgana", "oberon", "minion"],
  11: ["merlin", "percival", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "assassin", "morgana", "oberon", "minion"],
  12: ["merlin", "percival", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "loyal_servant", "assassin", "morgana", "oberon", "minion"],
};

export type VoteChoice = "approve" | "reject";
export type QuestChoice = "success" | "fail";
export type QuestResult = "success" | "fail" | "pending";

export interface Player {
  id: number;
  name: string;
  role?: Role;
  alignment?: Alignment;
}

export interface TeamProposal {
  leaderId: number;
  teamMemberIds: number[];
  votes: Record<number, VoteChoice>;
  approved: boolean | null;
}

export interface QuestRecord {
  questNumber: number;
  teamSize: number;
  requiresDoubleFail: boolean;
  proposals: TeamProposal[];
  finalTeam: number[];
  questVotes: Record<number, QuestChoice>;
  result: QuestResult;
  failCount: number;
}

export type GamePhase =
  | "setup"
  | "night"         // Host narration scripts
  | "team_building" // Captain selects team + speech
  | "team_vote"     // Host records votes
  | "vote_result"   // Display vote result
  | "quest"         // Host records quest cards
  | "quest_result"  // Display quest result
  | "lady_of_lake"
  | "assassination"
  | "game_over";

export type SpeechDirection = "left" | "right";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  playerCount: number;
  roles: Role[];
  currentQuest: number; // 1-5
  quests: QuestRecord[];
  currentLeaderIndex: number;
  currentProposal: TeamProposal | null;
  consecutiveRejects: number;
  goodWins: number;
  evilWins: number;
  assassinTarget: number | null;
  winner: Alignment | null;
  winReason: string;
  speechTimerDuration: number;
  ladyOfLakeHolder: number | null;
  ladyOfLakeHistory: Array<{ from: number; to: number; result: Alignment }>;
  useLadyOfLake: boolean;
  speechDirection: SpeechDirection;
}

export const MAX_REJECTS = 5;
export const QUESTS_TO_WIN = 3;
export const TOTAL_QUESTS = 5;

// History snapshot for undo functionality
export interface HistorySnapshot {
  id: string;
  timestamp: number;
  label: string; // Human-readable description
  phase: GamePhase;
  state: GameState;
}

// Vote history entry for display
export interface VoteHistoryEntry {
  questNumber: number;
  proposalIndex: number;
  leaderId: number;
  leaderName: string;
  teamMemberIds: number[];
  teamMemberNames: string[];
  votes: Record<number, VoteChoice>;
  approved: boolean;
  approveCount: number;
  rejectCount: number;
}
