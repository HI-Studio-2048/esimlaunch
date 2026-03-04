import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, ArrowRight, Share2, Twitter, Linkedin, Facebook, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const allPosts = [
  {
    title: "The Complete Guide to Starting Your eSIM Reselling Business in 2026",
    excerpt: "Everything you need to know about launching a successful eSIM business, from choosing providers to marketing strategies.",
    category: "Guide",
    readTime: "12 min read",
    date: "Jan 15, 2026",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
    author: { name: "Sarah Chen", role: "Head of Content" },
    content: `
The eSIM industry is booming, and 2026 is the perfect time to start your reselling business. With global eSIM adoption expected to reach 6 billion connections by 2028, the opportunity is massive.

## Why Start an eSIM Business?

The traditional SIM card market is rapidly shifting toward embedded SIMs. Travelers, remote workers, and businesses are all looking for flexible, instant connectivity solutions. As a reseller, you sit at the intersection of supply (eSIM providers) and demand (end users).

### Key Advantages:
- **Low startup costs** — No physical inventory needed
- **Global reach** — Sell to customers worldwide from day one
- **Recurring revenue** — Many customers purchase eSIMs for every trip
- **Scalable** — Automated fulfillment means no manual work per order

## Step 1: Choose Your Niche

Not all eSIM businesses are the same. Consider focusing on:

1. **Travel eSIMs** — The largest segment, targeting tourists and business travelers
2. **IoT/M2M connectivity** — For businesses deploying connected devices
3. **Enterprise solutions** — Bulk plans for companies with traveling employees
4. **Regional specialists** — Deep expertise in specific markets (e.g., Southeast Asia, Europe)

## Step 2: Select Your Providers

eSIMLaunch is powered exclusively by eSIM Access, a leading global eSIM infrastructure provider:

- **eSIM Access** — 190+ countries, enterprise-grade APIs, real-time eSIM provisioning, competitive wholesale rates

Your store automatically taps into the full eSIM Access catalog, giving you instant access to thousands of plans across every major region.

## Step 3: Build Your Storefront

With platforms like eSIMLaunch, you can get a fully branded store live quickly. Key features to look for:

- White-label branding (your logo, your domain)
- Automated order fulfillment
- Multi-provider support
- Analytics dashboard
- SEO tools built in

## Step 4: Set Your Pricing

Your margin strategy is critical. Consider:

- **Cost-plus pricing**: Add a fixed percentage to provider costs
- **Value-based pricing**: Price based on perceived value (convenience, support)
- **Competitive pricing**: Match or slightly undercut competitors

Most resellers achieve 30-50% margins on data plans.

## Step 5: Market Your Business

The most effective channels for eSIM businesses:

1. **SEO & Content Marketing** — Target "buy eSIM [country]" keywords
2. **Social Media** — Travel influencer partnerships
3. **Google Ads** — High-intent search campaigns
4. **Affiliate Programs** — Let travel bloggers promote your store
5. **Email Marketing** — Nurture leads with travel tips and deals

## Getting Started Today

The barrier to entry has never been lower. With the right platform, provider partnerships, and marketing strategy, you can build a profitable eSIM business that serves customers worldwide.

Ready to launch? Sign up for eSIMLaunch and have your store live today.
    `,
  },
  {
    title: "Understanding eSIM Technology: A Beginner's Overview",
    excerpt: "Learn the basics of eSIM technology and how it's revolutionizing mobile connectivity.",
    category: "Technology",
    readTime: "5 min read",
    date: "Jan 12, 2026",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    author: { name: "Alex Rivera", role: "Tech Writer" },
    content: `
An eSIM (embedded SIM) is a small chip built directly into a device that replaces the traditional physical SIM card. Instead of swapping tiny cards, users can download carrier profiles digitally.

## How Does an eSIM Work?

The eSIM chip is soldered onto the device's motherboard during manufacturing. It stores a unique identifier that can be reprogrammed remotely with different carrier profiles.

### The Activation Process:
1. Purchase an eSIM plan from a provider or reseller
2. Receive a QR code or activation link
3. Scan the QR code with your device's camera
4. The carrier profile downloads and installs automatically
5. You're connected — often in under 60 seconds

## Benefits of eSIM Technology

- **Instant activation** — No waiting for physical delivery
- **Dual SIM capability** — Keep your home number while adding a travel plan
- **Environmentally friendly** — No plastic SIM cards or packaging
- **More secure** — Harder to clone than physical SIMs
- **Space-saving** — Frees up device space for larger batteries or other components

## Which Devices Support eSIM?

As of 2026, eSIM support is near-universal in flagship devices:

- **Apple**: iPhone XS and later, iPad Pro, Apple Watch
- **Samsung**: Galaxy S20 and later, Galaxy Z Fold/Flip series
- **Google**: Pixel 3 and later
- **Others**: Motorola, OnePlus, Microsoft Surface, many more

## The Future of eSIM

The industry is moving toward iSIM (integrated SIM), where SIM functionality is built directly into the device's main processor. This will make connectivity even more seamless and cost-effective.

For resellers, this evolution means a growing addressable market and increasing consumer familiarity with digital SIM technology.
    `,
  },
  {
    title: "5 Marketing Strategies That Work for eSIM Businesses",
    excerpt: "Proven marketing tactics to grow your eSIM customer base and increase sales.",
    category: "Marketing",
    readTime: "8 min read",
    date: "Jan 10, 2026",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    author: { name: "Sarah Chen", role: "Head of Content" },
    content: `
Marketing an eSIM business requires a blend of digital strategies tailored to travelers and tech-savvy consumers. Here are five proven approaches.

## 1. SEO-First Content Strategy

Target high-intent keywords like "buy eSIM for Japan" or "best eSIM for Europe." Create destination-specific landing pages with:
- Plan comparisons by country
- Setup guides with screenshots
- FAQs about local connectivity

## 2. Influencer Partnerships

Travel influencers are your best advocates. Structure partnerships around:
- Affiliate commission per sale (typically 15-25%)
- Sponsored "how I stay connected" content
- Discount codes for their audience

## 3. Google Ads for High-Intent Searches

Capture users actively searching for eSIM solutions:
- Bid on "eSIM [country]" keywords
- Use ad extensions to show pricing
- Create dedicated landing pages per campaign

## 4. Email Marketing Automation

Build sequences for:
- Post-purchase: Setup help → review request → referral incentive
- Abandoned cart: Reminder → discount → urgency
- Seasonal: Holiday travel reminders with destination guides

## 5. Strategic Partnerships

Partner with complementary travel businesses:
- Travel insurance companies
- Flight booking platforms
- Hotel chains and OTAs
- Travel gear brands

Each partnership creates a new distribution channel with warm leads already planning trips.
    `,
  },
  {
    title: "How to Choose the Right eSIM Providers for Your Store",
    excerpt: "A comprehensive comparison of top eSIM providers and what to consider when choosing.",
    category: "Business",
    readTime: "6 min read",
    date: "Jan 8, 2026",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
    author: { name: "Alex Rivera", role: "Tech Writer" },
    content: `
Choosing the right eSIM provider is one of the most critical decisions for your reselling business. Here's how to evaluate your options.

## Key Evaluation Criteria

### 1. Coverage
How many countries and regions does the provider cover? Look for providers with 150+ country coverage for a travel-focused store.

### 2. Pricing & Margins
Compare wholesale rates across providers. Your margin needs to be sustainable (aim for 30%+ after all costs).

### 3. API Quality
A well-documented, reliable API means faster integration and fewer support tickets. Test the sandbox environment before committing.

### 4. Support & SLAs
When something goes wrong (and it will), you need responsive support. Look for providers offering 24/7 technical support and clear SLAs.

### 5. Activation Success Rate
Not all providers have the same reliability. Ask for activation success rate data — anything above 98% is good.

## Top Provider Comparison

| Provider | Countries | API | Best For |
|----------|-----------|-----|----------|
| eSIM Access | 190+ | Excellent | Global coverage & enterprise API |

## Our Recommendation

Start with one primary provider for your core markets, then add a second provider for gap coverage. This gives you redundancy without overcomplicating your operations.
    `,
  },
  {
    title: "Maximizing Profit Margins: Pricing Strategies for eSIM Resellers",
    excerpt: "Expert tips on setting competitive prices while maintaining healthy profit margins.",
    category: "Business",
    readTime: "7 min read",
    date: "Jan 5, 2026",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&q=80",
    author: { name: "Sarah Chen", role: "Head of Content" },
    content: `
Pricing is both an art and a science. Get it right and you'll build a sustainable business. Get it wrong and you'll either lose customers or erode your margins.

## Understanding Your Cost Structure

Before setting prices, know your costs:
- **Provider wholesale cost** (your biggest cost)
- **Platform fees** (eSIMLaunch subscription)
- **Payment processing** (typically 2.9% + $0.30)
- **Marketing/acquisition cost** per customer
- **Support costs** per ticket

## Pricing Strategies

### 1. Tiered Markup
Apply different markups based on plan size:
- Small plans (1-3GB): 50-60% markup
- Medium plans (5-10GB): 35-45% markup
- Large plans (20GB+): 25-35% markup

### 2. Destination-Based Pricing
Charge more for high-demand destinations where customers are less price-sensitive (e.g., Japan, USA) and less for competitive markets.

### 3. Bundle Pricing
Create bundles like "Europe Traveler Pack" that combine multiple country plans at a slight discount, increasing average order value.

## Optimization Tips

- A/B test prices regularly
- Monitor competitor pricing weekly
- Offer loyalty discounts for repeat customers
- Use urgency tactics for seasonal destinations
    `,
  },
  {
    title: "The Future of Travel Connectivity: eSIM Trends to Watch",
    excerpt: "Emerging trends in the eSIM industry and what they mean for resellers.",
    category: "Industry",
    readTime: "4 min read",
    date: "Jan 3, 2026",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&q=80",
    author: { name: "Alex Rivera", role: "Tech Writer" },
    content: `
The eSIM industry is evolving rapidly. Here are the key trends shaping the future of travel connectivity.

## 1. Universal eSIM Support
By 2027, virtually all new smartphones will support eSIM. Some manufacturers are already removing physical SIM trays entirely, making eSIM the default.

## 2. 5G eSIM Plans
As 5G networks expand globally, travelers will expect high-speed data wherever they go. Premium 5G eSIM plans will command higher prices and margins.

## 3. Multi-Profile Management
Future devices will support 8+ eSIM profiles simultaneously, enabling travelers to maintain connections across multiple countries without deleting old profiles.

## 4. IoT Expansion
The Internet of Things is creating massive new demand for embedded connectivity — from smart luggage to wearables to rental car systems.

## 5. AI-Powered Recommendations
Expect platforms to use AI to recommend optimal plans based on travel itineraries, usage patterns, and budget preferences.

## What This Means for Resellers

These trends point to a larger, more sophisticated market. Resellers who invest in multi-provider coverage, premium plan options, and excellent user experience will thrive.
    `,
  },
  {
    title: "Customer Support Best Practices for eSIM Businesses",
    excerpt: "How to provide excellent customer support and build lasting relationships.",
    category: "Customer Service",
    readTime: "5 min read",
    date: "Jan 1, 2026",
    image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&q=80",
    author: { name: "Sarah Chen", role: "Head of Content" },
    content: `
Great customer support turns one-time buyers into loyal advocates. Here's how to build a support system that scales.

## Common eSIM Support Issues

1. **Activation problems** — QR code won't scan, profile won't install
2. **Connectivity issues** — No signal after activation
3. **Compatibility questions** — "Does my phone support eSIM?"
4. **Billing inquiries** — Charges, refunds, plan changes

## Building Your Support System

### Self-Service First
Create comprehensive help documentation:
- Step-by-step setup guides with screenshots for each device type
- Troubleshooting flowcharts
- Video tutorials
- FAQs organized by topic

### Live Support Channels
- **Live chat** — Best for real-time troubleshooting
- **Email** — For non-urgent inquiries
- **WhatsApp** — Popular with international travelers

### Response Time Goals
- Live chat: Under 2 minutes
- Email: Under 4 hours
- Social media: Under 1 hour

## Proactive Support

Don't wait for problems:
- Send setup instructions immediately after purchase
- Follow up 24 hours later to confirm connectivity
- Send mid-trip check-in for longer plans
- Request feedback after plan expires

Great support is your competitive advantage in a market where the underlying product (data) is largely commoditized.
    `,
  },
];

