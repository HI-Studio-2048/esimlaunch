import { motion } from "framer-motion";
import { STORE_TEMPLATES, type StoreTemplateOption } from "@/lib/storeTemplates";
import { ExternalLink } from "lucide-react";

const TEMPLATE_PREVIEWS: Record<string, { description: string; features: string[] }> = {
  default: {
    description: 'The original eSIMLaunch template. Purple gradient hero, card-based destination grid, violet accents throughout. Reliable and familiar.',
    features: ['Gradient hero section', 'Card-based country grid', 'Violet/purple accent system', 'Accordion FAQ section', 'Standard top navigation'],
  },
  minimal: {
    description: 'Inspired by Revolut and Wise. Pure white backgrounds, teal accents, Inter font. Utility-class design system with compact country cards.',
    features: ['White + teal (#00c9a7) color system', 'Inter font — fintech feel', 'Compact card rows with arrow navigation', 'Stats grid in hero', '"How it works" stepped section'],
  },
  bold: {
    description: 'Full dark mode. Deep navy backgrounds, electric blue + teal glow effects, glassmorphism cards. Mobile bottom nav bar for an app-like experience.',
    features: ['Dark mode (#080b18 navy)', 'Electric blue (#4f7eff) + teal glow', 'Mobile bottom navigation bar', 'Animated radial glow orbs', 'Gradient text headline', 'DM Sans font'],
  },
  travel: {
    description: 'Apple Store aesthetic. Warm gray (#f5f5f7) canvas, near-black CTAs, Geist font. Editorial typography, full-width section strips.',
    features: ['Warm gray canvas background', 'Near-black (#1d1d1f) pill buttons', 'Geist font — geometric precision', 'Oversized display typography', 'Full-width alternating sections', 'Frosted glass navbar'],
  },
};

export default function TemplateGallery() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Store Templates</h1>
        <p className="text-muted-foreground">
          These are the 4 templates available for Easy Way stores. Each one is a completely unique design — different layout, typography, color system, and UX patterns.
        </p>
      </div>

      {/* Template cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {STORE_TEMPLATES.map((tpl, i) => (
          <TemplateShowcase key={tpl.key} template={tpl} index={i} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 rounded-xl border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          <strong>How it works:</strong> When a merchant signs up for Easy Way, they choose a template and their brand colors during onboarding. Our team then clones the template, applies their branding, fills in their data, and deploys the store.
        </p>
      </div>
    </div>
  );
}

function TemplateShowcase({ template, index }: { template: StoreTemplateOption; index: number }) {
  const ps = template.previewStyle;
  const preview = TEMPLATE_PREVIEWS[template.key];
  const Icon = template.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-xl border bg-card"
    >
      {/* Preview mockup */}
      <div
        className="relative h-48 px-6 pt-5 overflow-hidden"
        style={{ background: ps.bg }}
      >
        {/* Simulated navbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-2.5 w-16 rounded-full" style={{ background: ps.accent, opacity: 0.8 }} />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="h-2 w-8 rounded-full" style={{ background: ps.text, opacity: 0.12 }} />
            ))}
          </div>
        </div>

        {/* Simulated hero */}
        <div className="space-y-2 mb-4">
          <div className="h-5 w-3/4 rounded" style={{ background: ps.text, opacity: 0.65 }} />
          <div className="h-3 w-1/2 rounded" style={{ background: ps.text, opacity: 0.2 }} />
          <div className="mt-3 h-7 w-24 rounded-full" style={{ background: ps.accent, opacity: 0.9 }} />
        </div>

        {/* Simulated card grid */}
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(j => (
            <div
              key={j}
              className="h-14 flex-1 rounded-lg"
              style={{
                background: ps.card,
                boxShadow: ps.bg === '#080b18'
                  ? '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            <span className="text-xs text-muted-foreground">{template.tagline}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {preview?.description}
        </p>

        {preview?.features && (
          <div className="flex flex-wrap gap-1.5">
            {preview.features.map(f => (
              <span key={f} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Color swatches + preview link */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Colors:</span>
            <div className="flex gap-1.5">
              <div className="h-5 w-5 rounded-full border border-border" style={{ background: ps.bg }} title="Background" />
              <div className="h-5 w-5 rounded-full border border-border" style={{ background: ps.accent }} title="Accent" />
              <div className="h-5 w-5 rounded-full border border-border" style={{ background: ps.text }} title="Text" />
              <div className="h-5 w-5 rounded-full border border-border" style={{ background: ps.card }} title="Card" />
            </div>
          </div>
          {template.previewUrl && (
            <a
              href={template.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Live Preview
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
