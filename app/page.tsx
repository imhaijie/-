import { GameProvider } from "@/components/avalon/game-provider";

export default function Home() {
  return (
    <main className="min-h-[100dvh]">
      <GameProvider />
    </main>
  );
}
