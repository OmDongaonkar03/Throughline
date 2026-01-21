import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const userParam = searchParams.get("user");
      const error = searchParams.get("error");

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Failed to authenticate with Google. Please try again.",
        });
        navigate("/auth");
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Store token in localStorage
          localStorage.setItem("accessToken", token);

          toast({
            title: "Welcome!",
            description: user.name ? `Welcome, ${user.name}!` : "Successfully signed in with Google.",
          });

          // Check if user needs onboarding
          if (user.hasCompletedOnboarding === false) {
            navigate("/onboarding");
          } else {
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Error parsing user data:", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process authentication. Please try again.",
          });
          navigate("/auth");
        }
      } else if (token) {
        // Fallback: if only token is provided (shouldn't happen with new backend)
        localStorage.setItem("accessToken", token);
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid authentication response. Please try again.",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    </div>
  );
}