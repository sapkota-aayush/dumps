import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service Worker Registration with Update Handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })
      .then((registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log('New service worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and waiting
              console.log('New service worker installed and waiting');
              showUpdateNotification(registration);
            } else if (newWorker.state === 'activated') {
              // New service worker is activated
              console.log('New service worker activated');
              // Reload the page to use the new service worker
              window.location.reload();
            }
          });
        });

        // Handle controller change (service worker takeover)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('Service worker controller changed, reloading...');
            window.location.reload();
          }
        });
      })
      .catch((err) => {
        console.error('ServiceWorker registration failed:', err);
      });
  });
}

// Show update notification to user
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Check if we should show notification (don't spam)
  const lastNotification = localStorage.getItem('sw-update-notification');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (lastNotification && (now - parseInt(lastNotification)) < oneHour) {
    return; // Don't show notification if shown within last hour
  }

  // Create and show notification
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: hsl(0, 0%, 10%);
    color: hsl(0, 0%, 98%);
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: calc(100% - 40px);
    width: auto;
    min-width: 280px;
    animation: swSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid hsl(0, 0%, 20%);
  `;

  // Mobile-friendly layout
  const isMobile = window.innerWidth < 640;
  if (isMobile) {
    notification.style.flexDirection = 'column';
    notification.style.alignItems = 'stretch';
    notification.style.gap = '12px';
    notification.style.minWidth = 'auto';
    notification.style.width = 'calc(100% - 40px)';
  }

  notification.innerHTML = `
    <span style="flex: 1; font-weight: 500;">✨ New version available!</span>
    <div style="display: flex; gap: 8px; ${isMobile ? 'width: 100%;' : ''}">
      <button id="sw-update-reload" style="
        background: hsl(0, 70%, 45%);
        color: hsl(0, 0%, 100%);
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: background 0.2s;
        ${isMobile ? 'flex: 1;' : ''}
        touch-action: manipulation;
      ">Update Now</button>
      <button id="sw-update-dismiss" style="
        background: transparent;
        color: hsl(0, 0%, 98%);
        border: 1px solid hsl(0, 0%, 30%);
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
        ${isMobile ? 'flex: 1;' : ''}
        touch-action: manipulation;
      ">Later</button>
    </div>
  `;

  // Add animation and hover styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes swSlideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    #sw-update-reload:hover {
      background: hsl(0, 70%, 50%) !important;
    }
    #sw-update-reload:active {
      background: hsl(0, 70%, 40%) !important;
    }
    #sw-update-dismiss:hover {
      background: hsl(0, 0%, 20%) !important;
    }
    #sw-update-dismiss:active {
      background: hsl(0, 0%, 15%) !important;
    }
    @media (max-width: 640px) {
      #sw-update-notification {
        bottom: 80px; /* Above bottom nav */
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);

  // Handle update button
  const updateButton = notification.querySelector('#sw-update-reload');
  updateButton?.addEventListener('click', () => {
    localStorage.setItem('sw-update-notification', now.toString());
    if (registration.waiting) {
      // Tell the service worker to skip waiting and activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Reload immediately
      window.location.reload();
    }
  });

  // Handle dismiss button
  const dismissButton = notification.querySelector('#sw-update-dismiss');
  dismissButton?.addEventListener('click', () => {
    localStorage.setItem('sw-update-notification', now.toString());
    notification.style.animation = 'swSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'swSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }
  }, 30000);
}
