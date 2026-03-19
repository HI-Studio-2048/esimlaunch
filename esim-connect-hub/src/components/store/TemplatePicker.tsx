import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Check, ExternalLink } from "lucide-react";
import { STORE_TEMPLATES, COLOR_PRESETS, SCHEDULE_CALL_URL, type StoreTemplateOption, type ColorPreset } from "@/lib/storeTemplates";
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
          Pick a design direction for your store. Our team will build it using this template and your brand colors.
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
                  Schedule a call and we&apos;ll bring your idea to life.
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
  const ps = template.previewStyle;

  return (
    <motion.div whileHover={disabled ? undefined : { scale: 1.01 }} whileTap={disabled ? undefined : { scale: 0.99 }}>
      <Card
        className={cn(
          "cursor-pointer transition-all overflow-hidden",
          selected && "ring-2 ring-primary",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={onSelect}
      >
        {/* Mini preview */}
        <div
          className="relative h-28 px-4 pt-4 overflow-hidden"
          style={{ background: ps.bg }}
        >
          {/* Simulated nav bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-2 w-12 rounded-full" style={{ background: ps.accent, opacity: 0.8 }} />
            <div className="flex gap-1.5">
              <div className="h-1.5 w-6 rounded-full" style={{ background: ps.text, opacity: 0.15 }} />
              <div className="h-1.5 w-6 rounded-full" style={{ background: ps.text, opacity: 0.15 }} />
              <div className="h-1.5 w-6 rounded-full" style={{ background: ps.text, opacity: 0.15 }} />
            </div>
          </div>
          {/* Simulated hero text */}
          <div className="space-y-1.5 mb-3">
            <div className="h-3 w-3/4 rounded-full" style={{ background: ps.text, opacity: 0.7 }} />
            <div className="h-2 w-1/2 rounded-full" style={{ background: ps.text, opacity: 0.25 }} />
          </div>
          {/* Simulated cards */}
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-8 flex-1 rounded"
                style={{ background: ps.card, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            ))}
          </div>
          {/* Selected checkmark */}
          {selected && (
            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{template.name}</CardTitle>
                <span className="text-xs text-muted-foreground">{template.tagline}</span>
              </div>
            </div>
            {template.previewUrl && (
              <a
                href={template.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Preview
              </a>
            )}
          </div>
          <CardDescription className="text-xs leading-relaxed">{template.description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

// ─── Color Picker ─────────────────────────────────────────────────────────

interface ColorPickerProps {
  selectedPreset: ColorPreset | null;
  customPrimary: string;
  customSecondary: string;
  customAccent: string;
  onPresetSelect: (preset: ColorPreset) => void;
  onCustomChange: (field: 'primary' | 'secondary' | 'accent', value: string) => void;
  disabled?: boolean;
}

export function ColorPicker({
  selectedPreset,
  customPrimary,
  customSecondary,
  customAccent,
  onPresetSelect,
  onCustomChange,
  disabled,
}: ColorPickerProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold mb-1">Choose your brand colors</h3>
        <p className="text-sm text-muted-foreground">
          Pick a preset or enter your exact brand colors. We&apos;ll apply these to your chosen template.
        </p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {COLOR_PRESETS.map((preset) => {
          const active = selectedPreset?.name === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              disabled={disabled}
              onClick={() => onPresetSelect(preset)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex -space-x-1">
                <div className="h-5 w-5 rounded-full border-2 border-background" style={{ background: preset.primary }} />
                <div className="h-5 w-5 rounded-full border-2 border-background" style={{ background: preset.secondary }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom color inputs */}
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { label: 'Primary Color', field: 'primary' as const, value: customPrimary },
          { label: 'Secondary Color', field: 'secondary' as const, value: customSecondary },
          { label: 'Accent Color', field: 'accent' as const, value: customAccent },
        ]).map(({ label, field, value }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <input
                type="color"
                value={value}
                onChange={e => onCustomChange(field, e.target.value)}
                disabled={disabled}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={value}
                onChange={e => onCustomChange(field, e.target.value)}
                disabled={disabled}
                className="flex-1 bg-transparent text-sm font-mono outline-none"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Preview strip */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <span className="text-xs text-muted-foreground">Preview:</span>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg" style={{ background: customPrimary }} />
          <div className="h-8 w-8 rounded-lg" style={{ background: customSecondary }} />
          <div className="h-8 w-8 rounded-lg" style={{ background: customAccent }} />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: customPrimary }}>
            Button
          </div>
          <div className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: customPrimary, color: customPrimary }}>
            Outline
          </div>
        </div>
      </div>
    </div>
  );
}
