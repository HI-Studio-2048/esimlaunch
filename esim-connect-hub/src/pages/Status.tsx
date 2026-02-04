import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock, Activity } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

const services = [
  { name: "API", status: "operational", uptime: 99.99 },
  { name: "Dashboard", status: "operational", uptime: 99.98 },
  { name: "Payment Processing", status: "operational", uptime: 99.97 },
  { name: "eSIM Activation", status: "operational", uptime: 99.96 },
  { name: "Webhooks", status: "operational", uptime: 99.95 },
];

const statusConfig = {
  operational: { color: "text-green-600", bg: "bg-green-500/20", icon: CheckCircle2 },
  degraded: { color: "text-yellow-600", bg: "bg-yellow-500/20", icon: AlertCircle },
  outage: { color: "text-red-600", bg: "bg-red-500/20", icon: AlertCircle },
  maintenance: { color: "text-blue-600", bg: "bg-blue-500/20", icon: Clock },
};

export default function Status() {
  const overallUptime = 99.97;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="System Status"
            title="Service Status"
            description="Real-time status of all eSIMLaunch services and systems"
          />
        </div>
      </section>

      {/* Overall Status */}
      <section className="section-padding -mt-8">
        <div className="container-custom">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold">All Systems Operational</h2>
                  </div>
                  <p className="text-muted-foreground">All services are running normally</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold gradient-text mb-1">
                    <AnimatedCounter value={overallUptime} suffix="%" decimals={2} />
                  </div>
                  <p className="text-sm text-muted-foreground">30-day uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Service Status */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6">Service Status</h2>
          <div className="space-y-4">
            {services.map((service, i) => {
              const config = statusConfig[service.status as keyof typeof statusConfig];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{service.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold gradient-text">
                            <AnimatedCounter value={service.uptime} suffix="%" decimals={2} />
                          </div>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident History */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6">Incident History</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Recent Incidents</h3>
              <p className="text-muted-foreground">
                All systems have been running smoothly. We'll post updates here if any issues occur.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Metrics */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            title="Performance Metrics"
            description="Key metrics for the past 30 days"
            align="center"
          />
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { label: "Average Response Time", value: 45, suffix: "ms" },
              { label: "API Requests", value: 2.5, suffix: "M", decimals: 1 },
              { label: "Success Rate", value: 99.98, suffix: "%", decimals: 2 },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      <AnimatedCounter 
                        value={metric.value} 
                        suffix={metric.suffix} 
                        decimals={metric.decimals || 0}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

