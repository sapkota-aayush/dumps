import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/services/api";
import { Sparkles, MessageSquare, Hash, Shield, Share2 } from "lucide-react";
import { toast } from "sonner";

interface WildThought {
  id: number;
  content: string;
  created_at: string | null;
}

const ComingSoon = () => {
  const [scanPosition, setScanPosition] = useState<number | null>(null);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [wildThought, setWildThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wildThoughtsCount, setWildThoughtsCount] = useState(0);
  const [wildThoughts, setWildThoughts] = useState<WildThought[]>([]);
  const [isLoadingThoughts, setIsLoadingThoughts] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Check if we've already tracked this device to prevent duplicate counts
    const alreadyTracked = localStorage.getItem("dumps_scan_tracked");
    
    const trackScan = async () => {
      try {
        // If already tracked, just get the count
        if (alreadyTracked) {
          const count = await apiService.getScanCount();
          setTotalScans(count.total);
          // Try to get position from stored value
          const storedPosition = localStorage.getItem("dumps_scan_position");
          if (storedPosition) {
            setScanPosition(parseInt(storedPosition));
          }
        } else {
          // First time visit - track the scan
          const result = await apiService.trackScan();
          setScanPosition(result.position);
          setTotalScans(result.total);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          
          // Store in localStorage to prevent duplicate tracking
          localStorage.setItem("dumps_scan_tracked", "true");
          localStorage.setItem("dumps_scan_position", result.position.toString());
        }
        
        // Get wild thoughts count
        const wtCount = await apiService.getWildThoughtsCount();
        setWildThoughtsCount(wtCount.total);
      } catch (error) {
        console.error("Failed to track scan:", error);
        // If tracking fails, try to get count only
        try {
          const count = await apiService.getScanCount();
          setTotalScans(count.total);
        } catch (e) {
          console.error("Failed to get scan count:", e);
        }
      } finally {
        setHasTracked(true);
      }
    };

    trackScan();
  }, []);

  // Fetch wild thoughts
  useEffect(() => {
    const fetchWildThoughts = async () => {
      setIsLoadingThoughts(true);
      try {
        const result = await apiService.getWildThoughts(1, 20);
        setWildThoughts(result.thoughts);
      } catch (error) {
        console.error("Failed to fetch wild thoughts:", error);
      } finally {
        setIsLoadingThoughts(false);
      }
    };

    fetchWildThoughts();
  }, []);

  const handleSubmitWildThought = async () => {
    if (!wildThought.trim()) {
      toast.error("Write something first!");
      return;
    }

    if (wildThought.length > 5000) {
      toast.error("Your thought is too long (max 5000 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.submitWildThought(wildThought.trim());
      toast.success(result.message);
      setWildThought("");
      
      // Refresh counts and thoughts list
      const wtCount = await apiService.getWildThoughtsCount();
      setWildThoughtsCount(wtCount.total);
      
      // Fetch updated thoughts list
      const thoughtsResult = await apiService.getWildThoughts(1, 20);
      setWildThoughts(thoughtsResult.thoughts);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit your thought");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Dumps.online - Coming Soon!",
          text: "Check out Dumps.online - A safe space to dump your thoughts anonymously!",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };


  const formatNumber = (num: number): string => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${num}th`;
    }
    
    switch (lastDigit) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Just now";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted overflow-hidden pb-safe">
      {/* Enhanced Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Main celebration emoji */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl sm:text-7xl animate-bounce">
            🎉
          </div>
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 text-2xl sm:text-3xl animate-ping"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s',
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-100px)`,
              }}
            >
              {['🎊', '✨', '🌟', '💥'][i % 4]}
            </div>
          ))}
        </div>
      )}

      {/* Animated background elements with more movement */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-destructive/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header with scan position - Enhanced animations */}
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4 animate-fade-in-up">
          {scanPosition !== null ? (
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent leading-tight animate-pulse">
                <span className="inline-block animate-bounce" style={{ animationDuration: '2s' }}>🎉</span> YOU'RE THE{" "}
                <span className="inline-block animate-pulse bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent" style={{ animationDuration: '1.5s' }}>
                  {formatNumber(scanPosition)}
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-semibold animate-fade-in">
                STUDENT TO SCAN!
              </p>
              {/* Animated underline */}
              <div className="w-32 sm:w-48 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse rounded-full"></div>
            </div>
          ) : hasTracked ? (
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent leading-tight">
                Welcome to Dumps!
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                {totalScans > 0 ? `${totalScans} students have scanned` : "Join the waitlist"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent leading-tight">
                Welcome to Dumps!
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                Loading...
              </p>
            </div>
          )}
        </div>

        {/* Preview Cards - What's Coming */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 text-foreground">
            What's Coming Soon:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="p-4 sm:p-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors duration-300">Anonymous</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Post without revealing your identity</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="p-4 sm:p-6">
                <Hash className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors duration-300">Hashtags</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Join communities by topic</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="p-4 sm:p-6">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors duration-300">Real-time</CardTitle>
                <CardDescription className="text-xs sm:text-sm">See posts as they happen</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Dump Your Wildest Thought with animations */}
        <Card className="mb-6 sm:mb-8 border-2 shadow-lg bg-gradient-to-br from-primary/5 to-destructive/5 hover:shadow-2xl transition-all duration-500 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl font-bold">
                Dump Your Wildest Thought
              </CardTitle>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">
                PREVIEW
              </span>
            </div>
            <CardDescription className="text-sm">
              Share your thoughts completely anonymously - no one will know it's you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <Textarea
              placeholder="Write your wildest, craziest thought here... No judgment, completely anonymous!"
              value={wildThought}
              onChange={(e) => setWildThought(e.target.value)}
              className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-300"
              maxLength={5000}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {wildThought.length}/5000
              </span>
              <Button
                onClick={handleSubmitWildThought}
                disabled={isSubmitting || !wildThought.trim()}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Dumping...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="animate-bounce">🚀</span> Dump It!
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* See All Anon Dumps Section */}
        <Card className="mb-6 sm:mb-8 border-2 shadow-lg bg-gradient-to-br from-background to-muted/50 animate-fade-in-up" style={{ animationDelay: "1000ms" }}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              See all the anon dumps so far
            </CardTitle>
            <CardDescription className="text-sm">
              {wildThoughtsCount > 0 
                ? `${wildThoughtsCount} anonymous ${wildThoughtsCount === 1 ? 'thought' : 'thoughts'} dumped!`
                : "No thoughts yet - be the first!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {isLoadingThoughts ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p>Loading thoughts...</p>
              </div>
            ) : wildThoughts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-base sm:text-lg font-semibold">Be the first to dump your wildest thought!</p>
                <p className="text-sm mt-2">Share what's on your mind - completely anonymous</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {wildThoughts.map((thought, index) => (
                  <div
                    key={thought.id}
                    className="relative group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card className="border-l-4 border-l-primary/60 bg-gradient-to-r from-card/80 to-card/40 hover:from-card hover:to-card shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base whitespace-pre-wrap break-words text-foreground leading-relaxed">
                              {thought.content}
                            </p>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                              <span className="text-xs text-muted-foreground font-medium">
                                Anonymous
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(thought.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Button with animation */}
        <div className="flex justify-center items-center mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "1200ms" }}>
          <Button
            size="lg"
            variant="outline"
            onClick={handleShare}
            className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-2 font-bold hover:bg-muted transition-all duration-300 rounded-full w-full sm:w-auto hover:scale-105 active:scale-95 hover:border-primary group"
          >
            <Share2 className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
            Share with Friends
          </Button>
        </div>

        {/* Footer stats with animated counter */}
        <div className="text-center text-muted-foreground space-y-2 pb-4 sm:pb-6 animate-fade-in-up" style={{ animationDelay: "1400ms" }}>
          <p className="text-sm sm:text-base">
            Join{" "}
            <span className="font-bold text-primary animate-pulse inline-block">
              {totalScans > 0 ? `${totalScans} student${totalScans !== 1 ? 's' : ''}` : "hundreds of students"}
            </span>{" "}
            already waiting for launch
          </p>
          <p className="text-xs sm:text-sm font-semibold text-primary/80">
            🚀 Official app launching soon - stay tuned! 🚀
          </p>
          <p className="text-xs sm:text-sm">
            A safe space for your unfiltered thoughts
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

