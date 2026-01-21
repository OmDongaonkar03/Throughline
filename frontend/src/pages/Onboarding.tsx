import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  FileEdit, 
  Sparkles, 
  Check, 
  Rocket,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const slides = [
  {
    icon: Brain,
    title: "Throughline is a memory layer for what you're building and thinking.",
    description: "Instead of trying to capture perfect thoughts, we help you build a continuous thread of your journey over time.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: FileEdit,
    title: "A check-in is just a messy note about your day.",
    description: "What you worked on, what confused you, what clicked. No pressure to polish—just raw progress.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "We remember them over time and turn them into coherent stories.",
    description: "Your scattered notes become narratives. We find the patterns you didn't see and help you share your journey.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Check,
    title: "You don't need to write perfectly. Just log what matters.",
    description: "Show up honestly, not perfectly. The goal isn't daily perfection—it's capturing the moments that move you forward.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Rocket,
    title: "Start with one check-in. Let the story build.",
    description: "You're not starting from zero. Every entry adds to your throughline. Let's begin your journey.",
    color: "from-indigo-500 to-purple-500",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const { toast } = useToast();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeOnboarding();
      if (result.success) {
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isCompleting}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center shadow-lg`}>
                  <CurrentIcon className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-4">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </div>

              {/* Navigation */}
              <div className="pt-8 space-y-4">
                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? "w-8 bg-primary"
                          : "w-2 bg-muted hover:bg-muted-foreground/30"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  {currentSlide > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isCompleting}
                      className="flex-1"
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={isCompleting}
                    className="flex-1"
                  >
                    {isCompleting ? (
                      "Loading..."
                    ) : currentSlide === slides.length - 1 ? (
                      <>
                        Get Started
                        <Rocket className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {currentSlide + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;