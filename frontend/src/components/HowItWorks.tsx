import { motion } from "framer-motion";
import { Edit3, Layers, Send } from "lucide-react";

const steps = [
  {
    icon: Edit3,
    title: "Check in daily",
    description: "Tell us what you built, learned, or shipped. Takes 30 seconds.",
  },
  {
    icon: Layers,
    title: "We compress your journey",
    description: "Daily → weekly → monthly memory. No clutter, just growth.",
  },
  {
    icon: Send,
    title: "Generate posts on demand",
    description: "Real stories from your work, in your voice. Ready to share.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">How it works</h2>
          <p className="section-subheading mx-auto">
            Three simple steps from scattered thoughts to polished content
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative"
            >
              <div className="card-elevated p-6 lg:p-8 h-full">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                {/* Icon */}
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
