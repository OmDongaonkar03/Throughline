import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, PenLine, Sparkles, Heart, ArrowLeft } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/logo-icon.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-foreground font-medium">Throughline</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">About Throughline</h1>
            <p className="text-muted-foreground">
              Your personal memory layer for what you're building and thinking
            </p>
          </div>

          <div className="space-y-6">
            {/* Main Story */}
            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">What is Throughline?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Throughline is a memory layer for what you're building, learning, and thinking over time. Instead of trying to write perfect posts every day, you simply log small "check-ins" — messy notes about what you worked on, what you learned, what confused you, or what moved you forward.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                      These check-ins don't need polish. They're raw inputs. Throughline remembers them, finds patterns across days and weeks, and turns them into coherent stories in your own voice.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">The Problem We're Solving</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Building in public is powerful, but it's exhausting. You're supposed to share your journey, document your progress, and engage your audience — all while actually building the thing you're building. Most people abandon this after a few posts because it feels like extra work.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                      We believe the problem isn't lack of content — it's that your brain is already doing the work of processing your journey. You just need a way to capture those thoughts without the pressure of making them perfect.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-6 mt-6">
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <PenLine className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground">Daily Check-ins</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Log what you worked on, learned, struggled with, or discovered. No pressure to write perfectly — just capture what matters.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground">Memory Over Time</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          We remember your check-ins, find patterns across days and weeks, and connect the dots you might have missed.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground">Coherent Stories</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Generate daily, weekly, or monthly narratives in your own voice. Refine, regenerate, and adapt for different platforms.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Our Philosophy</h2>
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        <strong>Show up honestly, not perfectly.</strong> You don't need to have everything figured out. Just log what matters. Throughline will connect the dots and help you tell the story you didn't realize you were already writing.
                      </p>
                      <p>
                        <strong>Your voice, amplified.</strong> We use AI to process your thoughts and generate content, but it's always in your voice. You retain full ownership of everything you create.
                      </p>
                      <p>
                        <strong>Build a throughline.</strong> Your work tells a story. We help you see the thread that connects each day's progress into something bigger.
                      </p>
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6">What You Can Do</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Dashboard</p>
                      <p className="text-sm text-muted-foreground">Track your progress with streaks, activity calendars, and insights</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Check-ins</p>
                      <p className="text-sm text-muted-foreground">Brain-dump your day in 30 seconds</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Posts</p>
                      <p className="text-sm text-muted-foreground">Generate daily, weekly, or monthly narratives from your check-ins</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Samples</p>
                      <p className="text-sm text-muted-foreground">Teach the system how you sound with past posts</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Tone</p>
                      <p className="text-sm text-muted-foreground">Customize your voice, audience, goals, and style</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Settings</p>
                      <p className="text-sm text-muted-foreground">Control when and where posts are generated</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6">Simple Pricing</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border border-border rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Free Tier</h3>
                    <p className="text-3xl font-bold text-foreground mb-4">₹0</p>
                    <p className="text-muted-foreground text-sm mb-4">Limited features, forever free</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Basic check-ins</li>
                      <li>• Limited post generation</li>
                      <li>• Community support</li>
                    </ul>
                  </div>

                  <div className="p-6 border-2 border-primary rounded-lg relative">
                    <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Popular
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Pro Tier</h3>
                    <p className="text-3xl font-bold text-foreground mb-4">₹399<span className="text-base font-normal text-muted-foreground">/month</span></p>
                    <p className="text-muted-foreground text-sm mb-4">Full access to all features</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Unlimited check-ins</li>
                      <li>• Unlimited post generation</li>
                      <li>• Advanced tone customization</li>
                      <li>• Priority support</li>
                      <li>• Early access to new features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">Get in Touch</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Have questions, feedback, or just want to say hi? We'd love to hear from you.
                    </p>
                    <div className="space-y-1">
                      <p className="text-foreground font-medium">Throughline</p>
                      <p className="text-muted-foreground text-sm">Aurangpura, Chhatrapati Sambhajinagar, MH, India</p>
                      <p className="text-muted-foreground text-sm">Email: dongaonkarom2006@gmail.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;