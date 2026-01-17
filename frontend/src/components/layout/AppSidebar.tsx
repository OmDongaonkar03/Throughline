import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PenLine,
  FileText,
  Layers,
  Sliders,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PenLine, label: "Check-ins", path: "/check-ins" },
  { icon: FileText, label: "Posts", path: "/posts" },
  { icon: Layers, label: "Samples", path: "/samples" },
  { icon: Sliders, label: "Customize Tone", path: "/tone" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar = ({ className }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-8 h-8 rounded-md flex items-center justify-center">
              <img
                src="logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-foreground font-medium">Throughline</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
};