import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className={cn("flex-1 lg:ml-0", className)}>
        {children}
      </main>
    </div>
  );
};
