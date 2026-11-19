import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coliflor.app',
  appName: 'Coliflor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
