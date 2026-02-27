import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { STORE_TEMPLATES, SCHEDULE_CALL_URL, type StoreTemplateOption } from "@/lib/storeTemplates";
import type { TemplateKey } from "@/hooks/usePublicStore";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  value: TemplateKey | null;
  onChange: (key: TemplateKey) => void;
  showScheduleCall?: boolean;
  disabled?: boolean;
}

export function TemplatePicker({ value, onChange, showScheduleCall = true, disabled }: TemplatePickerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Choose a store template</h3>
        <p className="text-sm text-muted-foreground">
          Pick a design that fits your brand. You can change colors and edit sections later without breaking anything.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {STORE_TEMPLATES.map((tpl) => (
          <TemplateCard
            key={tpl.key}
            template={tpl}
            selected={value === tpl.key}
            onSelect={() => !disabled && onChange(tpl.key)}
            disabled={disabled}
          />
        ))}
      </div>

      {showScheduleCall && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Want a fully custom design?</p>
                <p className="text-sm text-muted-foreground">
                  Schedule a call and we’ll bring your idea to life.
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href={SCHEDULE_CALL_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Schedule a call
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
  disabled,
}: {
  template: StoreTemplateOption;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const Icon = template.icon;
  return (
    <motion.div whileHover={disabled ? undefined : { scale: 1.01 }} whileTap={disabled ? undefined : { scale: 0.99 }}>
      <Card
        className={cn(
          "cursor-pointer transition-all",
          selected && "ring-2 ring-primary",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{template.name}</CardTitle>
          <CardDescription className="text-sm">{template.description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );
}
