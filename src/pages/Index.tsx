import { AuroraHero } from "@/components/ui/aurora-hero";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyItDoesntSuck } from "@/components/WhyItDoesntSuck";
import { SeeItInAction } from "@/components/SeeItInAction";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
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
