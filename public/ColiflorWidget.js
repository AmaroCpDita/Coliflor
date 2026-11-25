/* Coliflor Widget Adaptable (2x2 y 2x4) para iPhone con Scriptable */

const SUPABASE_URL = "https://gamwmifvgfedgfizcxoz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXdtaWZ2Z2ZlZGdmaXpjeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODgxODYsImV4cCI6MjEwMzM2NDE4Nn0.7Pc0AGrKNMz6FoWJHQ_CzDV24HMH0aiE0lUP1nrhFnc";
const COUPLE_ID = "7b8edae0-65da-44b7-a9b9-8073ecdd607e";
const ASSETS_BASE_URL = "https://coliflor.vercel.app/assets/widget";
const APP_URL = "https://coliflor.vercel.app/streak";
const WORLD_URL = "https://coliflor.vercel.app/world";

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
        needsRecovery: Boolean(res.needs_recovery),
        missedDaysCount: res.missed_days_count || (res.needs_recovery ? 1 : 0),
        photosToday: res.photos_today || 0,
      };
    }
  } catch (e) {
    console.warn("Supabase fetch error: " + e);
  }
  return { streakCount: 0, completedToday: false, needsRecovery: false, missedDaysCount: 0, photosToday: 0 };
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

function drawProgressBar(progress, fillHex, width, height) {
  const w = width || 170;
  const h = height || 6;
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, w, h), h / 2, h / 2);
  ctx.setFillColor(new Color("#FFFFFF", 0.16));
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
  const progress = Math.max(8, Math.min(95, Math.round((diffMs / 86400000) * 100)));
  return { midnight: midnight, hours: hours, minutes: minutes, progress: progress };
}

