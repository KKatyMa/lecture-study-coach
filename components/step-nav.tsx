import { cn } from "@/lib/utils";
import { BookOpenCheck, Layers3, ListTree, Upload } from "lucide-react";

export const STEPS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "outline", label: "Outline", icon: ListTree },
  { id: "cards", label: "Cards", icon: Layers3 },
  { id: "quiz", label: "Quiz", icon: BookOpenCheck },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

type StepNavProps = {
  current: StepId;
  enabled: Record<StepId, boolean>;
  onSelect: (step: StepId) => void;
};

export function StepNav({ current, enabled, onSelect }: StepNavProps) {
  return (
    <nav aria-label="Study steps" className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const active = current === step.id;
          const isEnabled = enabled[step.id];
          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!isEnabled}
                onClick={() => onSelect(step.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  !active && isEnabled && "border-border bg-card hover:bg-accent",
                  !isEnabled && "cursor-not-allowed border-border/60 text-muted-foreground opacity-60",
                )}
              >
                <Icon className="size-3.5" />
                <span className="font-medium">{step.label}</span>
              </button>
              {index < STEPS.length - 1 ? (
                <span className="hidden h-px w-6 bg-border sm:block" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
