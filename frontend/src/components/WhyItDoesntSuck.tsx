import { motion } from "framer-motion";
import { Zap, User, Award } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    tagline: "Your brain is full. We remember for you.",
    description: "Log messy thoughts. We find the patterns you forgot existed.",
  },
  {
    icon: User,
    tagline: "Sounds like you, not a robot",
    description: "We learn your voice. Your posts feel like you wrote them - because you did, just scattered across days.",
  },
  {
    icon: Award,
    tagline: "Progress is invisible until you tell the story",
    description: "Scattered check-ins become coherent narratives. Your journey, connected.",
  },
];

export const WhyItDoesntSuck = () => {
  return (
    <section className="py-24 lg:py-32 px-4 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">Why this isn't another AI writer</h2>
          <p className="section-subheading mx-auto">
            You don't need perfect thoughts. You need a memory layer.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.tagline}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="card-elevated p-6 text-center h-full">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                
                <h3 className="text-base font-medium text-foreground mb-2">
                  {benefit.tagline}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};