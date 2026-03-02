"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameState } from "./types";
import { createInitialState } from "./store";

// Default session ID - single global game session
const DEFAULT_SESSION_ID = "default";

const supabase = createClient();

// Fetch current game state from database
export async function fetchGameState(): Promise<GameState | null> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("game_state")
    .eq("id", DEFAULT_SESSION_ID)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No session found, create initial one
      return null;
    }
    console.error("[v0] Error fetching game state:", error);
    return null;
  }

  return data?.game_state as GameState || null;
}

// Save game state to database
export async function saveGameState(state: GameState): Promise<boolean> {
  const { error } = await supabase
    .from("game_sessions")
    .upsert({
      id: DEFAULT_SESSION_ID,
      game_state: state,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "id",
    });

  if (error) {
    console.error("[v0] Error saving game state:", error);
    return false;
  }

  return true;
}

// Reset game session
export async function resetGameSession(): Promise<boolean> {
  const initialState = createInitialState();
  return saveGameState(initialState);
}

// Subscribe to real-time game state changes
export function subscribeToGameState(
  onStateChange: (state: GameState) => void
): () => void {
  const channel = supabase
    .channel("game_sessions_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_sessions",
        filter: `id=eq.${DEFAULT_SESSION_ID}`,
      },
      (payload) => {
        if (payload.new && "game_state" in payload.new) {
          const newState = payload.new.game_state as GameState;
          onStateChange(newState);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
