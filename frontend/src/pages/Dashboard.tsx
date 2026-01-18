import { motion } from "framer-motion";
import { 
  PenLine, 
  FileText, 
  TrendingUp,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { ActivityCalendar, DayDetailsModal } from "@/components/ui/ActivityCalendar";
import { dashboardService } from "@/services/dashboardService";

interface CheckIn {
  id: string;
  content: string;
  createdAt: string;
}

interface ActivityStats {
  year: number;
  accountCreationDate: string;
  availableYears: number[];
  dailyCounts: Record<string, number>;
  totalCheckIns: number;
  currentStreak: number;
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDateCheckIns, setSelectedDateCheckIns] = useState<CheckIn[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  // Fetch activity stats on mount
  useEffect(() => {
    fetchActivityStats(new Date().getFullYear());
  }, []);

  const fetchActivityStats = async (year: number) => {
    try {
      setIsLoadingStats(true);
      const data = await dashboardService.getActivityStats(apiRequest, year);
      setActivityStats(data);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load activity data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDayClick = async (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setIsLoadingModal(true);

    try {
      const data = await dashboardService.getCheckInsByDate(apiRequest, date);
      setSelectedDateCheckIns(data.checkIns || []);
    } catch (error) {
      console.error("Error fetching day check-ins:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load check-ins for this day",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModal(false);
    }
  };

  const handleYearChange = (year: number) => {
    fetchActivityStats(year);
  };

  const stats = [
    { 
      label: "Total check-ins", 
      value: activityStats?.totalCheckIns.toString() || "0", 
      icon: PenLine 
    },
    { 
      label: "Current streak", 
      value: activityStats?.currentStreak.toString() || "0", 
      icon: TrendingUp, 
      suffix: "days" 
    },
  ];

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
            <h1 className="text-2xl font-medium text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Here's what's happening with your content journey</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl font-medium text-foreground">
                      {stat.value}
                      {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Link to="/check-ins">
              <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                        <PenLine className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">New Check-in</h3>
                        <p className="text-sm text-muted-foreground">Log what you've been working on</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/posts">
              <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Generate Post</h3>
                        <p className="text-sm text-muted-foreground">Create content from your journey</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Activity Calendar */}
          {isLoadingStats ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading activity data...
              </CardContent>
            </Card>
          ) : activityStats ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <ActivityCalendar
                dailyCounts={activityStats.dailyCounts}
                year={activityStats.year}
                availableYears={activityStats.availableYears}
                startDate={activityStats.startDate}
                endDate={activityStats.endDate}
                onYearChange={handleYearChange}
                onDayClick={handleDayClick}
              />
            </motion.div>
          ) : null}

          {/* Day Details Modal */}
          <DayDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            date={selectedDate}
            checkIns={selectedDateCheckIns}
            isLoading={isLoadingModal}
          />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;