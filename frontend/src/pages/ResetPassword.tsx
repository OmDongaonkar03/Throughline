import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { validateResetToken, resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(false);
        setTokenError(
          "No reset token provided. Please request a new password reset link.",
        );
        setIsValidatingToken(false);
        return;
      }

      setIsValidatingToken(true);
      const result = await validateResetToken(token);

      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setTokenError(result.message || "Invalid or expired reset link.");
      }

      setIsValidatingToken(false);
    };

    checkToken();
  }, [token, validateResetToken]);

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[@$!%*?&]/.test(password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Validate password match
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      setValidationError("Password does not meet all requirements");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, newPassword);

      if (result.success) {
        toast({
          title: "Password Reset Successful",
          description:
            "Your password has been reset. Please login with your new password.",
        });
        navigate("/auth");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description:
            result.error || "Failed to reset password. Please try again.",
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

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
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

          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{tokenError}</AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your password reset link may have expired or is invalid. Please
              request a new one.
            </p>

            <Link to="/auth">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Back to login */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
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
            Create new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Your new password must be different from previously used passwords
          </p>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                id="newPassword"
                placeholder="••••••••"
                className="pl-9"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setValidationError("");
                }}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError("");
                }}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {newPassword && <PasswordStrengthIndicator password={newPassword} />}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
