export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  changelog?: string;
  apkUrl?: string;
  ipaUrl?: string;
  fallbackApkUrl?: string;
  fallbackIpaUrl?: string;
  apkSize?: string;
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.0.0',
  versionCode: 1,
  releaseDate: '2026-11-19',
  changelog: 'Versión base inicial de Coliflor.',
  apkUrl: 'https://coliflor.vercel.app/Coliflor.apk',
  ipaUrl: 'https://coliflor.vercel.app/Coliflor.ipa',
  fallbackApkUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.apk',
  fallbackIpaUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.ipa',
  apkSize: '14 MB',
};

export const VERSION_MANIFEST_URL = 'https://coliflor.vercel.app/version.json';
