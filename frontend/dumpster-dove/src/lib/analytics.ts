// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      ...parameters
    });
  }
};

// Track post creation
export const trackPostCreated = (hasImage: boolean = false) => {
  trackEvent('post_created', {
    event_label: hasImage ? 'with_image' : 'text_only',
    value: 1
  });
};

// Track post reaction
export const trackPostReaction = (reactionType: string) => {
  trackEvent('post_reaction', {
    event_label: reactionType,
    value: 1
  });
};

// Track page view
export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-VQ5BFQ6S2P', {
      page_title: pageName,
      page_location: window.location.href
    });
  }
};

// Track user engagement
export const trackEngagement = (action: string, details?: string) => {
  trackEvent('user_engagement', {
    event_label: action,
    custom_parameter: details || '',
    value: 1
  });
};
