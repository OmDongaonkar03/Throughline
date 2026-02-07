import { motion } from "framer-motion";
import { 
  User,
  Bell,
  CreditCard,
  ChevronRight,
  Check,
  Share2,
  Calendar,
  Clock,
  Info,
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
import { notificationService } from "@/services/notificationService";
import { profileService } from "@/services/profileService";
import { scheduleService } from "@/services/scheduleService";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { id: "schedule", label: "Schedule", icon: Calendar, description: "Post generation timing" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "How we contact you" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Manage your subscription" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'AM' : 'PM';
      const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      options.push({ value: timeValue, label: displayTime });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const Settings = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    postReminders: true,
    weeklyReport: false,
  });
  const [platforms, setPlatforms] = useState({
    xEnabled: false,
    linkedinEnabled: true,
    redditEnabled: false,
  });
  const [schedule, setSchedule] = useState({
    dailyEnabled: true,
    dailyTime: "21:00",
    weeklyEnabled: true,
    weeklyDay: 0,
    weeklyTime: "20:00",
    monthlyEnabled: true,
    monthlyDay: 28,
    monthlyTime: "20:00",
    timezone: "Asia/Kolkata",
  });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const { toast } = useToast();
  const { apiRequest, user, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      
      if (user.verified === false) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to access all features",
          variant: "destructive",
        });
        navigate("/auth");
      }
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    fetchNotificationSettings();
    fetchScheduleSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const settings = await notificationService.getSettings(apiRequest);
      setNotifications({
        emailDigest: settings.emailDigest,
        postReminders: settings.postReminders,
        weeklyReport: settings.weeklyReport,
      });
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to load notification settings",
        variant: "destructive",
      });
    }
  };

  const fetchScheduleSettings = async () => {
    try {
      const settings = await scheduleService.getSettings(apiRequest);
      setSchedule(settings);
    } catch (error) {
      console.error("Error fetching schedule settings:", error);
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to load schedule settings",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async (key, value) => {
    const previousState = { ...notifications };
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      setIsLoadingNotifications(true);
      const updatedSettings = await notificationService.updateSettings(apiRequest, {
        [key]: value,
      });
      setNotifications({
        emailDigest: updatedSettings.emailDigest,
        postReminders: updatedSettings.postReminders,
        weeklyReport: updatedSettings.weeklyReport,
      });
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      setNotifications(previousState);
      console.error("Error updating notification settings:", error);
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleScheduleToggle = async (key, value) => {
    // Check if disabling would leave no schedules enabled
    if (!value) {
      const updatedSchedule = {
        ...schedule,
        [key]: value
      };
      const enabledCount = [
        updatedSchedule.dailyEnabled,
        updatedSchedule.weeklyEnabled,
        updatedSchedule.monthlyEnabled,
      ].filter(Boolean).length;
      
      if (enabledCount === 0) {
        toast({
          title: "Cannot disable all schedules",
          description: "At least one schedule type must be enabled",
          variant: "destructive",
        });
        return;
      }
    }

    const previousState = { ...schedule };
    setSchedule(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      setIsLoadingSchedule(true);
      const updatedSettings = await scheduleService.updateSettings(apiRequest, {
        [key]: value,
      });
      setSchedule(updatedSettings);
      toast({
        title: "Success",
        description: "Schedule settings updated",
      });
    } catch (error) {
      setSchedule(previousState);
      console.error("Error updating schedule settings:", error);
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleScheduleChange = async (key, value) => {
    const previousState = { ...schedule };
    setSchedule(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      setIsLoadingSchedule(true);
      const updatedSettings = await scheduleService.updateSettings(apiRequest, {
        [key]: value,
      });
      setSchedule(updatedSettings);
      toast({
        title: "Success",
        description: "Schedule settings updated",
      });
    } catch (error) {
      setSchedule(previousState);
      console.error("Error updating schedule settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);

    try {
      const result = await profileService.updateProfile(apiRequest, profileData);
      toast({
        title: "Success",
        description: result.message || "Profile updated successfully",
      });

      if (result.emailChanged && result.loggedOut) {
        toast({
          title: "Email Changed",
          description: "Please check your email to verify your new address. Logging out...",
        });
        setTimeout(() => {
          logout();
          navigate("/auth");
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
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
                        {user?.profilePhoto ? (
                          <img 
                            src={user.profilePhoto} 
                            alt={user.name} 
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-primary-foreground font-medium text-xl">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      {user?.profilePhoto && (
                        <p className="text-xs text-muted-foreground">
                          Profile photo from Google account
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleProfileSubmit} className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input 
                          id="name" 
                          value={profileData.name}
                          onChange={handleProfileChange}
                          disabled={isLoadingProfile}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={profileData.email}
                          onChange={handleProfileChange}
                          disabled={isLoadingProfile}
                        />
                        <p className="text-xs text-muted-foreground">
                          Changing your email will require verification and log you out
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={profileData.bio}
                          onChange={handleProfileChange}
                          disabled={isLoadingProfile}
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <Button type="submit" disabled={isLoadingProfile}>
                        {isLoadingProfile ? "Saving..." : "Save changes"}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {activeSection === "schedule" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-base">Schedule Settings</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure when posts should be automatically generated
                      </p>
                    </CardHeader>

                    {/* Info Banner */}
                    <div className="flex gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground">
                        Post generation timing may vary by a few minutes to optimize server load. 
                        Timezone: {schedule.timezone}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Daily Schedule */}
                      <div className="p-4 rounded-md bg-secondary/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Daily Posts</p>
                              <p className="text-xs text-muted-foreground">Generate posts every day</p>
                            </div>
                          </div>
                          <Switch
                            checked={schedule.dailyEnabled}
                            onCheckedChange={(checked) => 
                              handleScheduleToggle("dailyEnabled", checked)
                            }
                            disabled={isLoadingSchedule}
                          />
                        </div>
                        {schedule.dailyEnabled && (
                          <div className="ml-7 grid gap-2">
                            <Label htmlFor="dailyTime">Time</Label>
                            <Select 
                              value={schedule.dailyTime}
                              onValueChange={(value) => handleScheduleChange("dailyTime", value)}
                              disabled={isLoadingSchedule}
                            >
                              <SelectTrigger id="dailyTime">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {TIME_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Weekly Schedule */}
                      <div className="p-4 rounded-md bg-secondary/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Weekly Posts</p>
                              <p className="text-xs text-muted-foreground">Generate summary posts weekly</p>
                            </div>
                          </div>
                          <Switch
                            checked={schedule.weeklyEnabled}
                            onCheckedChange={(checked) => 
                              handleScheduleToggle("weeklyEnabled", checked)
                            }
                            disabled={isLoadingSchedule}
                          />
                        </div>
                        {schedule.weeklyEnabled && (
                          <div className="ml-7 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="weeklyDay">Day</Label>
                              <Select 
                                value={schedule.weeklyDay.toString()}
                                onValueChange={(value) => handleScheduleChange("weeklyDay", parseInt(value))}
                                disabled={isLoadingSchedule}
                              >
                                <SelectTrigger id="weeklyDay">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem key={day.value} value={day.value.toString()}>
                                      {day.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="weeklyTime">Time</Label>
                              <Select 
                                value={schedule.weeklyTime}
                                onValueChange={(value) => handleScheduleChange("weeklyTime", value)}
                                disabled={isLoadingSchedule}
                              >
                                <SelectTrigger id="weeklyTime">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {TIME_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Monthly Schedule */}
                      <div className="p-4 rounded-md bg-secondary/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Monthly Posts</p>
                              <p className="text-xs text-muted-foreground">Generate monthly summary posts</p>
                            </div>
                          </div>
                          <Switch
                            checked={schedule.monthlyEnabled}
                            onCheckedChange={(checked) => 
                              handleScheduleToggle("monthlyEnabled", checked)
                            }
                            disabled={isLoadingSchedule}
                          />
                        </div>
                        {schedule.monthlyEnabled && (
                          <div className="ml-7 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="monthlyDay">Day of Month</Label>
                              <Select 
                                value={schedule.monthlyDay.toString()}
                                onValueChange={(value) => handleScheduleChange("monthlyDay", parseInt(value))}
                                disabled={isLoadingSchedule}
                              >
                                <SelectTrigger id="monthlyDay">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Day 1-28 of each month
                              </p>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="monthlyTime">Time</Label>
                              <Select 
                                value={schedule.monthlyTime}
                                onValueChange={(value) => handleScheduleChange("monthlyTime", value)}
                                disabled={isLoadingSchedule}
                              >
                                <SelectTrigger id="monthlyTime">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {TIME_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                            checked={notifications[setting.id]}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(setting.id, checked)
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
                      <Button className="w-full">Upgrade to Pro — ₹399/mo</Button>
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