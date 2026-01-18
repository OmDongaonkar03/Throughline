import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Save,
  Sliders,
  Target,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Info,
  Hash,
  Smile
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { toneProfileService } from "@/services/toneProfileService";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WRITING_GOALS = [
  { value: "educate", label: "Educate & Inform" },
  { value: "inspire", label: "Inspire & Motivate" },
  { value: "entertain", label: "Entertain & Engage" },
  { value: "share", label: "Share Experiences" },
  { value: "network", label: "Network & Connect" },
  { value: "promote", label: "Promote & Market" },
];

const TARGET_AUDIENCES = [
  { value: "professionals", label: "Professionals & Executives" },
  { value: "entrepreneurs", label: "Entrepreneurs & Founders" },
  { value: "students", label: "Students & Learners" },
  { value: "developers", label: "Developers & Tech Community" },
  { value: "creatives", label: "Creatives & Artists" },
  { value: "general", label: "General Public" },
];

const ToneCustomization = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  // AI-extracted tone data (read-only display)
  const [aiTone, setAiTone] = useState({
    voice: "",
    sentenceStyle: "",
    emotionalRange: "",
  });

  // Customizable fields
  const [formData, setFormData] = useState({
    customVoice: "",
    customSentenceStyle: "",
    customEmotionalRange: "",
    contentPurpose: "",
    writingGoals: [],
    targetAudience: [],
    toneCharacteristics: {
      formality: 5,
      enthusiasm: 5,
      humor: 5,
      technicality: 5,
    },
    preferredLength: "moderate",
    includeEmojis: false,
    includeHashtags: true,
  });

  const { toast } = useToast();
  const { apiRequest } = useAuth();

  useEffect(() => {
    fetchToneProfile();
  }, []);

  const fetchToneProfile = async () => {
    try {
      setIsLoading(true);
      const data = await toneProfileService.getToneProfile(apiRequest);
      
      if (data.hasProfile && data.toneProfile) {
        const profile = data.toneProfile;
        
        // Set AI-extracted tone (read-only)
        setAiTone({
          voice: profile.voice || "",
          sentenceStyle: profile.sentenceStyle || "",
          emotionalRange: profile.emotionalRange || "",
        });

        // Set customizable fields (editable)
        setFormData({
          customVoice: profile.customVoice || "",
          customSentenceStyle: profile.customSentenceStyle || "",
          customEmotionalRange: profile.customEmotionalRange || "",
          contentPurpose: profile.contentPurpose || "",
          writingGoals: profile.writingGoals || [],
          targetAudience: profile.targetAudience || [],
          toneCharacteristics: profile.toneCharacteristics || {
            formality: 5,
            enthusiasm: 5,
            humor: 5,
            technicality: 5,
          },
          preferredLength: profile.preferredLength || "moderate",
          includeEmojis: profile.includeEmojis || false,
          includeHashtags: profile.includeHashtags !== undefined ? profile.includeHashtags : true,
        });
        
        setHasProfile(true);
      } else {
        // No profile exists yet, but user can create one manually
        setHasProfile(false);
        setAiTone({
          voice: "",
          sentenceStyle: "",
          emotionalRange: "",
        });
      }
    } catch (error) {
      console.error("Error fetching tone profile:", error);
      // Even on error, allow user to create manually
      setHasProfile(false);
      setAiTone({
        voice: "",
        sentenceStyle: "",
        emotionalRange: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await toneProfileService.updateToneProfile(apiRequest, formData);
      
      toast({
        title: "Success",
        description: "Tone profile updated successfully",
      });
      
      await fetchToneProfile();
    } catch (error) {
      console.error("Error updating tone profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tone profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      writingGoals: prev.writingGoals.includes(goal)
        ? prev.writingGoals.filter(g => g !== goal)
        : [...prev.writingGoals, goal]
    }));
  };

  const toggleAudience = (audience) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter(a => a !== audience)
        : [...prev.targetAudience, audience]
    }));
  };

  const updateCharacteristic = (key, value) => {
    setFormData(prev => ({
      ...prev,
      toneCharacteristics: {
        ...prev.toneCharacteristics,
        [key]: value[0],
      }
    }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading tone profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-medium text-foreground">Customize Your Tone</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Fine-tune how your AI-generated posts sound and what they aim to achieve
            </p>
          </div>

          {/* AI-Detected Tone (Read-only) */}
          {hasProfile && (aiTone.voice || aiTone.sentenceStyle || aiTone.emotionalRange) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">AI-Detected Writing Style</CardTitle>
                </div>
                <CardDescription>
                  Based on your sample posts - these are automatically extracted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Voice</Label>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md min-h-[60px]">
                      {aiTone.voice || "Not available"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Sentence Style</Label>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md min-h-[60px]">
                      {aiTone.sentenceStyle || "Not available"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Emotional Range</Label>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md min-h-[60px]">
                      {aiTone.emotionalRange || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alert for users without AI analysis */}
          {!hasProfile && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Manual Setup:</strong> You can configure your tone manually below. 
                For AI-powered tone analysis, add at least 3 sample posts in the <Link to="/samples" className="underline">Samples</Link> section.
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Overrides */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">
                  {hasProfile ? "Override Writing Style" : "Define Your Writing Style"}
                </CardTitle>
              </div>
              <CardDescription>
                {hasProfile 
                  ? "Customize how you want your posts to sound (overrides AI detection)"
                  : "Define how you want your posts to sound"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customVoice">Voice & Personality</Label>
                <Textarea
                  id="customVoice"
                  placeholder="e.g., Professional yet approachable, conversational, authoritative..."
                  value={formData.customVoice}
                  onChange={(e) => setFormData({ ...formData, customVoice: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customSentenceStyle">Sentence Style</Label>
                <Textarea
                  id="customSentenceStyle"
                  placeholder="e.g., Short and punchy, flowing and descriptive, mix of both..."
                  value={formData.customSentenceStyle}
                  onChange={(e) => setFormData({ ...formData, customSentenceStyle: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customEmotionalRange">Emotional Tone</Label>
                <Textarea
                  id="customEmotionalRange"
                  placeholder="e.g., Optimistic and energetic, calm and measured, empathetic..."
                  value={formData.customEmotionalRange}
                  onChange={(e) => setFormData({ ...formData, customEmotionalRange: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Purpose & Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Content Goals & Purpose</CardTitle>
              </div>
              <CardDescription>
                Define what you want to achieve with your posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contentPurpose">Main Purpose</Label>
                <Textarea
                  id="contentPurpose"
                  placeholder="What do you want to achieve through your posts? e.g., Build thought leadership, share knowledge, grow my audience..."
                  value={formData.contentPurpose}
                  onChange={(e) => setFormData({ ...formData, contentPurpose: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label>Writing Goals (Select all that apply)</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {WRITING_GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => toggleGoal(goal.value)}
                      className={`
                        px-4 py-2.5 rounded-md text-sm font-medium text-left transition-colors
                        ${formData.writingGoals.includes(goal.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                        }
                      `}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Target Audience (Select all that apply)</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {TARGET_AUDIENCES.map((audience) => (
                    <button
                      key={audience.value}
                      onClick={() => toggleAudience(audience.value)}
                      className={`
                        px-4 py-2.5 rounded-md text-sm font-medium text-left transition-colors
                        ${formData.targetAudience.includes(audience.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                        }
                      `}
                    >
                      {audience.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tone Characteristics */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Tone Characteristics</CardTitle>
              </div>
              <CardDescription>
                Adjust the balance of different elements in your writing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Formality Level</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.toneCharacteristics.formality}/10
                  </span>
                </div>
                <Slider
                  value={[formData.toneCharacteristics.formality]}
                  onValueChange={(value) => updateCharacteristic('formality', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Casual</span>
                  <span>Professional</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Enthusiasm Level</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.toneCharacteristics.enthusiasm}/10
                  </span>
                </div>
                <Slider
                  value={[formData.toneCharacteristics.enthusiasm]}
                  onValueChange={(value) => updateCharacteristic('enthusiasm', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Neutral</span>
                  <span>Energetic</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Humor</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.toneCharacteristics.humor}/10
                  </span>
                </div>
                <Slider
                  value={[formData.toneCharacteristics.humor]}
                  onValueChange={(value) => updateCharacteristic('humor', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Serious</span>
                  <span>Playful</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Technical Depth</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.toneCharacteristics.technicality}/10
                  </span>
                </div>
                <Slider
                  value={[formData.toneCharacteristics.technicality]}
                  onValueChange={(value) => updateCharacteristic('technicality', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Simple</span>
                  <span>Technical</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formatting Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formatting Preferences</CardTitle>
              <CardDescription>
                Control the structure and styling of your posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="preferredLength">Preferred Post Length</Label>
                <Select
                  value={formData.preferredLength}
                  onValueChange={(value) => setFormData({ ...formData, preferredLength: value })}
                >
                  <SelectTrigger id="preferredLength">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise (Short & punchy)</SelectItem>
                    <SelectItem value="moderate">Moderate (Balanced)</SelectItem>
                    <SelectItem value="detailed">Detailed (In-depth)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="includeEmojis" className="cursor-pointer">Include Emojis</Label>
                    <p className="text-xs text-muted-foreground">Add emojis to make posts more engaging</p>
                  </div>
                </div>
                <Switch
                  id="includeEmojis"
                  checked={formData.includeEmojis}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeEmojis: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="includeHashtags" className="cursor-pointer">Include Hashtags</Label>
                    <p className="text-xs text-muted-foreground">Add relevant hashtags to posts</p>
                  </div>
                </div>
                <Switch
                  id="includeHashtags"
                  checked={formData.includeHashtags}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeHashtags: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Customizations"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ToneCustomization;