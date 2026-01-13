import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CheckIn {
  id: string;
  content: string;
  createdAt: string;
}

interface ActivityCalendarProps {
  dailyCounts: Record<string, number>;
  year: number;
  availableYears: number[];
  startDate: string;
  endDate: string;
  onYearChange: (year: number) => void;
  onDayClick: (date: string) => void;
}

export const ActivityCalendar = ({
  dailyCounts,
  year,
  availableYears,
  startDate,
  endDate,
  onYearChange,
  onDayClick,
}: ActivityCalendarProps) => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Generate calendar grid
  const generateCalendar = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find the Monday of the week containing start date
    const firstDay = new Date(start);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to previous Monday
    firstDay.setDate(firstDay.getDate() + diff);

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const currentDate = new Date(firstDay);

    while (currentDate <= end || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);

      // Stop after creating a complete grid
      if (currentDate > end && currentWeek.length === 7) {
        weeks.push(currentWeek);
        break;
      }
    }

    // Pad the last week if needed
    if (currentWeek.length > 0 && currentWeek.length < 7) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = generateCalendar();

  const getCellColor = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    const count = dailyCounts[dateKey] || 0;
    
    // Check if date is within valid range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (date < start || date > end) {
      return "bg-transparent";
    }

    return count > 0 ? "bg-[#21C45D]" : "bg-muted";
  };

  const getTooltipText = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    const count = dailyCounts[dateKey] || 0;
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    return `${count} check-in${count !== 1 ? "s" : ""} on ${formattedDate}`;
  };

  const isDateInRange = (date: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  };

  const canNavigateYear = (direction: "prev" | "next") => {
    if (direction === "prev") {
      return availableYears[0] < year;
    }
    return availableYears[availableYears.length - 1] > year;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Activity Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onYearChange(year - 1)}
              disabled={!canNavigateYear("prev")}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {year}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onYearChange(year + 1)}
              disabled={!canNavigateYear("next")}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex gap-1 mb-2 ml-8">
              {months.map((month, i) => (
                <div
                  key={month}
                  className="text-[10px] text-muted-foreground"
                  style={{
                    width: `${(100 / 12)}%`,
                    minWidth: "40px",
                  }}
                >
                  {month}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <div className="flex flex-col gap-1 pr-2"></div>

              {/* Calendar grid */}
              <div className="flex gap-1 flex-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date, dayIndex) => {
                      const dateKey = date.toISOString().split("T")[0];
                      const inRange = isDateInRange(date);
                      
                      return (
                        <motion.button
                          key={dayIndex}
                          onClick={() => inRange && onDayClick(dateKey)}
                          disabled={!inRange}
                          whileHover={inRange ? { scale: 1.2 } : {}}
                          className={cn(
                            "w-[10px] h-[10px] rounded-[2px] transition-colors",
                            getCellColor(date),
                            inRange && "cursor-pointer hover:ring-1 hover:ring-primary",
                            !inRange && "opacity-30 cursor-not-allowed"
                          )}
                          title={getTooltipText(date)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#21C45D]" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  checkIns: CheckIn[];
  isLoading: boolean;
}

export const DayDetailsModal = ({
  isOpen,
  onClose,
  date,
  checkIns,
  isLoading,
}: DayDetailsModalProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {date && formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading check-ins...
          </div>
        ) : checkIns.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No check-ins on this day
          </div>
        ) : (
          <div className="space-y-3">
            {checkIns.map((checkIn) => (
              <Card key={checkIn.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground min-w-[65px]">
                      {formatTime(checkIn.createdAt)}
                    </span>
                    <p className="text-sm text-foreground flex-1">
                      {checkIn.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};