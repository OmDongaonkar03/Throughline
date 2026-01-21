import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, AlertCircle } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationAlert, setVerificationAlert] = useState(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const { signup, login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
    import.meta.env.VITE_GOOGLE_CLIENT_ID
  }&redirect_uri=${
    import.meta.env.VITE_API_URL
  }/auth/google/callback&response_type=code&scope=email%20profile`;

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[@$!%*?&]/.test(password)
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setVerificationAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationAlert(null);

    if (!isLogin && !validatePassword(formData.password)) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
      });
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await signup(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        if (!isLogin && result.verificationSent) {
          toast({
            title: "Account created!",
            description:
              "Please check your email to verify your account before logging in.",
          });
          setVerificationAlert({
            type: "success",
            message:
              "Account created! Please check your email to verify your account.",
          });
        } else {
          toast({
            title: isLogin ? "Welcome back!" : "Account created!",
            description: isLogin
              ? "You've successfully signed in."
              : "Your account has been created successfully.",
          });
          
          // Check if user needs onboarding
          const user = result.data?.user;
          if (user && !user.hasCompletedOnboarding) {
            navigate("/onboarding");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        if (result.needsVerification) {
          setVerificationAlert({
            type: "warning",
            message: result.verificationSent
              ? "Email not verified. A new verification link has been sent to your email."
              : result.error,
          });
        }

        toast({
          variant: result.needsVerification ? "default" : "destructive",
          title: result.needsVerification ? "Verification Required" : "Error",
          description:
            result.error || "Authentication failed. Please try again.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);

    try {
      const result = await forgotPassword(forgotPasswordEmail);

      if (result.success) {
        setEmailSentSuccess(true);
        setResendCount(resendCount + 1);
        toast({
          title: "Email sent!",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to send reset email.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description:
          "You've reached the maximum number of reset emails for today.",
      });
      return;
    }
    await handleForgotPassword({ preventDefault: () => {} });
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", password: "" });
    setVerificationAlert(null);
  };

  const handleCloseForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setEmailSentSuccess(false);
    setResendCount(0);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-foreground font-medium">Throughline</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-medium text-foreground mb-1">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to continue to Throughline"
                : "Join Throughline and start your journey"}
            </p>
          </div>

          {/* Verification alert */}
          {verificationAlert && (
            <Alert
              className={`mb-4 ${verificationAlert.type === "warning" ? "border-amber-500" : ""}`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verificationAlert.message}</AlertDescription>
            </Alert>
          )}

          {/* Google login */}
          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => (window.location.href = googleAuthUrl)}
              disabled={isLoading}
            >
              <FaGoogle className="w-4 h-4" />
              Continue with Google
            </Button>
          </div>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground uppercase">
              or
            </span>
          </div>

          {/* Email form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    id="name"
                    placeholder="Jane Smith"
                    className="pl-9"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {!isLogin && formData.password && (
              <PasswordStrengthIndicator password={formData.password} />
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          {/* Toggle auth mode */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={handleToggleMode}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right side - Branding panel */}
      <div className="hidden lg:flex flex-1 bg-card border-l border-border items-center justify-center p-12">
        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h2 className="text-2xl font-medium text-foreground mb-4">
              Your work tells a story
            </h2>
            <p className="text-muted-foreground mb-8">
              Daily check-ins become authentic social posts. Track what you
              build, let us remember, and generate content that sounds like you.
            </p>

            <div className="space-y-4">
              {[
                "30-second daily check-ins",
                "AI-powered memory compression",
                "Posts in your authentic voice",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog
        open={showForgotPassword}
        onOpenChange={handleCloseForgotPasswordDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              {emailSentSuccess
                ? "Check your email for the password reset link."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {!emailSentSuccess ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    id="forgot-email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={isForgotPasswordLoading}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isForgotPasswordLoading}
              >
                {isForgotPasswordLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We've sent a password reset link to{" "}
                  <strong>{forgotPasswordEmail}</strong>. The link will expire
                  in 15 minutes.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground text-center">
                Didn't receive the email?
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isForgotPasswordLoading || resendCount >= 3}
              >
                {isForgotPasswordLoading ? "Sending..." : "Resend email"}
              </Button>

              {resendCount >= 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  Maximum resend limit reached (3 per day). Please try again
                  tomorrow.
                </p>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleCloseForgotPasswordDialog}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;