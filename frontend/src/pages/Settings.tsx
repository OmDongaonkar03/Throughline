import { motion } from "framer-motion";
import { 
  User,
  Bell,
  CreditCard,
  ChevronRight,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "How we contact you" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Manage your subscription" },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    postReminders: true,
    weeklyReport: false,
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { toast } = useToast();
  const { apiRequest } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch notification settings on mount
  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await apiRequest(`${API_URL}/notifications`);

      if (!response.ok) {
        throw new Error("Failed to fetch notification settings");
      }

      const data = await response.json();
      setNotifications({
        emailDigest: data.settings.emailDigest,
        postReminders: data.settings.postReminders,
        weeklyReport: data.settings.weeklyReport,
      });
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notifications, value: boolean) => {
    // Optimistic update
    const previousState = { ...notifications };
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      setIsLoadingNotifications(true);

      const response = await apiRequest(`${API_URL}/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [key]: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }

      const data = await response.json();
      
      // Update with server response to ensure consistency
      setNotifications({
        emailDigest: data.settings.emailDigest,
        postReminders: data.settings.postReminders,
        weeklyReport: data.settings.weeklyReport,
      });

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      // Revert to previous state on error
      setNotifications(previousState);
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotifications(false);
    }
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
            <h1 className="text-2xl font-medium text-foreground mb-1">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account preferences</p>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-6">
            {/* Settings Navigation */}
            <div className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-md transition-colors text-left",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Settings Content */}
            <Card>
              <CardContent className="p-6">
                {activeSection === "profile" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-base">Profile Settings</CardTitle>
                    </CardHeader>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-xl">J</span>
                      </div>
                      <Button variant="outline" size="sm">Change avatar</Button>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" defaultValue="Jane Smith" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="jane@example.com" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" defaultValue="Building products and learning in public." />
                      </div>
                    </div>

                    <Button>Save changes</Button>
                  </motion.div>
                )}

                {activeSection === "notifications" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-base">Notification Preferences</CardTitle>
                    </CardHeader>
                    
                    <div className="space-y-4">
                      {[
                        { id: "emailDigest", label: "Daily email digest", description: "Receive a summary of your activity" },
                        { id: "postReminders", label: "Post reminders", description: "Get reminded to check in daily" },
                        { id: "weeklyReport", label: "Weekly reports", description: "Detailed weekly progress report" },
                      ].map((setting) => (
                        <div 
                          key={setting.id}
                          className="flex items-center justify-between p-4 rounded-md bg-secondary/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{setting.label}</p>
                            <p className="text-xs text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch
                            checked={notifications[setting.id as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(setting.id as keyof typeof notifications, checked)
                            }
                            disabled={isLoadingNotifications}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSection === "billing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-base">Billing & Subscription</CardTitle>
                    </CardHeader>
                    
                    <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Current plan</p>
                          <p className="text-xl font-medium text-foreground">Free</p>
                        </div>
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        1 post per week after first 3 days. Upgrade to Pro for unlimited posts.
                      </p>
                      <Button className="w-full">Upgrade to Pro — ₹499/mo</Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Pro features include:</h3>
                      {[
                        "Unlimited check-ins",
                        "Unlimited posts",
                        "Full memory (forever)",
                        "Auto-scheduling",
                        "Voice tuning with your samples",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;