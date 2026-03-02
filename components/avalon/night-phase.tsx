"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, ChevronRight, Crown, Volume2 } from "lucide-react";
import { ROLE_INFO, type Role } from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";

interface NarrationStep {
  title: string;
  script: string;
  highlight?: "good" | "evil" | "neutral";
}

function generateNarration(roles: Role[]): NarrationStep[] {
  const steps: NarrationStep[] = [];
  const roleSet = new Set(roles);

  steps.push({
    title: "夜晚开始",
    script: "天黑请闭眼。\n所有人请闭上眼睛，伸出拳头放在桌上。",
    highlight: "neutral",
  });

  // Evil team wakes (except Oberon)
  const hasOberon = roleSet.has("oberon");
  steps.push({
    title: "邪恶方互认",
    script: hasOberon
      ? "邪恶方请睁眼（奥伯伦不要睁眼）。\n\n刺客、莫甘娜" +
        (roleSet.has("mordred") ? "、莫德雷德" : "") +
        (roleSet.has("minion") ? "、爪牙" : "") +
        "，请睁开眼睛，互相确认同伴。\n\n请记住彼此，然后闭上眼睛。"
      : "邪恶方请睁眼。\n\n刺客、莫甘娜" +
        (roleSet.has("mordred") ? "、莫德雷德" : "") +
        (roleSet.has("minion") ? "、爪牙" : "") +
        "，请睁开眼睛，互相确认同伴。\n\n请记住彼此，然后闭上眼睛。",
    highlight: "evil",
  });

  steps.push({
    title: "邪恶方闭眼",
    script: "邪恶方请闭眼。",
    highlight: "evil",
  });

  // Oberon - does not participate but needs to be known to evil? No.
  // Actually Oberon wakes separately for Merlin to see, but in standard rules
  // Merlin sees evil via thumbs up. Let me do standard narration.

  // Merlin phase - evil show thumbs
  if (roleSet.has("merlin")) {
    const hiddenFromMerlin = roleSet.has("mordred") ? "（莫德雷德不要竖起大拇指）" : "";
    steps.push({
      title: "梅林环节",
      script: `邪恶方请举起大拇指${hiddenFromMerlin}。\n\n梅林请睁眼，确认邪恶方的身份。\n\n请记住这些人。`,
      highlight: "good",
    });

    steps.push({
      title: "梅林闭眼",
      script: "梅林请闭眼。邪恶方请放下大拇指。",
      highlight: "good",
    });
  }

  // Percival phase
  if (roleSet.has("percival")) {
    const hasMorgana = roleSet.has("morgana");
    steps.push({
      title: "派西维尔环节",
      script: hasMorgana
        ? "梅林和莫甘娜请举起大拇指。\n\n派西维尔请睁眼，这两人中有一个是梅林，另一个是莫甘娜。\n\n请记住这两人。"
        : "梅林请举起大拇指。\n\n派西维尔请睁眼，确认梅林的身份。\n\n请记住此人。",
      highlight: "good",
    });

    steps.push({
      title: "派西维尔闭眼",
      script: hasMorgana
        ? "派西维尔请闭眼。梅林和莫甘娜请放下大拇指。"
        : "派西维尔请闭眼。梅林请放下大拇指。",
      highlight: "good",
    });
  }

  // Unfaithful servant reminder (no special night action, but remind players)
  if (roleSet.has("unfaithful_servant")) {
    steps.push({
      title: "不忠诚的仆人提示",
      script: "本局存在「不忠诚的仆人」。\n\n不忠诚的仆人属于好人阵营，但可以在任务中出失败牌。\n\n请不忠诚的仆人记住自己的特殊身份。",
      highlight: "neutral",
    });
  }

  steps.push({
    title: "天亮了",
    script: "天亮了！所有人请睁开眼睛。\n\n游戏正式开始！",
    highlight: "neutral",
  });

  return steps;
}

export function NightPhase() {
  const { state, dispatch } = useGame();
  const [currentStep, setCurrentStep] = useState(0);

  const narrationSteps = generateNarration(state.roles);
  const step = narrationSteps[currentStep];
  const isLast = currentStep === narrationSteps.length - 1;
  const progress = (currentStep + 1) / narrationSteps.length;

  const handleNext = () => {
    if (isLast) {
      dispatch({ type: "START_TEAM_BUILDING" });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const highlightColor =
    step.highlight === "evil"
      ? "border-evil/40 bg-[hsl(0_72%_51%/0.06)]"
      : step.highlight === "good"
      ? "border-good/40 bg-[hsl(210_80%_55%/0.06)]"
      : "border-primary/40 bg-primary/5";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      <div className="mb-4 text-center">
        <Moon className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h1 className="font-serif text-2xl font-bold text-foreground">
          主持人台词
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          请朗读以下台词引导游戏进行
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full max-w-lg overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="w-full max-w-lg flex-1">
        {/* Step indicator */}
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            第 {currentStep + 1}/{narrationSteps.length} 步
          </span>
          <span className={
            step.highlight === "evil" ? "text-evil" :
            step.highlight === "good" ? "text-good" : "text-primary"
          }>
            {step.title}
          </span>
        </div>

        {/* Script card */}
        <div
          className={`animate-scale-in rounded-lg border-2 p-6 ${highlightColor}`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Volume2 className={`h-5 w-5 ${
              step.highlight === "evil" ? "text-evil" :
              step.highlight === "good" ? "text-good" : "text-primary"
            }`} />
            <h2 className="font-serif text-lg font-bold text-foreground">
              {step.title}
            </h2>
          </div>
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {step.script}
          </p>
        </div>

        {/* Role list reference (collapsed) */}
        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            本局角色配置
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.roles.map((role, i) => {
              const info = ROLE_INFO[role];
              return (
                <span
                  key={i}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    info.alignment === "good"
                      ? "bg-[hsl(210_80%_55%/0.12)] text-good"
                      : "bg-[hsl(0_72%_51%/0.12)] text-evil"
                  }`}
                >
                  {info.nameZh}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex w-full max-w-lg gap-3">
        <Button
          variant="outline"
          className="flex-1"
          size="lg"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          上一步
        </Button>
        <Button className="flex-1" size="lg" onClick={handleNext}>
          {isLast ? (
            <>
              <Crown className="mr-2 h-5 w-5" />
              开始游戏
            </>
          ) : (
            <>
              下一步
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
