"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface JourneyStep {
  order: number;
  title: string;
  objective: string;
}

interface JourneyData {
  id: string;
  title: string;
  description: string;
  steps: JourneyStep[];
  progress: { current_step: number; completed_at: string | null } | null;
}

export function JourneysClient({ journeys }: { journeys: JourneyData[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function advance(journeyId: string) {
    setLoadingId(journeyId);
    await fetch("/api/journeys/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeyId }),
    });
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {journeys.map((journey) => {
        const currentStepNumber = journey.progress?.current_step ?? 0;
        const isComplete = Boolean(journey.progress?.completed_at);
        const currentStep = journey.steps.find((s) => s.order === currentStepNumber);

        return (
          <Card key={journey.id}>
            <h2 className="font-medium text-ink dark:text-white">{journey.title}</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{journey.description}</p>

            {journey.progress ? (
              <div className="mt-3">
                {isComplete ? (
                  <p className="text-sm font-medium text-emerald-600">Completed 🎉</p>
                ) : currentStep ? (
                  <p className="text-sm text-ink/80 dark:text-white/80">
                    Step {currentStep.order} of {journey.steps.length}: <strong>{currentStep.title}</strong>
                    <br />
                    <span className="text-ink/60 dark:text-white/60">{currentStep.objective}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/40 dark:text-white/40">Not started yet.</p>
            )}

            {!isComplete ? (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                isLoading={loadingId === journey.id}
                onClick={() => advance(journey.id)}
              >
                {journey.progress ? "Mark step complete" : "Start journey"}
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
