import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText,
  Copy,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { postsService } from "@/services/postsService";

const PLATFORM_CONFIG = {
  LINKEDIN: {
    name: "LinkedIn",
    logo: "/platforms/linkedin.png",
    color: "bg-[#0A66C2]/10",
    textColor: "text-[#0A66C2]"
  },
  X: {
    name: "X (Twitter)",
    logo: "/platforms/twitter.png",
    color: "bg-secondary",
    textColor: "text-foreground"
  },
  REDDIT: {
    name: "Reddit",
    logo: "/platforms/reddit.png",
    color: "bg-[#FF4500]/10",
    textColor: "text-[#FF4500]"
  }
};

const Posts = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [regeneratingPosts, setRegeneratingPosts] = useState(new Set());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Generate modal state
  const [generateType, setGenerateType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState("");
  
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [selectedTab]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = selectedTab === "all" ? {} : { type: selectedTab.toUpperCase() };
      const data = await postsService.getPosts(apiRequest, params);
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Post content has been copied.",
    });
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleRegenerate = async (postId) => {
    try {
      setRegeneratingPosts(prev => new Set(prev).add(postId));
      
      const result = await postsService.regeneratePlatformPosts(
        apiRequest,
        postId
      );

      toast({
        title: "Success",
        description: `Regenerated ${result.stats.generated} platform post(s)`,
      });

      await fetchPosts();
    } catch (error) {
      console.error("Error regenerating:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate posts",
        variant: "destructive",
      });
    } finally {
      setRegeneratingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      
      const data: { date?: string } = {};
      
      if (selectedDate) {
        data.date = selectedDate;
      }

      const result = await postsService.generatePost(apiRequest, generateType, data);

      toast({
        title: "Success",
        description: `${generateType.charAt(0).toUpperCase() + generateType.slice(1)} post generated successfully`,
      });

      setShowGenerateModal(false);
      setSelectedDate("");
      await fetchPosts();
    } catch (error) {
      console.error("Error generating:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-foreground mb-1">Posts</h1>
              <p className="text-muted-foreground text-sm">Generate and manage your content</p>
            </div>
            <Button className="gap-2" onClick={() => setShowGenerateModal(true)}>
              <FileText className="w-4 h-4" />
              Generate Post
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Loading posts...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No posts yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate your first post to get started
              </p>
              <Button onClick={() => setShowGenerateModal(true)} className="gap-2">
                <FileText className="w-4 h-4" />
                Generate Your First Post
              </Button>
            </div>
          )}

          {/* Posts Grid */}
          {!isLoading && posts.length > 0 && (
            <div className="space-y-4">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-border/80 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(post.createdAt)}
                              </span>
                              <Badge variant="default" className="text-xs">
                                {post.type.toLowerCase()}
                              </Badge>
                              {post.generationType && (
                                <Badge variant="outline" className="text-xs">
                                  {post.generationType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerate(post.id)}
                              disabled={regeneratingPosts.has(post.id)}
                              className="gap-2"
                            >
                              {regeneratingPosts.has(post.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Regenerate
                            </Button>
                          </div>
                        </div>

                        {/* Base Content */}
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {post.content}
                          </p>
                        </div>

                        {/* Platform Posts Toggle */}
                        {post.platformPosts && post.platformPosts.length > 0 && (
                          <>
                            <button
                              onClick={() => toggleExpanded(post.id)}
                              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-3 w-full"
                            >
                              {expandedPosts.has(post.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              <span>
                                {expandedPosts.has(post.id) ? "Hide" : "Show"} Platform Versions 
                                ({post.platformPosts.length})
                              </span>
                            </button>

                            <AnimatePresence>
                              {expandedPosts.has(post.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-3 mb-4 overflow-hidden"
                                >
                                  {post.platformPosts.map((pp) => {
                                    const platformConfig = PLATFORM_CONFIG[pp.platform];
                                    return (
                                      <div
                                        key={pp.id}
                                        className="border border-border rounded-lg p-4 bg-muted/30"
                                      >
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${platformConfig.color}`}>
                                            <img 
                                              src={platformConfig.logo} 
                                              alt={platformConfig.name}
                                              className="w-4 h-4"
                                            />
                                          </div>
                                          <span className={`text-sm font-medium ${platformConfig.textColor}`}>
                                            {platformConfig.name}
                                          </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-line mb-2">
                                          {pp.content}
                                        </p>
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => copyText(pp.content)}
                                          >
                                            <Copy className="w-3 h-3" />
                                            Copy
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => copyText(post.content)}
                          >
                            <Copy className="w-3 h-3" />
                            Copy Base
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Post</DialogTitle>
            <DialogDescription>
              Choose the type of post to generate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Post Type */}
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Tabs value={generateType} onValueChange={setGenerateType}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="date">Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for today's date
              </p>
            </div>

            {/* Info about platforms */}
            <div className="rounded-lg bg-muted/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground">
                Posts will be generated for all platforms enabled in your settings.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(false)}
              disabled={generating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Posts;