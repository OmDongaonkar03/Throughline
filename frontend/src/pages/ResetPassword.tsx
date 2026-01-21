import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Link",
        description: "This password reset link is invalid or has expired.",
      });
      navigate("/auth");
    }
  }, [token, navigate, toast]);

  const validatePasswordStrength = (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[@$!%*?&]/.test(password)) {
      return "Password must contain at least one special character (@$!%*?&)";
    }
    if (!passwordRegex.test(password)) {
      return "Password does not meet requirements";
    }
    return "";
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
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setValidationError(strengthError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, newPassword);

      if (result.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. Please login with your new password.",
        });
        navigate("/auth");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: result.error || "Failed to reset password. Please try again.",
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

  if (!token) {
    return null;
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

        {/* Password Requirements */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Password must contain:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• At least 8 characters</li>
            <li>• One uppercase letter</li>
            <li>• One lowercase letter</li>
            <li>• One special character (@$!%*?&)</li>
          </ul>
        </div>

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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;