const categoryColors: Record<string, string> = {
  Guide: "bg-primary/10 text-primary",
  Technology: "bg-accent/10 text-accent",
  Marketing: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Business: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Industry: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Customer Service": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = allPosts.find((p) => slugify(p.title) === slug);

  if (!post) {
    return (
      <div className="min-h-screen pt-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const currentIndex = allPosts.findIndex((p) => slugify(p.title) === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const relatedPosts = allPosts.filter((p) => p.category === post.category && slugify(p.title) !== slug).slice(0, 2);

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{trimmed.slice(4)}</h3>;
      if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{trimmed.slice(3)}</h2>;
      if (trimmed.startsWith("- **")) {
        const match = trimmed.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
        if (match) return <li key={i} className="ml-4 mb-1"><strong>{match[1]}</strong> — {match[2]}</li>;
        const match2 = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/);
        if (match2) return <li key={i} className="ml-4 mb-1"><strong>{match2[1]}</strong>{match2[2]}</li>;
      }
      if (trimmed.startsWith("- ")) return <li key={i} className="ml-4 mb-1">{trimmed.slice(2)}</li>;
      if (trimmed.match(/^\d+\.\s/)) return <li key={i} className="ml-4 mb-1 list-decimal">{trimmed.replace(/^\d+\.\s/, "")}</li>;
      if (trimmed.startsWith("|")) return null; // skip table rows for simplicity
      return <p key={i} className="mb-3 text-muted-foreground leading-relaxed">{trimmed}</p>;
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="aspect-[3/1] max-h-[400px] w-full overflow-hidden bg-muted">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      </section>

      <div className="container-custom max-w-4xl -mt-24 relative z-10 pb-20">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", categoryColors[post.category])}>
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">{post.date}</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>

          {/* Author */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">Share</span>
              <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Twitter className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Linkedin className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Facebook className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="prose-custom text-base leading-relaxed">
            {renderContent(post.content)}
          </div>

          {/* Prev / Next */}
          <div className="mt-12 pt-8 border-t border-border grid sm:grid-cols-2 gap-4">
            {prevPost ? (
              <Link to={`/blog/${slugify(prevPost.title)}`} className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ArrowLeft className="w-3 h-3" /> Previous
                </div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{prevPost.title}</p>
              </Link>
            ) : <div />}
            {nextPost && (
              <Link to={`/blog/${slugify(nextPost.title)}`} className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-right">
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                  Next <ArrowRight className="w-3 h-3" />
                </div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{nextPost.title}</p>
              </Link>
            )}
          </div>
        </motion.article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedPosts.map((rp) => (
                <Link key={rp.title} to={`/blog/${slugify(rp.title)}`} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:-translate-y-1">
                  <div className="aspect-video overflow-hidden">
                    <img src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", categoryColors[rp.category])}>{rp.category}</span>
                    <h3 className="font-semibold mt-2 group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {rp.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
