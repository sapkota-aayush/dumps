import { useState, useMemo } from "react";
import { Home, Search, Bell, Megaphone, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BottomNavProps {
  onHashtagSearch?: (searchTerm: string) => void;
  allHashtags?: string[];
}

export const BottomNav = ({ onHashtagSearch, allHashtags = [] }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isFeed = location.pathname === "/feed";

  // Fuzzy search function - finds similar strings
  const fuzzySearch = (query: string, target: string): boolean => {
    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();
    
    // Exact match
    if (targetLower.includes(queryLower)) return true;
    
    // Check if all characters in query appear in order in target
    let queryIndex = 0;
    for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
      if (targetLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Get suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const cleanSearch = searchTerm.toLowerCase();
    const matched = allHashtags.filter(tag => 
      fuzzySearch(cleanSearch, tag)
    ).slice(0, 8); // Limit to 8 suggestions
    
    return matched;
  }, [searchTerm, allHashtags]);

  const handleSearch = (e?: React.FormEvent, selectedTerm?: string) => {
    if (e) e.preventDefault();
    const term = selectedTerm || searchTerm.trim();
    if (term && onHashtagSearch) {
      onHashtagSearch(term);
      setSearchOpen(false);
      setSearchTerm("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(undefined, suggestion);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary/30 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 py-3 pb-safe">
          <div className="flex items-center justify-around gap-2">
            {/* Home Button */}
            <Button
              variant={isFeed ? "default" : "ghost"}
              size="icon"
              onClick={() => navigate("/feed")}
              className={cn(
                "flex-1 h-12 rounded-lg transition-all",
                isFeed
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-accent"
              )}
            >
              <Home className="w-5 h-5" />
            </Button>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="flex-1 h-12 rounded-lg hover:bg-accent transition-all"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // TODO: Navigate to notifications page
              }}
              className="flex-1 h-12 rounded-lg hover:bg-accent transition-all"
            >
              <Bell className="w-5 h-5" />
            </Button>

            {/* Announcements Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // TODO: Navigate to announcements page
              }}
              className="flex-1 h-12 rounded-lg hover:bg-accent transition-all"
            >
              <Megaphone className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={(open) => {
        setSearchOpen(open);
        if (!open) {
          setSearchTerm("");
          setShowSuggestions(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Hashtags & Posts</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by word or hashtag..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
                autoFocus
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 transition-colors"
                    >
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">#{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchTerm("");
                  setShowSuggestions(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!searchTerm.trim()}
                className="flex-1"
              >
                Search
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
