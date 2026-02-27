import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  link: string;
  optional?: boolean;
}

interface SetupChecklistProps {
  steps: SetupStep[];
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function SetupChecklist({ steps, onDismiss, showDismiss = true }: SetupChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed && allCompleted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-card border border-border mb-6 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold">Complete Your Setup</h2>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} steps
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-bg rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showDismiss && allCompleted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="flex-shrink-0 h-8 w-8"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <ChevronDown
            className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 pt-2 space-y-1.5">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all",
                    step.completed
                      ? "bg-muted/30 border-border"
                      : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-sm font-medium",
                        step.completed ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {step.title}
                      </h3>
                      {step.optional && (
                        <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {step.description}
                    </p>
                    {step.completed && step.completedDate && (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {new Date(step.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {!step.completed && (
                    <Link to={step.link} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        Start
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}












