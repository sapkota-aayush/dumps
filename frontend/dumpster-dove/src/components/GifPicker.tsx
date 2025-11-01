import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface GifPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (gifUrl: string) => void;
}

// Using Giphy API with your key
const GIPHY_API_KEY = "L5m9jLAXcBMyyOoUkSglEK08NLphDbmO";

interface GifResult {
  id: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
    downsized_medium?: {
      url: string;
    };
    downsized?: {
      url: string;
    };
    downsized_large?: {
      url: string;
    };
    fixed_width?: {
      url: string;
    };
  };
}

export const GifPicker = ({ open, onOpenChange, onSelect }: GifPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      // Fallback: show trending GIFs
      try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`);
        const data = await response.json();
        setGifs(data.data || []);
      } catch (err) {
        console.error("Error fetching trending GIFs:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchGifs(searchTerm);
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={() => searchGifs(searchTerm)}>Search</Button>
            <Button variant="outline" onClick={loadTrending}>Trending</Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading GIFs...</p>
            </div>
          ) : gifs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    // Try smaller versions first: downsized_large has 2MB max, downsized has no limit but compressed
                    const gifUrl = 
                      gif.images.downsized_large?.url ||  // Max 2MB
                      gif.images.downsized_medium?.url || // Usually < 1MB
                      gif.images.downsized?.url ||        // Compressed but can be large
                      gif.images.fixed_width?.url ||      // Fixed size
                      gif.images.original.url;             // Fallback
                    onSelect(gifUrl);
                    onOpenChange(false);
                  }}
                  className="relative aspect-video rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt="GIF"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Search for GIFs or click "Trending" to see popular GIFs</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
