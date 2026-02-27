import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Search, Eye } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function SEOSettings() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    title: "",
    description: "",
    keywords: [] as string[],
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    twitterCard: "summary" as "summary" | "summary_large_image",
    canonicalUrl: "",
  });
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    if (storeId) {
      loadSEOConfig();
    }
  }, [storeId]);

  const loadSEOConfig = async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const data = await (apiClient as any).getStoreSEO(storeId);
      if (data) {
        setConfig({
          title: data.title || "",
          description: data.description || "",
          keywords: data.keywords || [],
          ogImage: data.ogImage || "",
          ogTitle: data.ogTitle || "",
          ogDescription: data.ogDescription || "",
          twitterCard: data.twitterCard || "summary",
          canonicalUrl: data.canonicalUrl || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.errorMessage || error?.message || "Failed to load SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !config.keywords.includes(keywordInput.trim())) {
      setConfig({
        ...config,
        keywords: [...config.keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setConfig({
      ...config,
      keywords: config.keywords.filter(k => k !== keyword),
    });
  };

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      await (apiClient as any).updateStoreSEO(storeId, config);
      toast({
        title: "Success",
        description: "SEO settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.errorMessage || error?.message || "Failed to update SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Optimize your store for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic SEO */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic SEO</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    placeholder="Your Store Name - eSIM Cards"
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.title.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Meta Description</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="Buy eSIM cards for your travels..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.description.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                      placeholder="Add keyword"
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Open Graph */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Open Graph (Social Media)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="ogTitle">OG Title</Label>
                  <Input
                    id="ogTitle"
                    value={config.ogTitle}
                    onChange={(e) => setConfig({ ...config, ogTitle: e.target.value })}
                    placeholder="Leave empty to use page title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogDescription">OG Description</Label>
                  <Textarea
                    id="ogDescription"
                    value={config.ogDescription}
                    onChange={(e) => setConfig({ ...config, ogDescription: e.target.value })}
                    placeholder="Leave empty to use meta description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogImage">OG Image URL</Label>
                  <Input
                    id="ogImage"
                    type="url"
                    value={config.ogImage}
                    onChange={(e) => setConfig({ ...config, ogImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1200x630px
                  </p>
                </div>
              </div>

              {/* Advanced */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Advanced</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    type="url"
                    value={config.canonicalUrl}
                    onChange={(e) => setConfig({ ...config, canonicalUrl: e.target.value })}
                    placeholder="https://yourstore.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save SEO Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

