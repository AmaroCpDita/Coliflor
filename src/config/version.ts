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
  apkUrl: 'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/releases/Coliflor.apk',
  ipaUrl: 'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/releases/Coliflor.ipa',
  supabaseApkUrl:
    'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/releases/Coliflor.apk',
  supabaseIpaUrl:
    'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/releases/Coliflor.ipa',
  apkSize: '150 MB',
};

export const VERSION_MANIFEST_URL = 'https://coliflor-one.vercel.app/version.json';
