/* Coliflor Widget Adaptable (2x2 y 2x4) para iPhone con Scriptable */

// ========================================================
// CONFIGURACIÓN DE APERTURA DE LA APP
// ========================================================
// Cambia a true cuando instales la app nativa (IPA / TestFlight)
// Déjalo en false para abrir en Safari / Web App PWA
const OPEN_IN_NATIVE_APP = false;

const NATIVE_APP_URL = "com.coliflor.app://streak";
const NATIVE_WORLD_URL = "com.coliflor.app://world";

const WEB_APP_URL = "https://coliflor-one.vercel.app/streak";
const WEB_WORLD_URL = "https://coliflor-one.vercel.app/world";

const APP_URL = OPEN_IN_NATIVE_APP ? NATIVE_APP_URL : WEB_APP_URL;
const WORLD_URL = OPEN_IN_NATIVE_APP ? NATIVE_WORLD_URL : WEB_WORLD_URL;

const SUPABASE_URL = "https://gamwmifvgfedgfizcxoz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXdtaWZ2Z2ZlZGdmaXpjeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODgxODYsImV4cCI6MjEwMzM2NDE4Nn0.7Pc0AGrKNMz6FoWJHQ_CzDV24HMH0aiE0lUP1nrhFnc";
const COUPLE_ID = "7b8edae0-65da-44b7-a9b9-8073ecdd607e";
const ASSETS_BASE_URL = "https://coliflor-one.vercel.app/assets/widget";

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
    appTitle.lineLimit = 1;

    topSmall.addSpacer();

    const streakBadge = topSmall.addStack();
    streakBadge.backgroundColor = new Color("#FFFFFF", 0.12);
    streakBadge.cornerRadius = 6;
    streakBadge.setPadding(2, 6, 2, 6);
    const streakTxt = streakBadge.addText(streakCount + "d");
    streakTxt.font = Font.boldSystemFont(11);
    streakTxt.textColor = new Color("#F59E0B");
    streakTxt.lineLimit = 1;

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
    pillText.lineLimit = 1;
    pillText.minimumScaleFactor = 0.85;

    w.addSpacer(3);

    const bottomRow = w.addStack();
    bottomRow.layoutHorizontally();
    bottomRow.centerAlignContent();
    bottomRow.addSpacer();

    if (stateKey === "recovery") {
      const recAlert = bottomRow.addText(missedCount > 1 ? "¡" + missedCount + " días sin foto!" : "¡Ayer pendiente!");
      recAlert.font = Font.boldSystemFont(10);
      recAlert.textColor = new Color(t.timerColor);
      recAlert.lineLimit = 1;
    } else if (stateKey === "active") {
      const doneLabel = bottomRow.addText("¡Completada!");
      doneLabel.font = Font.boldSystemFont(10);
      doneLabel.textColor = new Color(t.timerColor);
      doneLabel.lineLimit = 1;
    } else {
      const clockIco = SFSymbol.named("clock.fill");
      const cImg = bottomRow.addImage(clockIco.image);
      cImg.imageSize = new Size(9, 9);
      cImg.tintColor = new Color(t.timerColor);
      bottomRow.addSpacer(3);

      const liveTimer = bottomRow.addDate(time.midnight);
      liveTimer.applyTimerStyle();
      liveTimer.font = Font.boldSystemFont(10);
      liveTimer.textColor = new Color(t.timerColor);
      liveTimer.lineLimit = 1;
    }
    bottomRow.addSpacer();
  } else {
    /* ========================================================
       DISPOSICIÓN 2x4 (Mediano - Rectangular)
       Perfeccionado: Sin palabras cortadas, espaciado premium
       ======================================================== */
    w.setPadding(10, 14, 10, 14);

    const rootStack = w.addStack();
    rootStack.layoutHorizontally();
    rootStack.centerAlignContent();

    /* Columna Izquierda: Mascota Picaflor + Botón Nuestro mundo */
    const leftCol = rootStack.addStack();
    leftCol.layoutVertically();
    leftCol.centerAlignContent();

    if (mascot) {
      const imgView = leftCol.addImage(mascot);
      imgView.imageSize = new Size(82, 82);
      imgView.applyFillingContentMode();
      imgView.cornerRadius = 12;
    }
    leftCol.url = APP_URL;

    leftCol.addSpacer(5);

    /* Botón Nuestro mundo centrado debajo del picaflor */
    const worldBtn = leftCol.addStack();
    worldBtn.backgroundColor = new Color("#FFFFFF", 0.14);
    worldBtn.cornerRadius = 8;
    worldBtn.setPadding(3, 7, 3, 7);
    worldBtn.centerAlignContent();
    worldBtn.url = WORLD_URL;

    const globe = SFSymbol.named("sparkles");
    const globeImg = worldBtn.addImage(globe.image);
    globeImg.imageSize = new Size(9, 9);
    globeImg.tintColor = new Color("#E9D5FF");
    worldBtn.addSpacer(3);

    const worldText = worldBtn.addText("Nuestro mundo");
    worldText.font = Font.systemFont(9);
    worldText.textColor = new Color("#F5F3FF");
    worldText.lineLimit = 1;

    rootStack.addSpacer(12);

    /* Columna Derecha: Todo el contenido de la racha */
    const rightCol = rootStack.addStack();
    rightCol.layoutVertically();

    /* Fila 1: Logo Coliflor (izq) + Status Pill (der, nunca se corta) */
    const topRow = rightCol.addStack();
    topRow.layoutHorizontally();
    topRow.centerAlignContent();

    const flower = SFSymbol.named("suit.heart.fill");
    const flowerImg = topRow.addImage(flower.image);
    flowerImg.imageSize = new Size(11, 11);
    flowerImg.tintColor = new Color(t.eyebrow);
    topRow.addSpacer(3);

    const brand = topRow.addText("Coliflor");
    brand.font = Font.boldSystemFont(12);
    brand.textColor = new Color(t.eyebrow);
    brand.lineLimit = 1;

    topRow.addSpacer();

    const pill = topRow.addStack();
    pill.backgroundColor = new Color(t.pillBg);
    pill.cornerRadius = 8;
    pill.setPadding(3, 8, 3, 8);
    pill.centerAlignContent();

    const pIcon = SFSymbol.named(t.pillIcon);
    const pIconImg = pill.addImage(pIcon.image);
    pIconImg.imageSize = new Size(10, 10);
    pIconImg.tintColor = new Color(t.pillText);
    pill.addSpacer(4);

    const pText = pill.addText(t.pillLabel);
    pText.font = Font.boldSystemFont(10);
    pText.textColor = new Color(t.pillText);
    pText.lineLimit = 1;
    pText.minimumScaleFactor = 0.85;

    rightCol.addSpacer(3);

    /* Fila 2: Subtítulo NUESTRA RACHA */
    const subTitle = rightCol.addText("NUESTRA RACHA");
    subTitle.font = Font.systemFont(9);
    subTitle.textColor = new Color(t.eyebrow, 0.7);
    subTitle.lineLimit = 1;

    /* Fila 3: Racha grande y fueguito */
    const streakRow = rightCol.addStack();
    streakRow.layoutHorizontally();
    streakRow.centerAlignContent();

    const flame = SFSymbol.named("flame.fill");
    const flameImg = streakRow.addImage(flame.image);
    flameImg.imageSize = new Size(18, 18);
    flameImg.tintColor = new Color("#F97316");
    streakRow.addSpacer(4);

    const streakVal = streakRow.addText(streakCount + " días");
    streakVal.font = Font.boldSystemFont(22);
    streakVal.textColor = new Color("#FFFFFF");
    streakVal.lineLimit = 1;

    rightCol.addSpacer(4);

    /* Fila 4: Temporizador dinámico o mensaje de recuperación en su propia fila completa */
    const timerRow = rightCol.addStack();
    timerRow.layoutHorizontally();
    timerRow.centerAlignContent();

    if (stateKey === "recovery") {
      const warnIco = SFSymbol.named("exclamationmark.triangle.fill");
      const wImg = timerRow.addImage(warnIco.image);
      wImg.imageSize = new Size(11, 11);
      wImg.tintColor = new Color(t.timerColor);
      timerRow.addSpacer(4);

      const recMsg = timerRow.addText(recoveryMsg);
      recMsg.font = Font.boldSystemFont(11);
      recMsg.textColor = new Color(t.timerColor);
      recMsg.lineLimit = 1;
      recMsg.minimumScaleFactor = 0.85;
    } else if (stateKey === "active") {
      const chkIco = SFSymbol.named("checkmark.circle.fill");
      const cImg = timerRow.addImage(chkIco.image);
      cImg.imageSize = new Size(11, 11);
      cImg.tintColor = new Color(t.timerColor);
      timerRow.addSpacer(4);

      const doneMsg = timerRow.addText("¡Racha de hoy completada!");
      doneMsg.font = Font.boldSystemFont(11);
      doneMsg.textColor = new Color(t.timerColor);
      doneMsg.lineLimit = 1;
    } else {
      const clockSym = SFSymbol.named("clock.fill");
      const cImg = timerRow.addImage(clockSym.image);
      cImg.imageSize = new Size(11, 11);
      cImg.tintColor = new Color(t.timerColor);
      timerRow.addSpacer(4);

      const qLabel = timerRow.addText("Quedan ");
      qLabel.font = Font.systemFont(11);
      qLabel.textColor = new Color(t.timerColor);
      qLabel.lineLimit = 1;

      const dynamicTimer = timerRow.addDate(time.midnight);
      dynamicTimer.applyTimerStyle();
      dynamicTimer.font = Font.boldSystemFont(11);
      dynamicTimer.textColor = new Color(t.timerColor);
      dynamicTimer.lineLimit = 1;

      const hLabel = timerRow.addText(" hoy");
      hLabel.font = Font.systemFont(11);
      hLabel.textColor = new Color(t.timerColor);
      hLabel.lineLimit = 1;
    }

    rightCol.addSpacer(5);

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
    nextDayLabel.lineLimit = 1;

    progRow.addSpacer();

    const barImg = drawProgressBar(t.progressVal, t.progressColor, 80, 5);
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
