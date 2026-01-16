import { motion } from "framer-motion";
import { 
  User,
  Bell,
  CreditCard,
  ChevronRight,
  Check,
  Share2
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
import { platformService } from "@/services/platformService";
import { useNavigate } from "react-router-dom";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { id: "platforms", label: "Platforms", icon: Share2, description: "Selected social platforms" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "How we contact you" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Manage your subscription" },
];

const platformsConfig = [
  { 
    id: "linkedinEnabled", 
    label: "LinkedIn", 
    logo: "platforms/linkedin.png",
  },
  { 
    id: "xEnabled", 
    label: "X (Twitter)", 
    logo: "platforms/twitter.png",
  },
  { 
    id: "redditEnabled", 
    label: "Reddit", 
    logo: "platforms/reddit.png",
  },
];

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
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
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
      
      // Check if user is verified
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

  // Fetch notification settings on mount
  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  // Fetch platform settings on mount
  useEffect(() => {
    fetchPlatformSettings();
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
      
      // Check if verification is needed
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

  const fetchPlatformSettings = async () => {
    try {
      const settings = await platformService.getSettings(apiRequest);
      setPlatforms({
        xEnabled: settings.xEnabled,
        linkedinEnabled: settings.linkedinEnabled,
        redditEnabled: settings.redditEnabled,
      });
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      
      // Check if verification is needed
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to load platform settings",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = async (key, value) => {
    // Optimistic update
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

      // Update with server response to ensure consistency
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
      // Revert to previous state on error
      setNotifications(previousState);
      console.error("Error updating notification settings:", error);
      
      // Check if verification is needed
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

  const handlePlatformToggle = async (key, value) => {
    // Check if disabling would leave no platforms enabled
    if (!value) {
      // Only check when disabling (value = false)
      const updatedPlatforms = {
        ...platforms,
        [key]: value
      };
      
      const enabledCount = Object.values(updatedPlatforms).filter(Boolean).length;
      
      if (enabledCount === 0) {
        toast({
          title: "Cannot disable all platforms",
          description: "At least one platform must be enabled",
          variant: "destructive",
        });
        return;
      }
    }

    // Optimistic update
    const previousState = { ...platforms };
    const updatedPlatforms = {
      ...platforms,
      [key]: value
    };
    setPlatforms(updatedPlatforms);

    try {
      setIsLoadingPlatforms(true);

      const updatedSettings = await platformService.updateSettings(apiRequest, {
        [key]: value,
      });

      // Update with server response to ensure consistency
      setPlatforms({
        xEnabled: updatedSettings.xEnabled,
        linkedinEnabled: updatedSettings.linkedinEnabled,
        redditEnabled: updatedSettings.redditEnabled,
      });

      toast({
        title: "Success",
        description: "Platform settings updated",
      });
    } catch (error) {
      // Revert to previous state on error
      setPlatforms(previousState);
      console.error("Error updating platform settings:", error);
      
      // Check if verification is needed
      if (error.message.includes("verify") || error.message.includes("Verification")) {
        navigate("/auth");
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update platform settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlatforms(false);
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

      // If email was changed, user will be logged out
      if (result.emailChanged && result.loggedOut) {
        toast({
          title: "Email Changed",
          description: "Please check your email to verify your new address. Logging out...",
        });
        
        // Wait a moment for user to see the message, then logout
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

                {activeSection === "platforms" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <CardHeader className="p-0">
                      <CardTitle className="text-base">Platform Settings</CardTitle>
                    </CardHeader>
                    
                    <div className="space-y-4">
                      {platformsConfig.map((platform) => (
                        <div 
                          key={platform.id}
                          className="flex items-center justify-between p-4 rounded-md bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={platform.logo} 
                              alt={platform.label}
                              className="w-8 h-8 object-contain rounded-md bg-white p-1"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">{platform.label}</p>
                            </div>
                          </div>
                          <Switch
                            checked={platforms[platform.id]}
                            onCheckedChange={(checked) => 
                              handlePlatformToggle(platform.id, checked)
                            }
                            disabled={isLoadingPlatforms}
                          />
                        </div>
                      ))}
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