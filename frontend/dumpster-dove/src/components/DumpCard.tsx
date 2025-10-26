import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface DumpCardProps {
  message: string;
  delay?: number;
  direction?: "left" | "right";
}

const DumpCard = ({ message, delay = 0, direction = "right" }: DumpCardProps) => {
  const animationClass = direction === "left" ? "animate-slide-in-left" : "animate-slide-in-right";
  
  return (
    <Card 
      className={`p-4 bg-card border-border transition-all duration-300 max-w-sm ${animationClass} hover:scale-105 hover:shadow-[var(--card-hover-shadow)]`}
      style={{ 
        animationDelay: `${delay}ms`,
        boxShadow: "var(--card-shadow)"
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border-2 border-muted">
          <AvatarFallback className="bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground">Anonymous</span>
            <span className="text-xs text-muted-foreground">@anonymous</span>
          </div>
          <p className="text-foreground text-sm leading-relaxed break-words">
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default DumpCard;

