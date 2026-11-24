import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read current version.json
const versionJsonPath = path.join(rootDir, 'public', 'version.json');
let versionData = {
  version: '1.0.1',
  versionCode: 2,
  releaseDate: new Date().toISOString().split('T')[0],
  changelog: 'Actualización con mejoras y nuevas funciones de pareja.',
  apkUrl: 'https://coliflor.vercel.app/Coliflor.apk',
  ipaUrl: 'https://coliflor.vercel.app/Coliflor.ipa',
  fallbackApkUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.apk',
  fallbackIpaUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.ipa',
  apkSize: '14 MB',
};

if (fs.existsSync(versionJsonPath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
  } catch {}
}

// Calculate next version
const currentVersionParts = (versionData.version || '1.0.0').split('.').map((n) => parseInt(n, 10));
currentVersionParts[currentVersionParts.length - 1] += 1;
const newVersion = process.argv[2] || currentVersionParts.join('.');
const newVersionCode = (versionData.versionCode || 1) + 1;
const changelog =
  process.argv[3] || 'Mejoras en el widget de racha tipo Duolingo y notificaciones nativas.';

console.log(`\n========================================`);
console.log(`🚀 Coliflor Auto-Updater (AntiAgg-style)`);
console.log(`Versión anterior: v${versionData.version} (Build ${versionData.versionCode})`);
console.log(`Nueva versión:   v${newVersion} (Build ${newVersionCode})`);
console.log(`========================================\n`);

// 1. Update public/version.json
versionData.version = newVersion;
versionData.versionCode = newVersionCode;
versionData.releaseDate = new Date().toISOString().split('T')[0];
versionData.changelog = changelog;
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf-8');
console.log('✔ public/version.json actualizado');

// 2. Update src/config/version.ts
const versionTsPath = path.join(rootDir, 'src', 'config', 'version.ts');
const versionTsContent = `export interface AppVersionInfo {
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
  version: '${newVersion}',
  versionCode: ${newVersionCode},
  releaseDate: '${versionData.releaseDate}',
  changelog: '${changelog.replace(/'/g, "\\'")}',
  apkUrl: 'https://coliflor.vercel.app/Coliflor.apk',
  ipaUrl: 'https://coliflor.vercel.app/Coliflor.ipa',
  fallbackApkUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.apk',
  fallbackIpaUrl: 'https://github.com/AmaroCpDita/Coliflor/releases/latest/download/Coliflor.ipa',
  apkSize: '14 MB',
};

export const VERSION_MANIFEST_URL = 'https://coliflor.vercel.app/version.json';
`;
fs.writeFileSync(versionTsPath, versionTsContent, 'utf-8');
console.log('✔ src/config/version.ts actualizado');

// 3. Update android/app/build.gradle
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf-8');
  gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
  gradleContent = gradleContent.replace(/versionName\s+["'][^"']+["']/, `versionName "${newVersion}"`);
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf-8');
  console.log('✔ android/app/build.gradle versionCode y versionName actualizados');
}

// 4. Build web
console.log('\n📦 Compilando aplicación web (npm run build)...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 5. Capacitor sync
console.log('\n🔄 Sincronizando con Android nativo (npx cap sync android)...');
execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

// 6. Build Android APK locally if gradlew exists
const gradlewBat = path.join(rootDir, 'android', 'gradlew.bat');
if (fs.existsSync(gradlewBat)) {
  try {
    console.log('\n🤖 Intentando compilar APK nativo de Android...');
    const javaHome = "C:\\Program Files\\Android\\Android Studio\\jbr";
    const androidHome = process.env.LOCALAPPDATA + "\\Android\\Sdk";
    const env = {
      ...process.env,
      ...(fs.existsSync(javaHome) ? { JAVA_HOME: javaHome } : {}),
      ...(fs.existsSync(androidHome) ? { ANDROID_HOME: androidHome } : {}),
    };
    execSync(`"${gradlewBat}" assembleDebug`, { cwd: path.join(rootDir, 'android'), env, stdio: 'inherit' });

    const builtApkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(builtApkPath)) {
      const rootApkPath = path.join(rootDir, 'Coliflor.apk');
      const publicApkPath = path.join(rootDir, 'public', 'Coliflor.apk');
      const distApkPath = path.join(rootDir, 'dist', 'Coliflor.apk');

      fs.copyFileSync(builtApkPath, rootApkPath);
      fs.copyFileSync(builtApkPath, publicApkPath);
      if (fs.existsSync(path.join(rootDir, 'dist'))) {
        fs.copyFileSync(builtApkPath, distApkPath);
      }
      const stat = fs.statSync(builtApkPath);
      const sizeMb = (stat.size / (1024 * 1024)).toFixed(1) + ' MB';
      console.log(`\n🎉 ¡APK v${newVersion} generado con éxito! Tamaño: ${sizeMb}`);
      console.log(`📁 Ubicación: ${publicApkPath}`);
    }
  } catch (err) {
    console.log('ℹ Compilación local de Android omitida (se compilará en GitHub Actions).');
  }
}

console.log(`\n🎉 ¡Versión v${newVersion} lista para desplegar en Vercel y compilar en GitHub Actions!`);
