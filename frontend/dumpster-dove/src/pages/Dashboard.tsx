import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FloatingCards from "@/components/FloatingCards";

const Dashboard = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden pb-safe">
      {/* Clean white background with subtle gradient */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: "var(--gradient-primary)"
        }}
      />
      
      {/* Floating cards */}
      <FloatingCards />
      
      {/* Main content - Mobile optimized */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 py-8 safe-top">
        <div className="text-center space-y-8 sm:space-y-10 max-w-3xl mx-auto w-full">
          {/* Main headline */}
          <div className="space-y-4 sm:space-y-5 animate-fade-in-up px-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent animate-text-shimmer leading-tight pb-2">
              Dump your thoughts.
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-muted-foreground font-light">
              Stay anonymous.
            </p>
          </div>
          
          {/* CTA Button - Mobile optimized */}
          <div className="animate-fade-in-up pt-2" style={{ animationDelay: "300ms" }}>
            <Link to="/">
              <Button 
                size="lg"
                className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 h-auto bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full touch-manipulation"
              >
                Enter Dumps
              </Button>
            </Link>
          </div>
          
          {/* Stats and tagline - Mobile optimized */}
          <div className="space-y-3 sm:space-y-4 animate-fade-in pt-4 px-2" style={{ animationDelay: "600ms" }}>
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm">
              <div className="flex -space-x-2 sm:-space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-destructive border-2 border-background animate-pulse"></div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-destructive to-primary border-2 border-background animate-pulse" style={{ animationDelay: "200ms" }}></div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary via-destructive to-accent border-2 border-background animate-pulse" style={{ animationDelay: "400ms" }}></div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                <span className="text-primary text-sm sm:text-base">100+</span> users dumping right now
              </span>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base font-light px-4">
              A safe space for your unfiltered thoughts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

