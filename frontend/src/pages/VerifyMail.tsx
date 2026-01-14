import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { profileService } from "@/services/profileService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus("verifying");
      const result = await profileService.verifyEmail(token);
      
      setStatus("success");
      setMessage(result.message || "Email verified successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Failed to verify email. The link may have expired or already been used.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src="/logo-icon.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-foreground font-medium">Throughline</span>
              </div>

              {/* Status Icon */}
              <div className="flex justify-center">
                {status === "verifying" && (
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                )}
                {status === "success" && (
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                )}
                {status === "error" && (
                  <XCircle className="w-16 h-16 text-destructive" />
                )}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-medium text-foreground mb-2">
                  {status === "verifying" && "Verifying your email..."}
                  {status === "success" && "Email verified!"}
                  {status === "error" && "Verification failed"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {message}
                </p>
              </div>

              {/* Additional Info */}
              {status === "success" && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                  <p className="text-sm text-muted-foreground">
                    Redirecting you to login in a few seconds...
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {status === "success" && (
                  <Button 
                    onClick={() => navigate("/auth")} 
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                )}
                
                {status === "error" && (
                  <>
                    <Button 
                      onClick={() => navigate("/auth")} 
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Need help? Contact support or try logging in to resend the verification email.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;