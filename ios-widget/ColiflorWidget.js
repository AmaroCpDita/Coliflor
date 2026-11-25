/* Coliflor Widget 4x2 para iPhone (Scriptable) */

const SUPABASE_URL = "https://gamwmifvgfedgfizcxoz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXdtaWZ2Z2ZlZGdmaXpjeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODgxODYsImV4cCI6MjEwMzM2NDE4Nn0.7Pc0AGrKNMz6FoWJHQ_CzDV24HMH0aiE0lUP1nrhFnc";
const COUPLE_ID = "7b8edae0-65da-44b7-a9b9-8073ecdd607e";
const ASSETS_BASE_URL = "https://coliflor.vercel.app/assets/widget";

async function fetchStreakStatus() {
  try {
    const req = new Request(SUPABASE_URL + "/rest/v1/rpc/get_widget_streak_status");
    req.method = "POST";
    req.headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    };
    req.body = JSON.stringify({ p_couple_id: COUPLE_ID });
    req.timeoutInterval = 8;
    const res = await req.loadJSON();
    if (res && typeof res.current_streak === "number") {
      return {
        streakCount: res.current_streak,
        completedToday: Boolean(res.completed_today),
      };
    }
  } catch (e) {
    console.warn("Supabase fetch error: " + e);
  }
  return { streakCount: 0, completedToday: false };
}

async function loadMascotImage(stateKey) {
  const fileName = "picaflor-" + stateKey + "-ios.png";
  const fm = FileManager.local();
  const cacheDir = fm.joinPath(fm.cacheDirectory(), "coliflor_widget");
  if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);
  const localPath = fm.joinPath(cacheDir, fileName);

  try {
    const req = new Request(ASSETS_BASE_URL + "/" + fileName);
    req.timeoutInterval = 8;
    const img = await req.loadImage();
    if (img) {
      fm.writeImage(localPath, img);
      return img;
    }
  } catch (e) {}

  if (fm.fileExists(localPath)) {
    return fm.readImage(localPath);
  }
  return null;
}

function drawProgressBar(progress, fillHex) {
  const w = 130;
  const h = 7;
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, w, h), h / 2, h / 2);
  ctx.setFillColor(new Color("#FFFFFF", 0.18));
  ctx.addPath(trackPath);
  ctx.fillPath();

  const fillW = Math.max(h, Math.round((w * Math.max(0, Math.min(100, progress))) / 100));
  const fillPath = new Path();
  fillPath.addRoundedRect(new Rect(0, 0, fillW, h), h / 2, h / 2);
  ctx.setFillColor(new Color(fillHex));
  ctx.addPath(fillPath);
  ctx.fillPath();

  return ctx.getImage();
}

function getTimeRemaining() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const pad = function (n) {
    return String(n).padStart(2, "0");
  };
  const formatted = hours > 0 ? pad(hours) + "h " + pad(minutes) + "m" : pad(minutes) + "m";
  const progress = Math.max(8, Math.min(95, Math.round((diffMs / 86400000) * 100)));
  return { hours: hours, minutes: minutes, formatted: formatted, progress: progress };
}

