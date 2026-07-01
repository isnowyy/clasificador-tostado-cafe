/*
 * app.js — Lógica del clasificador de tostado de café.
 *
 * Flujo general:
 *   1. Cargar el modelo exportado por Teachable Machine (../model/model.json).
 *   2. Pedir permiso de cámara y crear el objeto Webcam.
 *   3. En cada frame, pasar la imagen por el modelo (predict) y renderizar
 *      las probabilidades de las 4 clases.
 *
 * NOTA IMPORTANTE:
 *   La red neuronal NO "entiende" que ve café. Recibe un tensor de números
 *   (los píxeles RGB normalizados) y devuelve otro vector de números
 *   (las probabilidades). Todo lo demás es interpretación humana.
 */

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

// Ruta al modelo. Teachable Machine exporta model.json + metadata.json + pesos.
// Usamos rutas relativas para que funcione tanto con `npx serve` como en
// GitHub Pages (donde /web suele ser la raíz publicada).
const MODEL_URL = "../model/model.json";
const METADATA_URL = "../model/metadata.json";

// Tamaño del recuadro de la webcam en píxeles.
const WEBCAM_SIZE = 320;

// ---------------------------------------------------------------------------
// Estado global
// ---------------------------------------------------------------------------

let model = null;        // Instancia del modelo de Teachable Machine.
let webcam = null;       // Instancia de tmImage.Webcam.
let maxPredictions = 0;  // Número de clases del modelo (debería ser 4).
let isRunning = false;   // Bandera del bucle de predicción.
let useFrontCamera = false; // false = cámara trasera (mejor para fotografiar granos).
let rafId = null;        // Id del requestAnimationFrame para poder cancelarlo.

// Referencias a elementos del DOM.
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const btnFlip = document.getElementById("btn-flip");
const statusEl = document.getElementById("status");
const webcamContainer = document.getElementById("webcam-container");
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const labelContainer = document.getElementById("label-container");
const topPredictionEl = document.getElementById("top-prediction");
const topClassEl = document.getElementById("top-class");

// ---------------------------------------------------------------------------
// 1. Carga del modelo
// ---------------------------------------------------------------------------

/**
 * Carga el modelo y su metadata desde /model.
 * tmImage.load() descarga model.json, los pesos (.bin) y metadata.json,
 * y reconstruye la red en memoria lista para inferir.
 */
