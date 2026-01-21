import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const COLORS_TOP = ["#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

export const AuroraHero = () => {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #050505 50%, ${color})`;

  return (
    <motion.section
      style={{ backgroundImage }}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-24"
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="../../../public/logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-foreground font-medium">Throughline</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="nav-link">
              How it works
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Now in beta
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gradient leading-[1.1] mb-6"
        >
          Check in. We remember.
          <br />
          <span className="text-primary">You share.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Daily check-ins become a coherent story of what you’re building. We
          remember your work over time and turn it into posts that sound like
          you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/auth">
            <Button size="lg" className="gap-2 px-8">
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See how it works
          </Button>
        </motion.div>
      </div>

      {/* Stars background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={50} count={1500} factor={4} fade speed={2} />
        </Canvas>
      </div>
    </motion.section>
  );
};