async function createWidget() {
  const data = await fetchStreakStatus();
  const streakCount = data.streakCount;
  const completedToday = data.completedToday;
  const time = getTimeRemaining();
  const stateKey = completedToday ? "active" : time.hours < 4 ? "urgent" : "pending";

  const THEMES = {
    active: {
      bg: "#103A30",
      eyebrow: "#A7F3D0",
      pillBg: "#166534",
      pillText: "#BBF7D0",
      pillLabel: "Activa",
      pillIcon: "checkmark.circle.fill",
      timerText: "Siguiente día en " + time.formatted,
      timerColor: "#A7F3D0",
      progressColor: "#4ADE80",
      progressVal: 100,
    },
    pending: {
      bg: "#251B40",
      eyebrow: "#DDD6FE",
      pillBg: "#5B21B6",
      pillText: "#EDE9FE",
      pillLabel: "Pendiente",
      pillIcon: "clock.fill",
      timerText: "Quedan " + time.formatted + " hoy",
      timerColor: "#DDD6FE",
      progressColor: "#A78BFA",
      progressVal: time.progress,
    },
    urgent: {
      bg: "#370B1A",
      eyebrow: "#FECACA",
      pillBg: "#991B1B",
      pillText: "#FECACA",
      pillLabel: "Urgente",
      pillIcon: "exclamationmark.circle.fill",
      timerText: "Quedan " + time.formatted + " hoy",
      timerColor: "#FCA5A5",
      progressColor: "#F87171",
      progressVal: time.progress,
    },
  };

  const t = THEMES[stateKey];
  const mascot = await loadMascotImage(stateKey);

  const w = new ListWidget();
  w.backgroundColor = new Color(t.bg);
  w.setPadding(10, 12, 10, 12);
  w.url = "com.coliflor.app://streak";

  const topRow = w.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();

  const flowerSym = SFSymbol.named("camera.macro");
  flowerSym.applyFont(Font.boldSystemFont(12));
  const flowerImg = topRow.addImage(flowerSym.image);
  flowerImg.imageSize = new Size(14, 14);
  flowerImg.tintColor = new Color(t.eyebrow);
  topRow.addSpacer(5);

  const brandTxt = topRow.addText("Coliflor");
  brandTxt.font = Font.boldSystemFont(13);
  brandTxt.textColor = Color.white();

  topRow.addSpacer();

  const worldPill = topRow.addStack();
  worldPill.layoutHorizontally();
  worldPill.centerAlignContent();
  worldPill.backgroundColor = new Color(t.pillBg, 0.78);
  worldPill.cornerRadius = 10;
  worldPill.setPadding(3, 8, 3, 8);
  worldPill.url = "com.coliflor.app://world";

  const homeSym = SFSymbol.named("house.fill");
  homeSym.applyFont(Font.boldSystemFont(9));
  const homeImg = worldPill.addImage(homeSym.image);
  homeImg.imageSize = new Size(10, 10);
  homeImg.tintColor = new Color(t.pillText);
  worldPill.addSpacer(4);

  const worldTxt = worldPill.addText("Nuestro mundo");
  worldTxt.font = Font.boldSystemFont(9.5);
  worldTxt.textColor = new Color(t.pillText);

  w.addSpacer(4);

  const midRow = w.addStack();
  midRow.layoutHorizontally();
  midRow.centerAlignContent();

  const artCol = midRow.addStack();
  artCol.size = new Size(118, 92);
  artCol.centerAlignContent();
  if (mascot) {
    const imgEl = artCol.addImage(mascot);
    imgEl.imageSize = new Size(112, 92);
    imgEl.contentMode = "aspectFit";
  } else {
    const birdSym = SFSymbol.named("bird.fill");
    const birdImg = artCol.addImage(birdSym.image);
    birdImg.imageSize = new Size(56, 56);
    birdImg.tintColor = new Color(t.eyebrow);
  }

  midRow.addSpacer(6);

  const infoCol = midRow.addStack();
  infoCol.layoutVertically();
  infoCol.centerAlignContent();

  const eyebrow = infoCol.addText("NUESTRA RACHA");
  eyebrow.font = Font.boldSystemFont(9);
  eyebrow.textColor = new Color(t.eyebrow);

  infoCol.addSpacer(2);

  const countRow = infoCol.addStack();
  countRow.layoutHorizontally();
  countRow.centerAlignContent();

  const flameSym = SFSymbol.named("flame.fill");
  flameSym.applyFont(Font.boldSystemFont(18));
  const flameImg = countRow.addImage(flameSym.image);
  flameImg.imageSize = new Size(18, 18);
  flameImg.tintColor = new Color("#FF9F43");
  countRow.addSpacer(4);

  const daysTxt = countRow.addText(streakCount + (streakCount === 1 ? " día" : " días"));
  daysTxt.font = Font.heavySystemFont(22);
  daysTxt.textColor = Color.white();

  infoCol.addSpacer(4);

  const statusPill = infoCol.addStack();
  statusPill.layoutHorizontally();
  statusPill.centerAlignContent();
  statusPill.backgroundColor = new Color(t.pillBg, 0.85);
  statusPill.cornerRadius = 10;
  statusPill.setPadding(3, 9, 3, 9);

  const stSym = SFSymbol.named(t.pillIcon);
  stSym.applyFont(Font.boldSystemFont(10));
  const stImg = statusPill.addImage(stSym.image);
  stImg.imageSize = new Size(11, 11);
  stImg.tintColor = new Color(t.pillText);
  statusPill.addSpacer(4);

  const stTxt = statusPill.addText(t.pillLabel);
  stTxt.font = Font.boldSystemFont(10.5);
  stTxt.textColor = new Color(t.pillText);

  infoCol.addSpacer(4);

  const timerTxt = infoCol.addText(t.timerText);
  timerTxt.font = Font.boldSystemFont(10);
  timerTxt.textColor = new Color(t.timerColor);

  w.addSpacer(5);

  const footer = w.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();
  footer.backgroundColor = new Color("#000000", 0.36);
  footer.cornerRadius = 10;
  footer.setPadding(5, 9, 5, 9);

  const calSym = SFSymbol.named("calendar");
  calSym.applyFont(Font.boldSystemFont(10));
  const calImg = footer.addImage(calSym.image);
  calImg.imageSize = new Size(11, 11);
  calImg.tintColor = new Color("#D4D4D8");
  footer.addSpacer(5);

  const nextTxt = footer.addText("Próximo día: Día " + (streakCount + 1));
  nextTxt.font = Font.boldSystemFont(9.5);
  nextTxt.textColor = new Color("#E4E4E7");

  footer.addSpacer(8);

  const barImg = footer.addImage(drawProgressBar(t.progressVal, t.progressColor));
  barImg.imageSize = new Size(115, 7);

  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  return w;
}

const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