async function loadModel() {
  setStatus("Cargando modelo…");
  try {
    model = await tmImage.load(MODEL_URL, METADATA_URL);
    maxPredictions = model.getTotalClasses(); // Normalmente 4.
    setStatus(`Modelo cargado (${maxPredictions} clases). Listo para iniciar.`);
    btnStart.disabled = false;
  } catch (err) {
    console.error(err);
    setStatus(
      "❌ No se pudo cargar el modelo. ¿Colocaste model.json, metadata.json " +
      "y los pesos en la carpeta /model?"
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Cámara / Webcam
// ---------------------------------------------------------------------------

/**
 * Inicializa la webcam y arranca el bucle de predicción.
 */
async function start() {
  if (!model) {
    setStatus("El modelo aún no está cargado.");
    return;
  }

  setStatus("Solicitando permiso de cámara…");

  // flip = true refleja la imagen horizontalmente (efecto espejo), útil
  // cuando se usa la cámara frontal para que sea más natural.
  const flip = useFrontCamera;
  webcam = new tmImage.Webcam(WEBCAM_SIZE, WEBCAM_SIZE, flip);

  try {
    // facingMode "user" = frontal, "environment" = trasera.
    await webcam.setup({ facingMode: useFrontCamera ? "user" : "environment" });
    await webcam.play();

    // Insertamos el canvas de la webcam en el DOM.
    webcamPlaceholder.hidden = true;
    webcamContainer.appendChild(webcam.canvas);

    isRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    btnFlip.disabled = false;
    setStatus("Cámara activa. Analizando…");

    // Preparamos las barras de las clases una sola vez.
    buildLabelBars();

    // Arrancamos el bucle.
    rafId = window.requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    setStatus(
      "❌ No se pudo acceder a la cámara. Revisa los permisos del navegador. " +
      "Nota: la cámara requiere https:// o localhost (no funciona con file:// en algunos navegadores)."
    );
  }
}

/**
 * Detiene la cámara y el bucle de predicción.
 */
function stop() {
  isRunning = false;
  if (rafId) window.cancelAnimationFrame(rafId);
  if (webcam) {
    webcam.stop();
    if (webcam.canvas && webcam.canvas.parentNode) {
      webcam.canvas.parentNode.removeChild(webcam.canvas);
    }
    webcam = null;
  }
  webcamPlaceholder.hidden = false;
  btnStart.disabled = false;
  btnStop.disabled = true;
  btnFlip.disabled = true;
  topPredictionEl.hidden = true;
  setStatus("Cámara detenida.");
}

/**
 * Cambia entre cámara frontal y trasera (útil en móvil).
 * Reinicia la webcam con el nuevo facingMode.
 */
async function flipCamera() {
  useFrontCamera = !useFrontCamera;
  stop();
  await start();
}

// ---------------------------------------------------------------------------
// 3. Bucle de predicción y render
// ---------------------------------------------------------------------------

/**
 * Bucle principal: se ejecuta una vez por frame mientras isRunning sea true.
 * requestAnimationFrame sincroniza el bucle con el refresco de pantalla.
 */
async function loop() {
  if (!isRunning) return;
  webcam.update();     // Captura el frame actual de la cámara.
  await predict();     // Lo pasa por la red y actualiza la UI.
  rafId = window.requestAnimationFrame(loop);
}

/**
 * Ejecuta la inferencia sobre el frame actual.
 *
 * Internamente model.predict():
 *   - Toma el canvas de la webcam.
 *   - Lo convierte a un tensor [1, 224, 224, 3] con valores normalizados.
 *   - Ejecuta el Forward Pass (MobileNet + capa densa entrenada por nosotros).
 *   - Aplica softmax y devuelve un array [{className, probability}, ...].
 */
async function predict() {
  const predictions = await model.predict(webcam.canvas);

  // Buscamos la clase con mayor probabilidad para resaltarla.
  let best = { className: "—", probability: 0 };

  predictions.forEach((p) => {
    updateLabelBar(p.className, p.probability);
    if (p.probability > best.probability) best = p;
  });

  // Mostramos la clase ganadora.
  topPredictionEl.hidden = false;
  topClassEl.textContent = `${prettyName(best.className)} (${(best.probability * 100).toFixed(1)}%)`;

  // Resaltamos visualmente la barra ganadora.
  highlightBest(best.className);
}

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------

/**
 * Crea una barra por cada clase del modelo (solo la primera vez).
 * Cada barra tiene: nombre, barra de progreso y porcentaje.
 */
function buildLabelBars() {
  labelContainer.innerHTML = ""; // Limpiamos el hint inicial.
  const classes = model.getClassLabels(); // p.ej. ["verde", "tostado_claro", ...]

  classes.forEach((name) => {
    const row = document.createElement("div");
    row.className = "label-row";
    row.dataset.class = name;

    row.innerHTML = `
      <div class="label-head">
        <span class="label-name">${prettyName(name)}</span>
        <span class="label-pct" data-pct>0%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" data-fill style="width:0%"></div>
      </div>
    `;
    labelContainer.appendChild(row);
  });
}

/**
 * Actualiza la barra y el porcentaje de una clase concreta.
 */
function updateLabelBar(className, probability) {
  const row = labelContainer.querySelector(`[data-class="${cssEscape(className)}"]`);
  if (!row) return;
  const pct = (probability * 100).toFixed(1);
  row.querySelector("[data-fill]").style.width = `${pct}%`;
  row.querySelector("[data-pct]").textContent = `${pct}%`;
}

/**
 * Añade la clase CSS "winner" a la barra de mayor probabilidad
 * y la quita del resto.
 */
function highlightBest(bestClass) {
  labelContainer.querySelectorAll(".label-row").forEach((row) => {
    row.classList.toggle("winner", row.dataset.class === bestClass);
  });
}

/**
 * Convierte los nombres internos (tostado_claro) en etiquetas legibles
 * (Tostado claro) para mostrar al usuario.
 */
function prettyName(name) {
  const map = {
    verde: "Verde (sin tostar)",
    tostado_claro: "Tostado claro",
    tostado_medio: "Tostado medio",
    tostado_oscuro: "Tostado oscuro",
  };
  return map[name] || name;
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

/**
 * Escapa un valor para poder usarlo dentro de un selector CSS de forma segura.
 */
function cssEscape(value) {
  if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Eventos y arranque
// ---------------------------------------------------------------------------

btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);
btnFlip.addEventListener("click", flipCamera);

// Deshabilitamos "Iniciar" hasta que el modelo esté cargado.
btnStart.disabled = true;

// Cargamos el modelo apenas se abre la página.
loadModel();
