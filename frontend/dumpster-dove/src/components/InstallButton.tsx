import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowButton(false);
    } else {
      // Show button on mobile even without beforeinstallprompt
      if (iOS || android) {
        setShowButton(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // If we have deferredPrompt (desktop), use it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowButton(false);
      }
      setDeferredPrompt(null);
    } else {
      // On mobile, show instructions
      setShowMobileInstructions(true);
    }
  };

  if (!showButton) return null;

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="lg"
        className="text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 h-auto border-2 hover:bg-accent/10 active:scale-95 transition-all duration-300 rounded-full touch-manipulation gap-2"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        Install App
      </Button>

      <Dialog open={showMobileInstructions} onOpenChange={setShowMobileInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install Dumps.online
            </DialogTitle>
            <DialogDescription>
              {isIOS ? (
                <div className="space-y-3 mt-4">
                  <p>To install on iPhone/iPad:</p>
                  <ol className="list-decimal list-inside space-y-2 text-left">
                    <li>Tap the <strong>Share</strong> button <span className="text-2xl">⎋</span> at the bottom of your screen</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-4">
                    The app will appear on your home screen and work like a native app!
                  </p>
                </div>
              ) : isAndroid ? (
                <div className="space-y-3 mt-4">
                  <p>To install on Android:</p>
                  <ol className="list-decimal list-inside space-y-2 text-left">
                    <li>Tap the <strong>menu</strong> (3 dots) in the top right of your browser</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                    <li>Tap <strong>"Install"</strong> to confirm</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-4">
                    The app will appear on your home screen and work offline!
                  </p>
                </div>
              ) : (
                <p>Use the browser menu to install this app.</p>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallButton;

