export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  changelog?: string;
  apkUrl?: string;
  ipaUrl?: string;
  supabaseApkUrl?: string;
  supabaseIpaUrl?: string;
  apkSize?: string;
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.1.0',
  versionCode: 2,
  releaseDate: '2026-11-25',
  changelog:
    'Nuevo logo oficial idéntico a la PWA, botón de widget automático y corrección de avisos.',
  apkUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.apk',
  ipaUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.ipa',
  supabaseApkUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.apk',
  supabaseIpaUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.ipa',
  apkSize: '150 MB',
};

export const VERSION_MANIFEST_URL = 'https://coliflor-one.vercel.app/version.json';
