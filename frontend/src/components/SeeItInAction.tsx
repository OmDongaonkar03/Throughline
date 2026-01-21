import { motion } from "framer-motion";
import { ArrowRight, PenLine, Sparkles } from "lucide-react";

export const SeeItInAction = () => {
  return (
    <section className="py-24 lg:py-32 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="section-heading mb-4">See it in action</h2>
          <p className="section-subheading mx-auto">
            From brain dump to story worth telling
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6 items-stretch relative"
        >
          {/* Check-in Card */}
          <div className="card-elevated p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Your scattered thoughts</span>
            </div>
            <div className="flex-1 bg-secondary rounded-md p-4 font-mono text-sm text-muted-foreground leading-relaxed">
              "spent all day fixing cors issues with jwt cookies, finally got it working. also refactored the auth middleware but broke something in the process lol. tomorrow need to write tests"
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              No polish required · Just log it
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Generated Post Card */}
          <div className="card-elevated p-6 flex flex-col border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Your story, connected</span>
            </div>
            <div className="flex-1 bg-primary/5 rounded-md p-4 text-sm leading-relaxed space-y-3">
              <p className="text-foreground">
                Three days of CORS errors taught me more about browser security than any tutorial.
              </p>
              <p className="text-foreground">
                Here's what clicked: credentials aren't just about allowing origins—they're about trust boundaries.
              </p>
              <p className="text-muted-foreground italic">
                The fix? Understanding that CORS isn't blocking you—it's protecting your users.
              </p>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              We remembered · We connected · You share
            </div>
          </div>
        </motion.div>

        {/* Mobile arrow */}
        <div className="flex md:hidden justify-center -my-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center rotate-90">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
};