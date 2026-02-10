import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText,
  Copy,
  Clock,
  RefreshCw,
  Calendar,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Edit,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

const POSTS_PER_PAGE = 10;

const Posts = () => {
  const [selectedTab, setSelectedTab] = useState("daily");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [regeneratingPosts, setRegeneratingPosts] = useState(new Set());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Generate modal state
  const [generateType, setGenerateType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState("");
  
  // Feedback state
  const [postFeedback, setPostFeedback] = useState({});
  
  // Edit state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Infinite scroll
  const observerTarget = useRef(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  // Sync generate type with selected tab
  useEffect(() => {
    setGenerateType(selectedTab);
  }, [selectedTab]);

  // Initial load
  useEffect(() => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    fetchPosts(true);
  }, [selectedTab]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, isFetchingMore, offset]);

  const fetchPosts = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      const currentOffset = isInitial ? 0 : offset;
      
      const params = {
        type: selectedTab.toUpperCase(),
        limit: POSTS_PER_PAGE,
        offset: currentOffset,
      };

      const data = await postsService.getPosts(apiRequest, params);
      const newPosts = data.posts || [];

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === POSTS_PER_PAGE);
      setOffset(currentOffset + newPosts.length);
      
      // Load feedback for new posts
      const feedbackPromises = newPosts.map(async (post) => {
        try {
          const feedbackData = await postsService.getFeedback(apiRequest, post.id);
          return { postId: post.id, feedback: feedbackData.feedback };
        } catch (error) {
          return { postId: post.id, feedback: null };
        }
      });
      
      const feedbackResults = await Promise.all(feedbackPromises);
      const feedbackMap = {};
      feedbackResults.forEach((result) => {
        feedbackMap[result.postId] = result.feedback;
      });
      
      setPostFeedback(prev => ({ ...prev, ...feedbackMap }));
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      fetchPosts(false);
    }
  }, [isFetchingMore, hasMore, offset]);

  const copyText = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Post content has been copied.",
    });
  };

  const handleRegenerate = async (postId) => {
    try {
      setRegeneratingPosts(prev => new Set(prev).add(postId));
      
      await postsService.regeneratePost(apiRequest, postId);

      toast({
        title: "Success",
        description: "Post regenerated successfully",
      });

      // Refresh current view
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      await fetchPosts(true);
    } catch (error) {
      console.error("Error regenerating:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate post",
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
      
      const data: Record<string, string> = {};
      
      if (selectedDate) {
        data.date = selectedDate;
      }

      await postsService.generatePost(apiRequest, generateType, data);

      toast({
        title: "Success",
        description: `${generateType.charAt(0).toUpperCase() + generateType.slice(1)} post generated successfully`,
      });

      setShowGenerateModal(false);
      setSelectedDate("");
      
      // Refresh posts
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      await fetchPosts(true);
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

  const handleFeedback = async (postId, rating) => {
    try {
      await postsService.submitFeedback(apiRequest, postId, rating);
      
      setPostFeedback(prev => ({
        ...prev,
        [postId]: { rating }
      }));
      
      toast({
        title: rating === 2 ? "Thanks!" : "Feedback received",
        description: rating === 2 
          ? "Glad you liked it!" 
          : "We'll work on improving this.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSavePost = async () => {
    if (!editingPost) return;
    
    try {
      setIsSaving(true);
      await postsService.updatePost(apiRequest, editingPost.id, editContent);
      
      setPosts(prev => prev.map(p => 
        p.id === editingPost.id 
          ? { ...p, content: editContent }
          : p
      ));
      
      setEditingPost(null);
      
      toast({
        title: "Post updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateString);
  };

  // Group posts by date for timeline
  const groupedPosts: Record<string, typeof posts> = posts.reduce((acc: Record<string, typeof posts>, post) => {
    const dateKey = formatDate(post.createdAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Posts</h1>
                <p className="text-sm text-muted-foreground mt-1">Your content timeline</p>
              </div>
              <Button 
                className="gap-2 w-full sm:w-auto" 
                onClick={() => setShowGenerateModal(true)}
              >
                <FileText className="w-4 h-4" />
                Generate Post
              </Button>
            </div>
            
            {/* Tabs */}
            <div className="mt-4">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-16">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Generate your first {selectedTab} post to get started
                  </p>
                  <Button onClick={() => setShowGenerateModal(true)} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Generate Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative pt-4">
              {/* Timeline Line */}
              <div className="absolute left-1/2 top-4 bottom-0 w-0.5 bg-border hidden md:block" 
                   style={{ transform: 'translateX(-50%)' }} />

              {/* Posts Timeline */}
              <div className="space-y-12">
                {Object.entries(groupedPosts).map(([dateKey, datePosts], groupIndex) => (
                  <div key={dateKey}>
                    {/* Posts for this date */}
                    <div className="space-y-8">
                      {datePosts.map((post, index) => {
                        const globalIndex = posts.findIndex(p => p.id === post.id);
                        const isLeft = globalIndex % 2 === 0;
                        
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`relative md:w-[calc(50%-2rem)] ${
                              isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                            }`}
                          >

                            <Card className="overflow-hidden hover:shadow-md transition-shadow">
                              <CardContent className="p-4 sm:p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <Badge variant="outline" className="text-xs">
                                        {post.type || selectedTab.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditPost(post)}
                                      className="h-8 w-8"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRegenerate(post.id)}
                                      disabled={regeneratingPosts.has(post.id)}
                                      className="h-8 w-8"
                                    >
                                      {regeneratingPosts.has(post.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                    {post.content}
                                  </p>
                                </div>

                                {/* Target Date Info */}
                                {post.date && (
                                  <div className="mb-3">
                                    <p className="text-xs text-muted-foreground">
                                      Generated for: {formatDate(post.date)}
                                    </p>
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFeedback(post.id, 2)}
                                      className={`h-8 w-8 p-0 ${
                                        postFeedback[post.id]?.rating === 2 
                                          ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                                          : ''
                                      }`}
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFeedback(post.id, 1)}
                                      className={`h-8 w-8 p-0 ${
                                        postFeedback[post.id]?.rating === 1 
                                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                                          : ''
                                      }`}
                                    >
                                      <ThumbsDown className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2 h-8"
                                      onClick={() => copyText(post.content)}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Copy</span>
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatTime(post.createdAt)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Loader */}
              {hasMore && (
                <div ref={observerTarget} className="flex items-center justify-center py-8">
                  {isFetchingMore && (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Post</DialogTitle>
            <DialogDescription>
              Create a new {generateType} post for your timeline
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
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use today's date
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

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={12}
            className="font-mono text-sm resize-none"
            placeholder="Enter your post content..."
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingPost(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePost}
              disabled={isSaving || !editContent.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Posts;