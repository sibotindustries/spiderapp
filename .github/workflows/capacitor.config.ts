import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spiderapp.app',
  appName: 'SpiderAPP',
  webDir: 'client/dist',
  server: {
    url: 'https://efc38770-40c4-47c3-a6f9-16b478bf5e6e-00-23dxn5xl6n2x8.kirk.replit.dev',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'android/keystore.jks',
      keystorePassword: 'spiderman',
      keystoreAlias: 'spiderappalias',
      keystoreAliasPassword: 'spiderman',
    }
  }
};

export default config;
