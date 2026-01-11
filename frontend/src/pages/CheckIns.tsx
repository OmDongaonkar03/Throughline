import { motion } from "framer-motion";
import { 
  Plus,
  Calendar,
  Clock
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const pastCheckins = [
  { 
    date: "Today",
    entries: [
      { time: "10:30 AM", text: "Finished implementing the payment integration with Stripe. Had to debug webhook signatures for 2 hours." },
    ]
  },
  {
    date: "Yesterday",
    entries: [
      { time: "6:45 PM", text: "Wrapped up the dashboard redesign. Feels cleaner now." },
      { time: "11:00 AM", text: "Morning standup - decided to prioritize the analytics feature." },
    ]
  },
  {
    date: "Dec 6, 2024",
    entries: [
      { time: "4:30 PM", text: "Deployed v2.0 to production. No major bugs so far." },
    ]
  },
];

const CheckIns = () => {
  const [checkinText, setCheckinText] = useState("");

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-foreground mb-1">Check-ins</h1>
            <p className="text-muted-foreground text-sm">Track your daily progress and learnings</p>
          </div>

          {/* New Check-in */}
          <Card className="mb-8">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <Textarea
                    value={checkinText}
                    onChange={(e) => setCheckinText(e.target.value)}
                    placeholder="What did you work on today? What did you learn?"
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Be specific. The more detail, the better your posts.
                    </p>
                    <Button>Save Check-in</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Past Check-ins */}
          <div className="space-y-6">
            {pastCheckins.map((day) => (
              <div key={day.date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{day.date}</span>
                </div>
                <div className="space-y-3">
                  {day.entries.map((entry, entryIndex) => (
                    <Card key={entryIndex} className="hover:border-border/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[72px]">
                            <Clock className="w-3 h-3" />
                            {entry.time}
                          </div>
                          <p className="text-sm text-foreground flex-1">{entry.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CheckIns;