async function buildWidget() {
  const data = await fetchStreakStatus();
  const streakCount = data.streakCount;
  const completedToday = data.completedToday;
  const needsRecovery = data.needsRecovery;
  const missedCount = data.missedDaysCount || 1;
  const time = getTimeRemaining();

  let stateKey = "pending";
  let mascotKey = "pending";

  if (needsRecovery) {
    stateKey = "recovery";
    mascotKey = "urgent";
  } else if (completedToday) {
    stateKey = "active";
    mascotKey = "active";
  } else if (time.hours < 4) {
    stateKey = "urgent";
    mascotKey = "urgent";
  }

  const recoveryLabel = missedCount > 1 ? missedCount + " por recuperar" : "Por recuperar";
  const recoveryMsg = missedCount > 1 ? "¡Faltan " + missedCount + " días!" : "¡Falta foto de ayer!";
  const recoverySubtitle = missedCount > 1 ? "Recuperar " + missedCount + " días en app" : "Recuperar día anterior";

  const THEMES = {
    active: {
      bg: "#0B2E24",
      eyebrow: "#A7F3D0",
      pillBg: "#166534",
      pillText: "#BBF7D0",
      pillLabel: "Activa",
      pillIcon: "checkmark.circle.fill",
      timerColor: "#A7F3D0",
      progressColor: "#4ADE80",
      progressVal: 100,
    },
    pending: {
      bg: "#1E1535",
      eyebrow: "#DDD6FE",
      pillBg: "#5B21B6",
      pillText: "#EDE9FE",
      pillLabel: "Pendiente",
      pillIcon: "clock.fill",
      timerColor: "#DDD6FE",
      progressColor: "#A78BFA",
      progressVal: time.progress,
    },
    urgent: {
      bg: "#320B17",
      eyebrow: "#FECACA",
      pillBg: "#991B1B",
      pillText: "#FECACA",
      pillLabel: "Urgente",
      pillIcon: "exclamationmark.circle.fill",
      timerColor: "#FCA5A5",
      progressColor: "#F87171",
      progressVal: time.progress,
    },
    recovery: {
      bg: "#2E1408",
      eyebrow: "#FED7AA",
      pillBg: "#C2410C",
      pillText: "#FFEDD5",
      pillLabel: recoveryLabel,
      pillIcon: "exclamationmark.triangle.fill",
      timerColor: "#FDBA74",
      progressColor: "#FB923C",
      progressVal: 35,
    },
  };

  const t = THEMES[stateKey];
  const mascot = await loadMascotImage(mascotKey);

  const isSmall = config.widgetFamily === "small";
  const w = new ListWidget();
  w.backgroundColor = new Color(t.bg);
  w.url = APP_URL;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (isSmall) {
    /* ========================================================
       DISPOSICIÓN 2x2 (Pequeño - Cuadrado)
       ======================================================== */
    w.setPadding(10, 10, 10, 10);

    const topSmall = w.addStack();
    topSmall.layoutHorizontally();
    topSmall.centerAlignContent();

    const flower = SFSymbol.named("suit.heart.fill");
    const flowerImg = topSmall.addImage(flower.image);
    flowerImg.imageSize = new Size(11, 11);
    flowerImg.tintColor = new Color(t.eyebrow);
    topSmall.addSpacer(3);

    const appTitle = topSmall.addText("Coliflor");
    appTitle.font = Font.boldSystemFont(11);
    appTitle.textColor = new Color(t.eyebrow);

    topSmall.addSpacer();

    const streakBadge = topSmall.addStack();
    streakBadge.backgroundColor = new Color("#FFFFFF", 0.12);
    streakBadge.cornerRadius = 6;
    streakBadge.setPadding(2, 6, 2, 6);
    const streakTxt = streakBadge.addText(streakCount + "d");
    streakTxt.font = Font.boldSystemFont(11);
    streakTxt.textColor = new Color("#F59E0B");

    w.addSpacer(4);

    const centerStack = w.addStack();
    centerStack.layoutHorizontally();
    centerStack.centerAlignContent();
    centerStack.addSpacer();

    if (mascot) {
      const imgView = centerStack.addImage(mascot);
      imgView.imageSize = new Size(68, 68);
      imgView.applyFillingContentMode();
      imgView.cornerRadius = 8;
    }
    centerStack.addSpacer();

    w.addSpacer(4);

    const pillStack = w.addStack();
    pillStack.layoutHorizontally();
    pillStack.centerAlignContent();
    pillStack.backgroundColor = new Color(t.pillBg);
    pillStack.cornerRadius = 8;
    pillStack.setPadding(3, 8, 3, 8);

    const iconSymbol = SFSymbol.named(t.pillIcon);
    const iconImg = pillStack.addImage(iconSymbol.image);
    iconImg.imageSize = new Size(10, 10);
    iconImg.tintColor = new Color(t.pillText);
    pillStack.addSpacer(4);

    const pillText = pillStack.addText(t.pillLabel);
    pillText.font = Font.boldSystemFont(10);
    pillText.textColor = new Color(t.pillText);

    w.addSpacer(3);

    const bottomRow = w.addStack();
    bottomRow.layoutHorizontally();
    bottomRow.centerAlignContent();
    bottomRow.addSpacer();

    if (stateKey === "recovery") {
      const recAlert = bottomRow.addText(missedCount > 1 ? "¡" + missedCount + " días sin foto!" : "¡Ayer pendiente!");
      recAlert.font = Font.boldSystemFont(10);
      recAlert.textColor = new Color(t.timerColor);
    } else if (stateKey === "active") {
      const doneLabel = bottomRow.addText("¡Completada!");
      doneLabel.font = Font.boldSystemFont(10);
      doneLabel.textColor = new Color(t.timerColor);
    } else {
      const clockIco = SFSymbol.named("clock");
      const cImg = bottomRow.addImage(clockIco.image);
      cImg.imageSize = new Size(9, 9);
      cImg.tintColor = new Color(t.timerColor);
      bottomRow.addSpacer(3);

      const liveTimer = bottomRow.addDate(time.midnight);
      liveTimer.applyTimerStyle();
      liveTimer.font = Font.boldSystemFont(10);
      liveTimer.textColor = new Color(t.timerColor);
    }
    bottomRow.addSpacer();
  } else {
    /* ========================================================
       DISPOSICIÓN 2x4 (Mediano - Rectangular)
       ======================================================== */
    w.setPadding(12, 14, 12, 14);

    const rootStack = w.addStack();
    rootStack.layoutHorizontally();
    rootStack.centerAlignContent();

    /* Columna Izquierda: Mascota Picaflor */
    const leftCol = rootStack.addStack();
    leftCol.layoutVertically();
    leftCol.centerAlignContent();

    if (mascot) {
      const imgView = leftCol.addImage(mascot);
      imgView.imageSize = new Size(88, 88);
      imgView.applyFillingContentMode();
      imgView.cornerRadius = 12;
    }
    leftCol.url = APP_URL;

    rootStack.addSpacer(12);

    /* Columna Derecha: Contenido completo */
    const rightCol = rootStack.addStack();
    rightCol.layoutVertically();

    /* Fila 1: Logo Coliflor + Botón Nuestro mundo */
    const topBar = rightCol.addStack();
    topBar.layoutHorizontally();
    topBar.centerAlignContent();

    const flower = SFSymbol.named("suit.heart.fill");
    const flowerImg = topBar.addImage(flower.image);
    flowerImg.imageSize = new Size(12, 12);
    flowerImg.tintColor = new Color(t.eyebrow);
    topBar.addSpacer(4);

    const brand = topBar.addText("Coliflor");
    brand.font = Font.boldSystemFont(13);
    brand.textColor = new Color(t.eyebrow);

    topBar.addSpacer();

    const worldBtn = topBar.addStack();
    worldBtn.backgroundColor = new Color("#FFFFFF", 0.14);
    worldBtn.cornerRadius = 9;
    worldBtn.setPadding(3, 8, 3, 8);
    worldBtn.centerAlignContent();
    worldBtn.url = WORLD_URL;

    const globe = SFSymbol.named("sparkles");
    const globeImg = worldBtn.addImage(globe.image);
    globeImg.imageSize = new Size(10, 10);
    globeImg.tintColor = new Color("#E9D5FF");
    worldBtn.addSpacer(4);

    const worldText = worldBtn.addText("Nuestro mundo");
    worldText.font = Font.systemFont(10);
    worldText.textColor = new Color("#F5F3FF");

    rightCol.addSpacer(4);

    /* Fila 2: Título NUESTRA RACHA */
    const subTitle = rightCol.addText("NUESTRA RACHA");
    subTitle.font = Font.systemFont(9);
    subTitle.textColor = new Color(t.eyebrow, 0.7);

    /* Fila 3: Número de racha y fueguito */
    const streakRow = rightCol.addStack();
    streakRow.layoutHorizontally();
    streakRow.centerAlignContent();

    const flame = SFSymbol.named("flame.fill");
    const flameImg = streakRow.addImage(flame.image);
    flameImg.imageSize = new Size(18, 18);
    flameImg.tintColor = new Color("#F97316");
    streakRow.addSpacer(5);

    const streakVal = streakRow.addText(streakCount + " días");
    streakVal.font = Font.boldSystemFont(22);
    streakVal.textColor = new Color("#FFFFFF");

    rightCol.addSpacer(4);

    /* Fila 4: Pill de estado + Temporizador dinámico en vivo */
    const statusRow = rightCol.addStack();
    statusRow.layoutHorizontally();
    statusRow.centerAlignContent();

    const pill = statusRow.addStack();
    pill.backgroundColor = new Color(t.pillBg);
    pill.cornerRadius = 8;
    pill.setPadding(2, 7, 2, 7);
    pill.centerAlignContent();

    const pIcon = SFSymbol.named(t.pillIcon);
    const pIconImg = pill.addImage(pIcon.image);
    pIconImg.imageSize = new Size(10, 10);
    pIconImg.tintColor = new Color(t.pillText);
    pill.addSpacer(3);

    const pText = pill.addText(t.pillLabel);
    pText.font = Font.boldSystemFont(10);
    pText.textColor = new Color(t.pillText);

    statusRow.addSpacer(8);

    if (stateKey === "recovery") {
      const recMsg = statusRow.addText(recoveryMsg);
      recMsg.font = Font.boldSystemFont(11);
      recMsg.textColor = new Color(t.timerColor);
    } else if (stateKey === "active") {
      const doneMsg = statusRow.addText("¡Siguiente día!");
      doneMsg.font = Font.systemFont(11);
      doneMsg.textColor = new Color(t.timerColor);
    } else {
      const clockSym = SFSymbol.named("clock");
      const cImg = statusRow.addImage(clockSym.image);
      cImg.imageSize = new Size(10, 10);
      cImg.tintColor = new Color(t.timerColor);
      statusRow.addSpacer(3);

      const qLabel = statusRow.addText("Quedan ");
      qLabel.font = Font.systemFont(11);
      qLabel.textColor = new Color(t.timerColor);

      const dynamicTimer = statusRow.addDate(time.midnight);
      dynamicTimer.applyTimerStyle();
      dynamicTimer.font = Font.boldSystemFont(11);
      dynamicTimer.textColor = new Color(t.timerColor);

      const hLabel = statusRow.addText(" hoy");
      hLabel.font = Font.systemFont(11);
      hLabel.textColor = new Color(t.timerColor);
    }

    rightCol.addSpacer(6);

    /* Fila 5: Barra de progreso a lo ancho y Próximo día */
    const progRow = rightCol.addStack();
    progRow.layoutHorizontally();
    progRow.centerAlignContent();

    const calIcon = SFSymbol.named("calendar");
    const calImg = progRow.addImage(calIcon.image);
    calImg.imageSize = new Size(10, 10);
    calImg.tintColor = new Color(t.eyebrow, 0.7);
    progRow.addSpacer(3);

    const nextDayLabel = progRow.addText(
      stateKey === "recovery" ? recoverySubtitle : "Próximo: Día " + (streakCount + 1)
    );
    nextDayLabel.font = Font.systemFont(9);
    nextDayLabel.textColor = new Color(t.eyebrow, 0.8);

    progRow.addSpacer();

    const barImg = drawProgressBar(t.progressVal, t.progressColor, 85, 5);
    progRow.addImage(barImg);
  }

  return w;
}

const widget = await buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  if (config.widgetFamily === "small") {
    widget.presentSmall();
  } else {
    widget.presentMedium();
  }
}
Script.complete();
