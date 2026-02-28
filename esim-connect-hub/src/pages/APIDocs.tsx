import { useState } from "react";
import { motion } from "framer-motion";
import { Code, Key, Webhook, Book, Copy, Check } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Error codes with HTTP status and when they occur
const errorCodesReference = [
  { code: "VALIDATION_ERROR", status: 400, when: "Request body or query params fail validation (e.g. missing required field, invalid format)." },
  { code: "UNAUTHORIZED", status: 401, when: "Missing or invalid Authorization header, or API key/JWT expired or revoked." },
  { code: "MERCHANT_NOT_FOUND", status: 404, when: "Authenticated merchant record not found (rare)." },
  { code: "INSUFFICIENT_BALANCE", status: 400, when: "POST /orders: account balance is less than the order amount." },
  { code: "ORDER_NOT_FOUND", status: 404, when: "GET /orders/:orderNo: order does not exist or does not belong to your account." },
  { code: "ORDER_FAILED", status: 500, when: "POST /orders: upstream or internal error during order creation." },
  { code: "FETCH_FAILED", status: 500, when: "GET packages/orders/profiles: upstream or internal error." },
  { code: "RATE_LIMIT_EXCEEDED", status: 429, when: "Too many requests per minute for your API key." },
  { code: "CANCEL_FAILED", status: 500, when: "POST profiles/:id/cancel failed." },
  { code: "SUSPEND_FAILED", status: 500, when: "POST profiles/:id/suspend failed." },
  { code: "UNSUSPEND_FAILED", status: 500, when: "POST profiles/:id/unsuspend failed." },
  { code: "REVOKE_FAILED", status: 500, when: "POST profiles/:id/revoke failed." },
  { code: "TOPUP_FAILED", status: 500, when: "POST profiles/:id/topup failed." },
  { code: "USAGE_CHECK_FAILED", status: 500, when: "GET/POST profiles usage failed." },
  { code: "UPDATE_FAILED", status: 500, when: "PUT profiles/:id/nickname failed." },
  { code: "BALANCE_CHECK_FAILED", status: 500, when: "GET /balance failed." },
  { code: "WEBHOOK_CONFIG_FAILED", status: 500, when: "POST /webhooks failed." },
  { code: "WEBHOOK_TEST_FAILED", status: 500, when: "POST /webhooks/test failed (e.g. URL unreachable)." },
];

// Webhook event types with description and when sent
const webhookEventsDetail = [
  { event: "ORDER_STATUS", api: "ORDER_STATUS", when: "Order state changes (e.g. GOT_RESOURCE when eSIMs are ready). Payload includes orderNo, orderStatus, and often esimTranNo, transactionId." },
  { event: "esim.status", api: "ESIM_STATUS", when: "eSIM lifecycle: activated, depleted, expired, or status changes. Data includes esimTranNo, iccid, status fields." },
  { event: "data.usage", api: "DATA_USAGE", when: "Data usage thresholds (e.g. 50%, 80%, 90% used). Data includes esimTranNo, usage stats." },
  { event: "validity.usage", api: "VALIDITY_USAGE", when: "Validity/expiration warnings (e.g. 1 day remaining)." },
  { event: "balance.low", api: "BALANCE_LOW", when: "Your account balance falls below a configured threshold." },
  { event: "smdp.event", api: "SMDP_EVENT", when: "SM-DP+ related events from the eSIM platform." },
  { event: "webhook.test", api: "—", when: "Only when you call POST /webhooks/test; used to verify your endpoint receives and optionally verifies signatures." },
];

