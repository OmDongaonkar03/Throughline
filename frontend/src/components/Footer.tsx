import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src="../../public/logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-foreground font-medium text-sm">Throughline</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </nav>
        </div>

        <Separator className="my-8" />

        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Throughline. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
