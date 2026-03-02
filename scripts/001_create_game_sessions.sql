-- Create game sessions table for storing Avalon game state
-- This allows multiple users to see the same game state in real-time

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY DEFAULT 'default',
  game_state JSONB NOT NULL,
  history_snapshots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- Insert initial default session
INSERT INTO game_sessions (id, game_state, history_snapshots)
VALUES (
  'default',
  '{
    "phase": "setup",
    "players": [],
    "playerCount": 0,
    "roles": [],
    "currentQuest": 1,
    "quests": [],
    "currentLeaderIndex": 0,
    "currentProposal": null,
    "consecutiveRejects": 0,
    "goodWins": 0,
    "evilWins": 0,
    "assassinTarget": null,
    "winner": null,
    "winReason": "",
    "speechTimerDuration": 60,
    "ladyOfLakeHolder": null,
    "ladyOfLakeHistory": [],
    "useLadyOfLake": false,
    "speechDirection": "left"
  }'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
