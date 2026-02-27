import { useState } from "react";
import { motion } from "framer-motion";
import { Code, Key, Webhook, Book, Copy, Check } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/packages",
    description: "Retrieve all available eSIM data packages. Optionally filter by country, type (BASE/TOPUP), or package code.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/packages?locationCode=JP&type=BASE', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
params = {'locationCode': 'JP', 'type': 'BASE'}
response = requests.get('${baseUrl}/api/v1/packages', headers=headers, params=params)
print(response.json())`,
      curl: `curl -X GET "${baseUrl}/api/v1/packages?locationCode=JP&type=BASE" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  },
  {
    method: "POST",
    path: "/api/v1/orders",
    description: "Create a new eSIM order. Supports single or batch orders with multiple packages.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transactionId: 'txn_123456',
    packageInfoList: [{
      slug: 'JP_1_7',
      count: 1,
      price: 10000
    }]
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
data = {
  'transactionId': 'txn_123456',
  'packageInfoList': [{
    'slug': 'JP_1_7',
    'count': 1,
    'price': 10000
  }]
}
response = requests.post('${baseUrl}/api/v1/orders', headers=headers, json=data)
print(response.json())`,
      curl: `curl -X POST "${baseUrl}/api/v1/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "txn_123456",
    "packageInfoList": [{
      "slug": "JP_1_7",
      "count": 1,
      "price": 10000
    }]
  }'`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/orders/:orderNo",
    description: "Get order details and eSIM profiles by order number.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/orders/B25080914060004', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get('${baseUrl}/api/v1/orders/B25080914060004', headers=headers)
print(response.json())`,
      curl: `curl -X GET "${baseUrl}/api/v1/orders/B25080914060004" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/profiles",
    description: "Query eSIM profiles by orderNo, iccid, esimTranNo, or time range with pagination.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/profiles?esimTranNo=25091113270004', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
params = {'esimTranNo': '25091113270004'}
response = requests.get('${baseUrl}/api/v1/profiles', headers=headers, params=params)
print(response.json())`,
      curl: `curl -X GET "${baseUrl}/api/v1/profiles?esimTranNo=25091113270004" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  },
  {
    method: "POST",
    path: "/api/v1/profiles/:esimTranNo/topup",
    description: "Add additional data to an existing eSIM profile.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/profiles/25091113270004/topup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    packageCode: 'TOPUP_JC172',
    transactionId: 'topup_txn_123'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
data = {
  'packageCode': 'TOPUP_JC172',
  'transactionId': 'topup_txn_123'
}
response = requests.post('${baseUrl}/api/v1/profiles/25091113270004/topup', headers=headers, json=data)
print(response.json())`,
      curl: `curl -X POST "${baseUrl}/api/v1/profiles/25091113270004/topup" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "packageCode": "TOPUP_JC172",
    "transactionId": "topup_txn_123"
  }'`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/balance",
    description: "Check your account balance in USD.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/balance', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get('${baseUrl}/api/v1/balance', headers=headers)
print(response.json())`,
      curl: `curl -X GET "${baseUrl}/api/v1/balance" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Configure webhook URL to receive real-time notifications about order status, eSIM events, and data usage.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-domain.com/webhooks',
    events: ['ORDER_STATUS', 'ESIM_STATUS', 'DATA_USAGE']
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      python: `import requests

headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
data = {
  'url': 'https://your-domain.com/webhooks',
  'events': ['ORDER_STATUS', 'ESIM_STATUS', 'DATA_USAGE']
}
response = requests.post('${baseUrl}/api/v1/webhooks', headers=headers, json=data)
print(response.json())`,
      curl: `curl -X POST "${baseUrl}/api/v1/webhooks" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/webhooks",
    "events": ["ORDER_STATUS", "ESIM_STATUS", "DATA_USAGE"]
  }'`,
    },
  },
];

export default function APIDocs() {
  const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "curl">("javascript");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Developer Resources"
            title="API Documentation"
            description="Integrate eSIMLaunch into your application with our comprehensive REST API. Build custom experiences, automate workflows, and scale your business."
          />
        </div>
      </section>

      {/* Quick Start */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="bg-card rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                    <Key className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Authentication</h2>
                    <p className="text-muted-foreground">Get your API key from the dashboard</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  All API requests require authentication using a Bearer token. You can generate API keys from the Developer page in your dashboard.
                </p>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-xl h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Book className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Resources</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>REST API v1</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Webhooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>SDKs (Coming Soon)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Rate Limits</span>
                  </li>
                </ul>
                <Button variant="gradient" className="w-full mt-6" asChild>
                  <a href="/dashboard">Get API Key</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="API Endpoints"
            description="Explore our API endpoints with interactive examples"
            align="center"
          />

          <div className="mt-12 space-y-6">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-8 shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        endpoint.method === "GET" ? "bg-green-500/20 text-green-600" :
                        endpoint.method === "POST" ? "bg-blue-500/20 text-blue-600" :
                        "bg-yellow-500/20 text-yellow-600"
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-muted-foreground">{endpoint.description}</p>
                  </div>
                </div>

                <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as any)} className="mt-6">
                  <TabsList>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  <TabsContent value={selectedLanguage} className="mt-4">
                    <div className="relative">
                      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                        <code>{endpoint.example[selectedLanguage]}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(endpoint.example[selectedLanguage], index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Webhooks Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Webhooks</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Receive real-time notifications about events in your eSIMLaunch account. Configure webhooks in your dashboard to get instant updates on orders, activations, and more.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  order.status - Order ready for retrieval
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  esim.status - eSIM lifecycle events (activated, depleted, expired)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  data.usage - Data usage thresholds (50%, 80%, 90%)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  validity.usage - Expiration warnings (1 day remaining)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  balance.low - Low account balance alerts
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-xl"
            >
              <h3 className="font-semibold mb-4">Example Webhook Payload</h3>
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs">
                <code>{`{
  "event": "order.status",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "orderNo": "B25080914060004",
    "orderStatus": "GOT_RESOURCE",
    "esimTranNo": "25091113270004",
    "transactionId": "your_txn_id"
  }
}`}</code>
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Integrate?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start building with our API today. Get your API key from the dashboard and start making requests in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <a href="/dashboard">Get API Key</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

