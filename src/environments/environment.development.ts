import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  environmentName: 'DEV',
  showEnvironmentBanner: true,
  firebase: {
    projectId: 'hypezone-dev',
    appId: '1:401220974881:web:3f91a45ef247cdd25fe660',
    storageBucket: 'hypezone-dev.firebasestorage.app',
    apiKey: 'AIzaSyBmLzq6jmCGMtNN6fRrncUvpJvMEfp_Zz8',
    authDomain: 'hypezone-dev.firebaseapp.com',
    messagingSenderId: '401220974881',
  },
  cloudinary: {
    cloudName: 'dawdr6c4j',
    uploadPreset: 'hypezone_upload',
  },
};
