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
  version: '1.0.0',
  versionCode: 1,
  releaseDate: '2026-11-23',
  changelog: 'Versión base inicial de Coliflor con widget nativo y notificaciones.',
  apkUrl: 'https://coliflor-one.vercel.app/Coliflor.apk',
  ipaUrl: 'https://coliflor-one.vercel.app/Coliflor.ipa',
  supabaseApkUrl:
    'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/photos/Coliflor.apk',
  supabaseIpaUrl:
    'https://gamwmifvgfedgfizcxoz.supabase.co/storage/v1/object/public/photos/Coliflor.ipa',
  apkSize: '14 MB',
};

export const VERSION_MANIFEST_URL = 'https://coliflor-one.vercel.app/version.json';
