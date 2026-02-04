import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {badge && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-bg text-primary-foreground mb-4"
        >
          {badge}
        </motion.span>
      )}
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground text-balance">
          {description}
        </p>
      )}
    </motion.div>
  );
}
