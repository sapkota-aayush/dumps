import { Button } from "@/components/ui/button";

interface ReactionButtonProps {
  emoji: string;
  count: number;
  onClick: () => void;
  isActive?: boolean;
}

export const ReactionButton = ({ emoji, count, onClick, isActive }: ReactionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 hover:opacity-70 transition-opacity ${
        isActive ? "opacity-100" : "opacity-60"
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
        {count}
      </span>
    </button>
  );
};
