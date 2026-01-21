import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  "No credit card required",
  "Start tracking in 30 seconds", 
  "Cancel anytime",
];

export const FinalCTA = () => {
  return (
    <section className="py-24 lg:py-32 px-4 bg-card/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card-elevated p-8 md:p-12 text-center"
        >
          <h2 className="section-heading mb-4">
            Stop losing your progress to time
          </h2>
          
          <p className="section-subheading mx-auto mb-8">
            You're building something. We'll help you remember and share it.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                {benefit}
              </div>
            ))}
          </div>

          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Start your memory layer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};