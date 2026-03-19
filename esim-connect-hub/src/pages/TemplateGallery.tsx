import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { STORE_TEMPLATES, type StoreTemplateOption } from "@/lib/storeTemplates";
import { ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const TEMPLATE_PREVIEWS: Record<string, { features: string[] }> = {
  default: {
    features: ['Gradient hero', 'Card grid', 'Violet accents', 'FAQ accordion'],
  },
  minimal: {
    features: ['Teal accents', 'Inter font', 'Compact cards', 'Stats grid'],
  },
  bold: {
    features: ['Full dark mode', 'Electric blue glow', 'Bottom nav', 'DM Sans'],
  },
  travel: {
    features: ['Warm gray canvas', 'Black pill CTAs', 'Geist font', 'Editorial layout'],
  },
};

export default function TemplateGallery() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              4 Unique Designs
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Store Templates
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Each template is a completely unique design — different layout, typography, color system, and UX. Pick one during onboarding and we build your store with it.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/onboarding" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Templates grid */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {STORE_TEMPLATES.map((tpl, i) => (
            <TemplateShowcase key={tpl.key} template={tpl} index={i} />
          ))}
        </div>

        {/* CTA bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center rounded-2xl border bg-card/50 p-8 sm:p-10"
        >
          <h2 className="text-xl font-semibold mb-2">Ready to launch?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Choose your template and brand colors during signup. Our team handles the rest — your store goes live within 1–2 business days.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="gradient" asChild>
              <Link to="/onboarding" className="gap-2">
                Create Your Store <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function TemplateShowcase({ template, index }: { template: StoreTemplateOption; index: number }) {
  const ps = template.previewStyle;
  const preview = TEMPLATE_PREVIEWS[template.key];
  const Icon = template.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30"
    >
      {/* Preview mockup — browser chrome */}
      <div className="relative overflow-hidden" style={{ background: ps.bg }}>
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: ps.bg === '#080b18' ? '#0f1224' : 'rgba(0,0,0,0.04)' }}>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="h-2 w-2 rounded-full" style={{ background: '#febc2e' }} />
            <div className="h-2 w-2 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <div
            className="ml-3 h-4 flex-1 max-w-[200px] rounded-full"
            style={{ background: ps.bg === '#080b18' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
          />
        </div>

        {/* Page content mockup */}
        <div className="px-5 pb-5 pt-2 space-y-3">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <div className="h-2 w-12 rounded-full" style={{ background: ps.accent, opacity: 0.9 }} />
            <div className="flex gap-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-1.5 w-7 rounded-full" style={{ background: ps.text, opacity: 0.1 }} />
              ))}
            </div>
          </div>

          {/* Hero */}
          <div className="pt-2 space-y-1.5">
            <div className="h-4 w-[70%] rounded" style={{ background: ps.text, opacity: 0.6 }} />
            <div className="h-2.5 w-[50%] rounded" style={{ background: ps.text, opacity: 0.18 }} />
            <div className="pt-2">
              <div className="h-5 w-16 rounded-full" style={{ background: ps.accent, opacity: 0.85 }} />
            </div>
          </div>

          {/* Cards */}
          <div className="flex gap-2 pt-1">
            {[1, 2, 3, 4].map(j => (
              <div
                key={j}
                className="h-10 flex-1 rounded-md"
                style={{
                  background: ps.card,
                  boxShadow: ps.bg === '#080b18'
                    ? '0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              />
            ))}
          </div>

          {/* Second row */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(j => (
              <div
                key={j}
                className="h-10 flex-1 rounded-md"
                style={{
                  background: ps.card,
                  boxShadow: ps.bg === '#080b18'
                    ? '0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <span className="text-[11px] text-muted-foreground">{template.tagline}</span>
            </div>
          </div>
          {template.previewUrl && (
            <a
              href={template.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Live Preview
            </a>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {template.description}
        </p>

        {/* Feature pills + color swatches inline */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {preview?.features.map(f => (
              <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <div className="h-4 w-4 rounded-full border border-border" style={{ background: ps.bg }} />
            <div className="h-4 w-4 rounded-full border border-border" style={{ background: ps.accent }} />
            <div className="h-4 w-4 rounded-full border border-border" style={{ background: ps.text }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
