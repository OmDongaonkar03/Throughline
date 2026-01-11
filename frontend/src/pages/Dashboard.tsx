import { motion } from "framer-motion";
import { 
  PenLine, 
  FileText, 
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentActivity = [
  { type: "check-in", text: "Deployed the authentication system", time: "2 hours ago" },
  { type: "post", text: "Generated post about API design", time: "Yesterday" },
  { type: "check-in", text: "Fixed production bugs", time: "2 days ago" },
];

const stats = [
  { label: "Check-ins this week", value: "7", icon: PenLine, trend: "+3" },
  { label: "Posts generated", value: "12", icon: FileText, trend: "+5" },
  { label: "Current streak", value: "14", icon: TrendingUp, suffix: "days" },
];

const Dashboard = () => {
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
          <div className="grid md:grid-cols-3 gap-4 mb-8">
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
                      {stat.trend && (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {stat.trend}
                        </span>
                      )}
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
                      <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-foreground" />
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      activity.type === "check-in" 
                        ? "bg-primary/10" 
                        : "bg-secondary"
                    }`}>
                      {activity.type === "check-in" ? (
                        <PenLine className="w-4 h-4 text-primary" />
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
