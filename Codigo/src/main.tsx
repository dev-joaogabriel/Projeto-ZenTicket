import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}

// Configure StatusBar for Android so content doesn't go under the system bar
if (Capacitor.getPlatform() === 'android') {
    (async () => {
        try {
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.setBackgroundColor({ color: '#0f1115' });
            // Use light icons on a dark background for better contrast
            await StatusBar.setStyle({ style: StatusBarStyle.Light });
        } catch (e) {
            // ignore if not available
        }
    })();
}