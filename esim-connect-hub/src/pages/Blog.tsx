import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { cn } from "@/lib/utils";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const featuredPost = {
  title: "The Complete Guide to Starting Your eSIM Reselling Business in 2026",
  excerpt: "Everything you need to know about launching a successful eSIM business, from choosing providers to marketing strategies.",
  category: "Guide",
  readTime: "12 min read",
  date: "Jan 15, 2026",
  image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80"
};

const blogPosts = [
  {
    title: "Understanding eSIM Technology: A Beginner's Overview",
    excerpt: "Learn the basics of eSIM technology and how it's revolutionizing mobile connectivity.",
    category: "Technology",
    readTime: "5 min read",
    date: "Jan 12, 2026",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  },
  {
    title: "5 Marketing Strategies That Work for eSIM Businesses",
    excerpt: "Proven marketing tactics to grow your eSIM customer base and increase sales.",
    category: "Marketing",
    readTime: "8 min read",
    date: "Jan 10, 2026",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
  {
    title: "How to Choose the Right eSIM Providers for Your Store",
    excerpt: "A comprehensive comparison of top eSIM providers and what to consider when choosing.",
    category: "Business",
    readTime: "6 min read",
    date: "Jan 8, 2026",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  },
  {
    title: "Maximizing Profit Margins: Pricing Strategies for eSIM Resellers",
    excerpt: "Expert tips on setting competitive prices while maintaining healthy profit margins.",
    category: "Business",
    readTime: "7 min read",
    date: "Jan 5, 2026",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&q=80",
  },
  {
    title: "The Future of Travel Connectivity: eSIM Trends to Watch",
    excerpt: "Emerging trends in the eSIM industry and what they mean for resellers.",
    category: "Industry",
    readTime: "4 min read",
    date: "Jan 3, 2026",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&q=80",
  },
  {
    title: "Customer Support Best Practices for eSIM Businesses",
    excerpt: "How to provide excellent customer support and build lasting relationships.",
    category: "Customer Service",
    readTime: "5 min read",
    date: "Jan 1, 2026",
    image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&q=80",
  },
];

const categories = [
  { name: "All Posts", count: 24 },
  { name: "Guide", count: 8 },
  { name: "Business", count: 6 },
  { name: "Technology", count: 5 },
  { name: "Marketing", count: 3 },
  { name: "Industry", count: 2 },
];

const categoryColors: Record<string, string> = {
  Guide: "bg-primary/10 text-primary",
  Technology: "bg-accent/10 text-accent",
  Marketing: "bg-green-100 text-green-700",
  Business: "bg-blue-100 text-blue-700",
  Industry: "bg-purple-100 text-purple-700",
  "Customer Service": "bg-orange-100 text-orange-700",
};

export default function Blog() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-custom">
          <SectionHeader
            badge="Blog & Resources"
            title="Insights for eSIM entrepreneurs"
            description="Guides, tips, and industry news to help you grow your eSIM business."
          />
        </div>
      </section>

      {/* Featured Post */}
      <section className="section-padding">
        <div className="container-custom">
          <Link to={`/blog/${slugify(featuredPost.title)}`}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-card rounded-3xl overflow-hidden shadow-card-hover group cursor-pointer"
            >
              <div className="grid lg:grid-cols-2">
                {/* Image */}
                <div className="aspect-video lg:aspect-auto bg-muted relative overflow-hidden">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 gradient-bg opacity-20" />
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium", categoryColors[featuredPost.category])}>
                      {featuredPost.category}
                    </span>
                    <span className="text-sm text-muted-foreground">{featuredPost.date}</span>
                  </div>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4 group-hover:gradient-text transition-all">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </div>
                    <Button variant="gradient" size="sm">
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="section-padding bg-card">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="sticky top-28">
                <h3 className="font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm hover:bg-muted transition-colors"
                    >
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">{category.count}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-6 rounded-2xl gradient-bg">
                  <h4 className="font-semibold text-primary-foreground mb-2">Subscribe to updates</h4>
                  <p className="text-sm text-primary-foreground/80 mb-4">Get the latest posts delivered to your inbox.</p>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 rounded-xl bg-background/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 mb-3"
                  />
                  <Button size="sm" className="w-full bg-background text-foreground hover:bg-background/90">
                    Subscribe
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Posts Grid */}
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 gap-6">
                {blogPosts.map((post, index) => (
                  <Link key={post.title} to={`/blog/${slugify(post.title)}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-background rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer hover:-translate-y-1 h-full"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 gradient-bg opacity-10 group-hover:opacity-20 transition-opacity" />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", categoryColors[post.category])}>
                            {post.category}
                          </span>
                          <span className="text-xs text-muted-foreground">{post.date}</span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Articles
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
