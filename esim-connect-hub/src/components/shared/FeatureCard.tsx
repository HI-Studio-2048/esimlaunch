import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
  variant?: "default" | "outlined" | "gradient";
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  index = 0,
  variant = "default",
  className,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative p-6 md:p-8 rounded-2xl transition-all duration-300",
        variant === "default" && "bg-card shadow-card hover:shadow-card-hover hover:-translate-y-1",
        variant === "outlined" && "border-2 border-border hover:border-primary/30 hover:bg-card",
        variant === "gradient" && "gradient-border bg-card hover:shadow-card-hover hover:-translate-y-1",
        className
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
          variant === "gradient" ? "gradient-bg" : "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "w-7 h-7",
            variant === "gradient" ? "text-primary-foreground" : "text-primary"
          )}
        />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
