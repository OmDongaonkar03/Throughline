import { motion } from "framer-motion";
import { 
  Plus,
  Calendar,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

interface CheckIn {
  id: string;
  content: string;
  createdAt: string;
}

const CheckIns = () => {
  const [checkinText, setCheckinText] = useState("");
  const [todaysCheckins, setTodaysCheckins] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch today's check-ins
  useEffect(() => {
    fetchTodaysCheckIns();
  }, []);

  const fetchTodaysCheckIns = async () => {
    try {
      setIsFetching(true);
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const response = await apiRequest(`${API_URL}/checkin?date=${today}`);

      if (!response.ok) {
        throw new Error("Failed to fetch check-ins");
      }

      const data = await response.json();
      setTodaysCheckins(data.checkIns || []);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      toast({
        title: "Error",
        description: "Failed to load check-ins",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (checkinText.trim() === "" || checkinText.length > 1500) {
      toast({
        title: "Invalid check-in",
        description: "Check-in cannot be empty or exceed 1500 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiRequest(`${API_URL}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: checkinText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create check-in");
      }

      const data = await response.json();
      
      // Add new check-in to the list
      setTodaysCheckins([data.checkIn, ...todaysCheckins]);
      setCheckinText("");
      
      toast({
        title: "Success",
        description: "Check-in saved successfully",
      });
    } catch (error) {
      console.error("Error creating check-in:", error);
      toast({
        title: "Error",
        description: "Failed to save check-in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-foreground mb-1">Check-ins</h1>
            <p className="text-muted-foreground text-sm">Track your daily progress and learnings</p>
          </div>

          {/* New Check-in */}
          <Card className="mb-8">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <Textarea
                    value={checkinText}
                    maxLength={1500}
                    onChange={(e) => setCheckinText(e.target.value)}
                    placeholder="What did you work on today? What did you learn?"
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Be specific. The more detail, the better your posts.
                    </p>
                    <Button 
                      onClick={handleCheckInSubmit}
                      disabled={isLoading || checkinText.trim() === ""}
                    >
                      {isLoading ? "Saving..." : "Save Check-in"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Check-ins */}
          <div className="space-y-6">
            {isFetching ? (
              <div className="text-center text-muted-foreground py-8">
                Loading check-ins...
              </div>
            ) : todaysCheckins.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No check-ins yet today. Create your first one above!
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(todaysCheckins[0].createdAt)}
                  </span>
                </div>
                <div className="space-y-3">
                  {todaysCheckins.map((entry) => (
                    <Card key={entry.id} className="hover:border-border/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[72px]">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.createdAt)}
                          </div>
                          <p className="text-sm text-foreground flex-1">{entry.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CheckIns;