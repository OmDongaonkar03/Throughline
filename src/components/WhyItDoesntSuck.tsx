import { motion } from "framer-motion";
import { Zap, User, Award } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    tagline: "No more blank screen paralysis",
    description: "You have content. You just forgot it existed.",
  },
  {
    icon: User,
    tagline: "Sounds like you, not ChatGPT",
    description: "Upload 4-5 of your posts. We match your style.",
  },
  {
    icon: Award,
    tagline: "Your work deserves to be seen",
    description: "From scattered check-ins to coherent growth stories.",
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
          <h2 className="section-heading mb-4">Why it doesn't s*ck</h2>
          <p className="section-subheading mx-auto">
            Content creation shouldn't feel like work
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
