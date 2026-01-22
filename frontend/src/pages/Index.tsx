import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuroraHero } from "@/components/ui/aurora-hero";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyItDoesntSuck } from "@/components/WhyItDoesntSuck";
import { SeeItInAction } from "@/components/SeeItInAction";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { useAuth } from "../context/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuroraHero />
      <HowItWorks />
      <WhyItDoesntSuck />
      <SeeItInAction />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;