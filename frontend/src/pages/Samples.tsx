import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Info,
  Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { samplePostService } from "@/services/samplePostsService";

const MAX_SAMPLE_POSTS = 5;

const TuneSamples = () => {
  const [samplePosts, setSamplePosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  useEffect(() => {
    fetchSamplePosts();
  }, []);

  const fetchSamplePosts = async () => {
    try {
      setIsLoading(true);
      const data = await samplePostService.getSamplePosts(apiRequest);
      setSamplePosts(data.samplePosts || []);
    } catch (error) {
      console.error("Error fetching sample posts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sample posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading("create");
      await samplePostService.createSamplePost(apiRequest, newContent);
      
      toast({
        title: "Success",
        description: "Sample post added successfully",
      });
      
      setNewContent("");
      setIsAdding(false);
      await fetchSamplePosts();
    } catch (error) {
      console.error("Error creating sample post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sample post",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async (id) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(`update-${id}`);
      await samplePostService.updateSamplePost(apiRequest, id, editContent);
      
      toast({
        title: "Success",
        description: "Sample post updated successfully",
      });
      
      setEditingId(null);
      setEditContent("");
      await fetchSamplePosts();
    } catch (error) {
      console.error("Error updating sample post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update sample post",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sample post?")) {
      return;
    }

    try {
      setActionLoading(`delete-${id}`);
      await samplePostService.deleteSamplePost(apiRequest, id);
      
      toast({
        title: "Success",
        description: "Sample post deleted successfully",
      });
      
      await fetchSamplePosts();
    } catch (error) {
      console.error("Error deleting sample post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sample post",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const startEditing = (post) => {
    setEditingId(post.id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewContent("");
  };

  const canAddMore = samplePosts.length < MAX_SAMPLE_POSTS;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-medium text-foreground">Tune Your Voice</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Add sample posts to help our AI understand your writing style and tone
            </p>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Your Sample Posts</CardTitle>
                  <CardDescription>
                    {samplePosts.length} of {MAX_SAMPLE_POSTS} samples added
                  </CardDescription>
                </div>
                {canAddMore && !isAdding && (
                  <Button
                    onClick={() => setIsAdding(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sample
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Add New Post Form */}
              <AnimatePresence>
                {isAdding && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4 space-y-3">
                        <Textarea
                          placeholder="Write a sample post that represents your typical writing style..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          rows={4}
                          className="resize-none"
                          maxLength={5000}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelAdding}
                            disabled={actionLoading === "create"}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCreate}
                            disabled={actionLoading === "create"}
                            className="gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {actionLoading === "create" ? "Saving..." : "Save Sample"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading samples...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && samplePosts.length === 0 && !isAdding && (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No sample posts yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first sample to start tuning the AI to your writing style
                  </p>
                  <Button onClick={() => setIsAdding(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Sample
                  </Button>
                </div>
              )}

              {/* Sample Posts List */}
              {!isLoading && samplePosts.length > 0 && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {samplePosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-border/50">
                          <CardContent className="p-4">
                            {editingId === post.id ? (
                              // Edit Mode
                              <div className="space-y-3">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={4}
                                  className="resize-none"
                                  maxLength={5000}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditing}
                                    disabled={actionLoading === `update-${post.id}`}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdate(post.id)}
                                    disabled={actionLoading === `update-${post.id}`}
                                    className="gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    {actionLoading === `update-${post.id}` ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {post.content}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Added {new Date(post.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(post)}
                                    disabled={!!actionLoading}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(post.id)}
                                    disabled={actionLoading === `delete-${post.id}`}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    {actionLoading === `delete-${post.id}` ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Max Reached Message */}
              {!canAddMore && !isAdding && samplePosts.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You've reached the maximum of {MAX_SAMPLE_POSTS} sample posts. 
                    Delete one to add another.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default TuneSamples;