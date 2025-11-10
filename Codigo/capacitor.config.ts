import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.helpdesk.helpdesk',
  appName: 'Helpdesk',
  webDir: 'dist',
  server: {
    // Use http in development to avoid mixed-content blocking when API is http.
    // Switch back to 'https' for production builds if your API is served over https.
    androidScheme: 'http'
  }
};
export default config;