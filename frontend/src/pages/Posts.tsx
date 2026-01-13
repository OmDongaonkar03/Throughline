import { motion } from "framer-motion";
import { 
  Sparkles,
  Copy,
  ExternalLink,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const generatedPosts = [
  {
    id: 1,
    title: "On debugging CORS errors",
    content: "Three days of CORS errors taught me more about browser security than any tutorial.\n\nHere's what clicked: credentials aren't just about allowing origins—they're about trust boundaries.\n\nWhen your JWT lives in a cookie, the browser enforces strict rules...",
    createdAt: "2 hours ago",
    type: "daily",
    platform: "linkedin",
  },
  {
    id: 2,
    title: "Shipping the authentication system",
    content: "Just deployed our new auth system.\n\nWhat started as a 'quick feature' turned into a deep dive into security best practices.\n\nKey learnings:\n• Session management is harder than it looks\n• Always hash passwords with bcrypt\n• JWT refresh tokens need careful handling",
    createdAt: "Yesterday",
    type: "weekly",
    platform: "twitter",
  },
  {
    id: 3,
    title: "The power of incremental improvement",
    content: "Week 3 of building in public.\n\nSmall wins compound. What felt impossible 21 days ago is now muscle memory.\n\nThe secret? Showing up every day, even when the commits are small.",
    createdAt: "3 days ago",
    type: "monthly",
    platform: "linkedin",
  },
];

const Posts = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Post content has been copied.",
    });
  }

  const filteredPosts = generatedPosts.filter(post => {
    if (selectedTab === "all") return true;
    if (selectedTab === "daily") return post.type === "daily";
    if (selectedTab === "weekly") return post.type === "weekly";
    if (selectedTab === "monthly") return post.type === "monthly";
    return true;
  });

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
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
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

          {/* Posts Grid */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:border-border/80 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        post.platform === "twitter" 
                          ? "bg-secondary" 
                          : "bg-[#0A66C2]/10"
                      }`}>
                        {post.platform === "twitter" ? (
                          <FaXTwitter className="w-4 h-4 text-foreground" />
                        ) : (
                          <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{post.createdAt}</span>
                          <Badge variant="default" className="text-xs">
                            {post.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => copyText(post.content)}>
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Posts;
