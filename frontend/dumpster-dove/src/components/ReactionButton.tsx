import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ReactionButtonProps {
  emoji: string;
  count: number;
  onClick: () => void;
}

export const ReactionButton = ({ emoji, count, onClick }: ReactionButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Reaction button clicked:", { emoji, count });
    
    // Instagram-like press effect
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all duration-200 select-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 ${
        isPressed ? "scale-95 transform" : "hover:scale-105"
      }`}
      style={{ cursor: 'pointer', pointerEvents: 'auto', zIndex: 10 }}
      type="button"
    >
      <span className={`text-lg transition-transform duration-200 ${
        isPressed ? "scale-125" : ""
      }`}>
        {emoji}
      </span>
      <span className="text-sm font-semibold transition-colors duration-200 text-gray-600">
        {count}
      </span>
    </button>
  );
};
