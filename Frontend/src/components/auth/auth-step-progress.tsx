type AuthStepProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function AuthStepProgress({ currentStep, totalSteps }: AuthStepProgressProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 1), totalSteps);
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = step === safeCurrent;
          const isCompleted = step < safeCurrent;

          return (
            <div key={step} className="flex flex-1 items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  isCompleted
                    ? "border-indigo-300/60 bg-indigo-500/80 text-white"
                    : isActive
                      ? "border-indigo-300/60 bg-indigo-500/30 text-indigo-100"
                      : "border-white/20 bg-white/5 text-zinc-400"
                ].join(" ")}
              >
                {step}
              </div>

              {index < steps.length - 1 ? (
                <div
                  className={[
                    "h-px flex-1 transition-colors",
                    step < safeCurrent ? "bg-indigo-300/55" : "bg-white/15"
                  ].join(" ")}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-400">Step {safeCurrent} of {totalSteps}</p>
    </div>
  );
}
