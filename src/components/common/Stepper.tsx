interface StepperProps {
  steps: string[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  isDone
                    ? 'bg-navy-700 text-white'
                    : isActive
                      ? 'border-2 border-navy-700 text-navy-700'
                      : 'border-2 border-slate-200 text-slate-400',
                ].join(' ')}
              >
                {isDone ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={[
                  'hidden text-sm font-medium sm:block',
                  isActive || isDone ? 'text-slate-900' : 'text-slate-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
