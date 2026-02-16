import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, X } from "lucide-react";
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

  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  const handleDismiss = () => {
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
      className="bg-card rounded-2xl p-6 shadow-card border border-border mb-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1">Complete Your Setup</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Follow these steps to get your eSIM business up and running
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-bg rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {completedCount} of {totalCount} steps completed
            </span>
          </div>
        </div>
        {showDismiss && allCompleted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-all",
              step.completed
                ? "bg-muted/30 border-border"
                : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-medium",
                  step.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {step.title}
                </h3>
                {step.optional && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {step.description}
              </p>
              {step.completed && step.completedDate && (
                <p className="text-xs text-muted-foreground">
                  Completed on {new Date(step.completedDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {!step.completed && (
              <Link to={step.link}>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  Start Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}