// Full reference: all /api/v1 endpoints (detailed examples below for main ones)
const allEndpointsReference = [
  { method: "GET", path: "/api/v1/packages", params: "Query: locationCode, type (BASE|TOPUP), packageCode, slug, iccid" },
  { method: "GET", path: "/api/v1/regions", params: "None. Returns supported regions/countries." },
  { method: "GET", path: "/api/v1/balance", params: "None. Returns balance in USD." },
  { method: "POST", path: "/api/v1/orders", params: "Body: transactionId, amount? (1/10000 USD), packageInfoList[]" },
  { method: "GET", path: "/api/v1/orders/:orderNo", params: "Path: orderNo. Returns order + profiles." },
  { method: "GET", path: "/api/v1/profiles", params: "Query: orderNo, iccid, esimTranNo, startTime, endTime, pager?{pageSize,pageNum}" },
  { method: "PUT", path: "/api/v1/profiles/:esimTranNo/nickname", params: "Body: { nickname }" },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/cancel", params: "None. Cancel unused eSIM." },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/suspend", params: "None." },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/unsuspend", params: "None." },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/revoke", params: "None." },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/topup", params: "Body: packageCode, transactionId, amount?, iccid?" },
  { method: "GET", path: "/api/v1/profiles/:esimTranNo/usage", params: "None. Returns data usage for one eSIM." },
  { method: "POST", path: "/api/v1/profiles/usage", params: "Body: { esimTranNoList: string[] } (max 10)." },
  { method: "POST", path: "/api/v1/profiles/:esimTranNo/sms", params: "Body: { message } (max 500 chars)." },
  { method: "GET", path: "/api/v1/webhooks", params: "None. Returns current webhook config." },
  { method: "POST", path: "/api/v1/webhooks", params: "Body: url, events?, secret?. Upserts config." },
  { method: "POST", path: "/api/v1/webhooks/test", params: "Body: url, secret?. Sends test payload." },
];

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/packages",
    description: "Retrieve all available eSIM data packages. Query params: locationCode (e.g. JP), type (BASE or TOPUP), packageCode, slug, iccid. Response: success, obj.packageList[] with packageCode, slug, name, price (in 1/10000 USD), volume, duration, locationCode, etc.",
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
    description: "Create a new eSIM order. Body: transactionId (required, max 50 chars), amount (optional, in 1/10000 USD; if omitted we compute from packageInfoList), packageInfoList (array of { packageCode or slug, count, price?, periodNum? }). Response: success, obj.orderNo; balance is deducted from your account.",
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
    method: "GET",
    path: "/api/v1/regions",
    description: "Get supported regions/countries for eSIM packages. No query params. Response: success, obj with region list.",
    example: {
      javascript: `fetch('${baseUrl}/api/v1/regions', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
}).then(res => res.json()).then(data => console.log(data));`,
      python: `import requests

response = requests.get('${baseUrl}/api/v1/regions', headers={'Authorization': 'Bearer YOUR_API_KEY'})
print(response.json())`,
      curl: `curl -X GET "${baseUrl}/api/v1/regions" -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Configure webhook URL (POST upserts by merchant). Body: url (required), events (optional array: ORDER_STATUS, ESIM_STATUS, DATA_USAGE, VALIDITY_USAGE, BALANCE_LOW, SMDP_EVENT), secret (optional, for signature).",
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

      {/* Quick start steps */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader title="Quick start (4 steps)" description="From zero to your first order and webhooks" align="center" />
          <div className="mt-10 max-w-3xl mx-auto space-y-6 text-left">
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</span>
              <div>
                <h3 className="font-semibold mb-1">Get an API key</h3>
                <p className="text-muted-foreground text-sm">Log in to the dashboard → Developer → Create API key. Copy the key (shown once). Use it as <code className="bg-muted px-1 rounded">Authorization: Bearer YOUR_API_KEY</code> in all requests.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</span>
              <div>
                <h3 className="font-semibold mb-1">List packages and check balance</h3>
                <p className="text-muted-foreground text-sm">GET <code className="bg-muted px-1 rounded">/api/v1/packages?locationCode=JP</code> to see available eSIMs. GET <code className="bg-muted px-1 rounded">/api/v1/balance</code> to see your balance in USD. Top up in the dashboard if needed.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</span>
              <div>
                <h3 className="font-semibold mb-1">Create an order</h3>
                <p className="text-muted-foreground text-sm">POST <code className="bg-muted px-1 rounded">/api/v1/orders</code> with body: <code className="bg-muted px-1 rounded">{"{ transactionId, packageInfoList }"}</code>. Use <code className="bg-muted px-1 rounded">slug</code> or <code className="bg-muted px-1 rounded">packageCode</code> from the packages response. Amount is in 1/10000 USD (10000 = $1). Response includes <code className="bg-muted px-1 rounded">obj.orderNo</code>; use it to fetch profiles with GET <code className="bg-muted px-1 rounded">/api/v1/orders/:orderNo</code> or GET <code className="bg-muted px-1 rounded">/api/v1/profiles?orderNo=...</code>.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</span>
              <div>
                <h3 className="font-semibold mb-1">Configure webhooks (recommended)</h3>
                <p className="text-muted-foreground text-sm">POST <code className="bg-muted px-1 rounded">/api/v1/webhooks</code> with <code className="bg-muted px-1 rounded">url</code> and optional <code className="bg-muted px-1 rounded">events</code> array. You will receive ORDER_STATUS when eSIMs are ready so you can avoid polling. Optionally set <code className="bg-muted px-1 rounded">secret</code> and verify <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> (HMAC-SHA256).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Overview */}
      <section className="section-padding bg-muted/20">
        <div className="container-custom">
          <SectionHeader title="API Overview" description="Base URL, authentication, conventions, errors, and limits" align="center" />
          <div className="mt-8 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto text-left">
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">Base URL</h3>
              <p className="text-muted-foreground text-sm mb-2">All requests go to your API host (e.g. production or local).</p>
              <code className="block bg-muted rounded px-2 py-1 text-sm break-all">{baseUrl}</code>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">Rate limits</h3>
              <p className="text-muted-foreground text-sm">Per API key, configurable when creating the key. Default: 100 requests per minute. Responses use standard rate-limit headers when applicable.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg md:col-span-2">
              <h3 className="font-semibold mb-2">Conventions & units</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Prices and amounts</strong> in request/response (except balance): <strong>1/10000 USD</strong>. Example: 10000 = $1.00, 59900 = $5.99.</li>
                <li><strong>Balance</strong> (GET /api/v1/balance): returned in <strong>USD</strong> (e.g. 10.50).</li>
                <li><strong>Timestamps</strong>: ISO 8601 (e.g. 2025-01-15T10:30:00Z).</li>
                <li><strong>IDs</strong>: orderNo and esimTranNo are strings from the eSIM provider; transactionId is your own (max 50 chars).</li>
                <li><strong>Pagination</strong> (GET /profiles): use query <code className="bg-muted px-1 rounded">pager[pageSize]</code> (5–500) and <code className="bg-muted px-1 rounded">pager[pageNum]</code> (1–10000). Response includes <code className="bg-muted px-1 rounded">obj.pager</code> with pageSize, pageNum, total.</li>
              </ul>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg md:col-span-2">
              <h3 className="font-semibold mb-2">Error responses</h3>
              <p className="text-muted-foreground text-sm mb-3">On validation or server errors, the API returns JSON with <code className="bg-muted px-1 rounded">success: false</code>, <code className="bg-muted px-1 rounded">errorCode</code>, and <code className="bg-muted px-1 rounded">errorMessage</code>. HTTP status is 4xx or 5xx.</p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "errorMessage": "Transaction ID must be 50 characters or less"
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Error codes reference table */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader title="Error codes reference" description="All errorCode values, HTTP status, and when they occur" align="center" />
          <div className="mt-8 overflow-x-auto max-w-4xl mx-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-lg text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">errorCode</th>
                  <th className="px-4 py-3 font-semibold">HTTP</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {errorCodesReference.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono">{row.code}</td>
                    <td className="px-4 py-2">{row.status}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  All /api/v1 requests require a Bearer token. Use either an <strong>API key</strong> (recommended for server integration) or a <strong>JWT</strong> from login. Generate API keys from the Developer page.
                </p>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm mb-4">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </div>
                <p className="text-muted-foreground text-sm">
                  Prices and amounts in the API use the smallest unit: <strong>1/10000 USD</strong> (e.g. 10000 = $1.00). Balance is returned in USD.
                </p>
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

      {/* Complete endpoint reference */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            title="Complete endpoint reference"
            description="All /api/v1 endpoints at a glance"
            align="center"
          />
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-lg text-left">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Path</th>
                  <th className="px-4 py-3 font-semibold">Params / Body</th>
                </tr>
              </thead>
              <tbody>
                {allEndpointsReference.map((ep, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ep.method === "GET" ? "bg-green-500/20 text-green-700" :
                        ep.method === "POST" ? "bg-blue-500/20 text-blue-700" :
                        "bg-amber-500/20 text-amber-700"
                      }`}>{ep.method}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{ep.path}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{ep.params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 max-w-4xl mx-auto text-left">
            <h3 className="font-semibold mb-3">HTTP status codes by endpoint</h3>
            <p className="text-sm text-muted-foreground mb-4">
              All endpoints may return 401 (missing/invalid auth) and 429 (rate limit). Most return 500 on server/upstream errors. Below are the typical success and error codes per route.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 font-semibold">Endpoint</th>
                    <th className="px-4 py-3 font-semibold">200</th>
                    <th className="px-4 py-3 font-semibold">400</th>
                    <th className="px-4 py-3 font-semibold">404</th>
                    <th className="px-4 py-3 font-semibold">500</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="px-4 py-2 font-mono">GET /packages, /regions, /balance</td><td className="px-4 py-2">Success</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td><td className="px-4 py-2">FETCH_FAILED / BALANCE_CHECK_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">POST /orders</td><td className="px-4 py-2">Order created</td><td className="px-4 py-2">VALIDATION_ERROR, INSUFFICIENT_BALANCE</td><td className="px-4 py-2">—</td><td className="px-4 py-2">ORDER_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">GET /orders/:orderNo</td><td className="px-4 py-2">Order + profiles</td><td className="px-4 py-2">—</td><td className="px-4 py-2">ORDER_NOT_FOUND</td><td className="px-4 py-2">FETCH_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">GET /profiles</td><td className="px-4 py-2">List with pager</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td><td className="px-4 py-2">FETCH_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">PUT /profiles/:id/nickname, POST .../cancel|suspend|unsuspend|revoke|topup</td><td className="px-4 py-2">Success</td><td className="px-4 py-2">VALIDATION_ERROR</td><td className="px-4 py-2">—</td><td className="px-4 py-2">UPDATE_FAILED, CANCEL_FAILED, etc.</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">GET/POST profiles usage, POST .../sms</td><td className="px-4 py-2">Success</td><td className="px-4 py-2">VALIDATION_ERROR</td><td className="px-4 py-2">—</td><td className="px-4 py-2">USAGE_CHECK_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">GET /webhooks</td><td className="px-4 py-2">Config</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">POST /webhooks</td><td className="px-4 py-2">Config saved</td><td className="px-4 py-2">VALIDATION_ERROR</td><td className="px-4 py-2">—</td><td className="px-4 py-2">WEBHOOK_CONFIG_FAILED</td></tr>
                  <tr className="border-b"><td className="px-4 py-2 font-mono">POST /webhooks/test</td><td className="px-4 py-2">Test sent</td><td className="px-4 py-2">VALIDATION_ERROR</td><td className="px-4 py-2">—</td><td className="px-4 py-2">WEBHOOK_TEST_FAILED</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Request/response schemas and examples */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader title="Request & response reference" description="Schema and example JSON for key endpoints" align="center" />
          <div className="mt-10 space-y-10 max-w-4xl mx-auto text-left">
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">GET /api/v1/packages — Query parameters</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b"><th className="text-left py-2 pr-4">Param</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Description</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">locationCode</td><td className="py-2 pr-4">string</td><td className="py-2">e.g. JP, US. Filter by country/region.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">type</td><td className="py-2 pr-4">BASE | TOPUP</td><td className="py-2">Package type.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">packageCode</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by package code.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">slug</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by slug (e.g. JP_1_7).</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">iccid</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by ICCID.</td></tr>
                </tbody>
              </table>
              <h4 className="font-medium mt-4 mb-2">Example success response</h4>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": true,
  "obj": {
    "packageList": [
      {
        "packageCode": "JP_1_7",
        "slug": "JP_1_7",
        "name": "Japan 1GB 7 days",
        "price": 59900,
        "volume": 1073741824,
        "duration": 7,
        "durationUnit": "day",
        "location": "Japan",
        "locationCode": "JP",
        "activeType": "1",
        "dataType": 1
      }
    ]
  }
}`}</pre>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">POST /api/v1/orders — Request body</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b"><th className="text-left py-2 pr-4">Field</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Description</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">transactionId</td><td className="py-2 pr-4">string (max 50)</td><td className="py-2">Required. Your unique id for this order.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">amount</td><td className="py-2 pr-4">integer</td><td className="py-2">Optional. Total in 1/10000 USD. If omitted, computed from packageInfoList.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">packageInfoList</td><td className="py-2 pr-4">array</td><td className="py-2">Required. Each: packageCode or slug, count (≥1), price? (1/10000 USD), periodNum? (1–365 for daily plans).</td></tr>
                </tbody>
              </table>
              <h4 className="font-medium mt-4 mb-2">Example success response</h4>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": true,
  "obj": { "orderNo": "B25080914060004" },
  "orderId": "uuid-in-our-db"
}`}</pre>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">GET /api/v1/profiles — Query parameters</h3>
              <p className="text-sm text-muted-foreground mb-2">At least one of orderNo, iccid, esimTranNo is typically used; or startTime/endTime for range. Pagination optional.</p>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b"><th className="text-left py-2 pr-4">Param</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Description</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">orderNo</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by order number.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">iccid</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by ICCID.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">esimTranNo</td><td className="py-2 pr-4">string</td><td className="py-2">Filter by eSIM transaction number.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">startTime, endTime</td><td className="py-2 pr-4">string</td><td className="py-2">Time range (ISO 8601).</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">pager.pageSize</td><td className="py-2 pr-4">5–500</td><td className="py-2">Page size.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">pager.pageNum</td><td className="py-2 pr-4">1–10000</td><td className="py-2">Page number.</td></tr>
                </tbody>
              </table>
              <h4 className="font-medium mt-4 mb-2">Example success response (excerpt)</h4>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": true,
  "obj": {
    "esimList": [
      {
        "esimTranNo": "25091113270004",
        "orderNo": "B25080914060004",
        "iccid": "...",
        "qrCodeUrl": "https://...",
        "ac": "LPA:1$...",
        "packageName": "Japan 1GB 7 days",
        "nickname": null
      }
    ],
    "pager": { "pageSize": 20, "pageNum": 1, "total": 1 }
  }
}`}</pre>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">GET /api/v1/balance — Response</h3>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": true,
  "data": { "balance": 10.50 }
}`}</pre>
              <p className="text-sm text-muted-foreground mt-2">Balance is in USD.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold mb-2">POST /api/v1/webhooks — Request body</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b"><th className="text-left py-2 pr-4">Field</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Description</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">url</td><td className="py-2 pr-4">string (URL)</td><td className="py-2">Required. Your webhook endpoint URL.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">events</td><td className="py-2 pr-4">string[]</td><td className="py-2">Optional. One or more: ORDER_STATUS, ESIM_STATUS, DATA_USAGE, VALIDITY_USAGE, BALANCE_LOW, SMDP_EVENT. Empty = all.</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">secret</td><td className="py-2 pr-4">string</td><td className="py-2">Optional. Used to sign payloads (X-Webhook-Signature: HMAC-SHA256).</td></tr>
                </tbody>
              </table>
              <h4 className="font-medium mt-4 mb-2">GET /api/v1/webhooks — Example response</h4>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{`{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://your-domain.com/webhooks",
    "events": ["ORDER_STATUS", "ESIM_STATUS"],
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints (detailed examples) */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <SectionHeader
            title="Detailed examples"
            description="Request examples for the most common operations (JavaScript, Python, cURL)"
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
                Receive real-time notifications about events in your eSIMLaunch account. Configure webhooks via POST /api/v1/webhooks (or in the dashboard) to get instant updates on orders, activations, and more.
              </p>
              <h3 className="font-semibold mb-2">Webhook event types</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-2 font-semibold">Event (payload)</th>
                      <th className="text-left py-2 pr-2 font-semibold">API enum</th>
                      <th className="text-left py-2 font-semibold">When sent</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {webhookEventsDetail.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-mono text-xs">{row.event}</td>
                        <td className="py-2 pr-2 font-mono text-xs">{row.api}</td>
                        <td className="py-2">{row.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <h3 className="font-semibold mt-6 mb-2">Verifying webhook signatures</h3>
              <p className="text-muted-foreground text-sm mb-2">
                If you set a <code className="bg-muted px-1 rounded">secret</code> when configuring the webhook, we send an <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> header. Verify it with HMAC-SHA256 using your secret and the raw request body (UTF-8).
              </p>
              <pre className="bg-muted rounded-lg p-3 overflow-x-auto text-xs">
                <code>{`// Node.js
const crypto = require('crypto');
const sig = req.headers['x-webhook-signature'];
const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
if (sig !== expected) return res.status(401).send('Invalid signature');`}</code>
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

