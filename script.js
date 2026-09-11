
const prizesByRegional = {
  "La Paz": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ],

  "Potosí": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ],

  "Santa Cruz": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ],

  "Sucre": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ],

  "Tarija": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ],

  "Trinidad": [
    "Gorra",
    "Alcancia",
    "Tomatodo",
    "Bolsa ecologica",
    "Mochila",
    "Alcancia",
    "Boligrafo + Llavero",
    "Siga participando"
  ]
};


// =============================
// COLORES
// =============================

const colors = [
  "#e30613",
  "#17171a",
  "#a9040d",
  "#252529",
  "#e30613",
  "#17171a",
  "#a9040d",
  "#252529",
  "#17171a"
];


// =============================
// CONFIGURACIÓN
// =============================

const STORAGE_KEY = "monterrey-participaciones-v4";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxzxp_GcRV6n-MGyWnutvyUA1e0Gs-5w6EwhgxcWglZoHmuCfRMhGzNA4ycXS-y8Mh7cA/exec";

// VALIDACIÓN DE FACTURA - PRODUCCIÓN v2
console.log("Ruleta Monterrey: validador de factura v2 cargado");


// =============================
// ELEMENTOS DEL DOM
// =============================

const screenInvoice = document.getElementById("screenInvoice");
const screenWheel = document.getElementById("screenWheel");
const successTransition = document.getElementById("successTransition");

const invoiceInput = document.getElementById("invoice");
const validateBtn = document.getElementById("validateBtn");
const validationCard = document.getElementById("validationCard");
const statusText = document.getElementById("statusText");
const regionalSelect = document.getElementById("regional");

const invoiceDisplay = document.getElementById("invoiceDisplay");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const wheelStage = document.getElementById("wheelStage");
const wheelFrame = document.getElementById("wheelFrame");

const bulbRing = document.getElementById("bulbRing");
const spinBtn = document.getElementById("spinBtn");

const resultModal = document.getElementById("resultModal");
const prizeName = document.getElementById("prizeName");
const resultInvoice = document.getElementById("resultInvoice");
const resultRegional = document.getElementById("resultRegional");

const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const prizeLabel = document.getElementById("prizeLabel");

const finishBtn = document.getElementById("finishBtn");
const confettiLayer = document.getElementById("confettiLayer");


// =============================
// ESTADO
// =============================

let currentParticipant = null;

let activePrizes = prizesByRegional["La Paz"];

let currentRotation = 0;

let spinning = false;
let verificationAnimationTimer = null;

let idleFrame = null;
let spinFrame = null;

let tickTimer = null;

let lastIdleTime = 0;


// =============================
// VELOCIDADES
// =============================

// Grados por segundo durante la espera
const IDLE_SPEED = 360 / 32;


// =============================
// GIRO IDLE
// =============================

function startIdleSpin() {

  // No iniciar si ya está girando
  // o si ya existe una animación idle
  if (spinning || idleFrame) {
    return;
  }

  lastIdleTime = performance.now();

  function animate(now) {

    // Si comenzó el giro principal,
    // detenemos inmediatamente el idle.
    if (spinning) {
      idleFrame = null;
      return;
    }

    const elapsed = now - lastIdleTime;

    lastIdleTime = now;

    currentRotation += IDLE_SPEED * (elapsed / 1000);

    wheelFrame.style.transform =
      `rotate(${currentRotation}deg)`;

    idleFrame = requestAnimationFrame(animate);
  }

  idleFrame = requestAnimationFrame(animate);
}


// =============================
// DETENER GIRO IDLE
// =============================

function stopIdleSpin() {

  if (idleFrame) {

    cancelAnimationFrame(idleFrame);

    idleFrame = null;
  }
}


// =============================
// LOCAL STORAGE
// =============================

function getParticipations() {

  try {

    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

  } catch (error) {

    console.error(
      "Error leyendo participaciones:",
      error
    );

    return [];
  }
}


function saveParticipation(data) {

  const list = getParticipations();

  list.push(data);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(list)
  );
}

// ==========================================
// COMPROBAR FACTURA EN GOOGLE SHEETS
// ==========================================

function checkInvoiceInGoogleSheets(invoice) {
  return new Promise((resolve, reject) => {

    const callbackName =
      "checkInvoice_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    let terminado = false;

    const limpiar = () => {
      if (terminado) return;

      terminado = true;

      clearTimeout(timeout);

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }
    };

    const timeout = setTimeout(() => {

      limpiar();

      reject(
        new Error(
          "Tiempo de espera agotado al consultar Google Sheets."
        )
      );

    }, 15000);


    // ==========================================
    // RESPUESTA DE GOOGLE SHEETS
    // ==========================================

    window[callbackName] = function(data) {

      if (terminado) return;

      limpiar();

      console.log(
        "Respuesta Google Sheets:",
        data
      );

      if (!data) {

        reject(
          new Error(
            "Google Sheets no devolvió datos."
          )
        );

        return;
      }


      if (data.ok !== true) {

        reject(
          new Error(
            data.error ||
            "Error consultando Google Sheets."
          )
        );

        return;
      }


      // IMPORTANTE:
      // Convertimos explícitamente a booleano

      const existe =
        data.exists === true ||
        data.exists === "true";


      console.log(
        "Factura:",
        invoice,
        "Existe:",
        existe
      );


      resolve(existe);
    };


    // ==========================================
    // URL
    // ==========================================

    const url =
      GOOGLE_SCRIPT_URL +
      "?action=checkInvoice" +
      "&invoice=" +
      encodeURIComponent(
        String(invoice).trim()
      ) +
      "&callback=" +
      encodeURIComponent(
        callbackName
      ) +
      "&t=" +
      Date.now();


    console.log(
      "Consultando factura:",
      invoice
    );

    console.log(
      "URL:",
      url
    );


    script.src = url;


    script.onerror = function() {

      limpiar();

      reject(
        new Error(
          "No se pudo conectar con Google Sheets."
        )
      );

    };


    document.body.appendChild(script);

  });
}


// ==========================================
// CALENTAR CONEXIÓN CON GOOGLE SHEETS
// ==========================================
// Se ejecuta al cargar la web para que Apps Script
// pueda estar listo cuando el usuario valide su factura.

function warmupGoogleSheets() {

  if (!GOOGLE_SCRIPT_URL) return;

  const callbackName =
    "warmup_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 100000);

  const script =
    document.createElement("script");

  let terminado = false;

  const limpiar = () => {

    if (terminado) return;

    terminado = true;

    clearTimeout(timeout);

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

    try {
      delete window[callbackName];
    } catch (e) {
      window[callbackName] = undefined;
    }
  };

  const timeout =
    setTimeout(() => {

      limpiar();

      console.warn(
        "Warmup de Google Sheets agotado."
      );

    }, 10000);

  window[callbackName] =
    function(data) {

      if (terminado) return;

      limpiar();

      console.log(
        "Google Sheets preparado:",
        data
      );
    };

  script.src =
    GOOGLE_SCRIPT_URL +
    "?action=warmup" +
    "&callback=" +
    encodeURIComponent(callbackName) +
    "&t=" +
    Date.now();

  script.onerror = function() {

    limpiar();

    console.warn(
      "No se pudo realizar el warmup de Google Sheets."
    );
  };

  document.body.appendChild(script);
}


// =============================
// GOOGLE SHEETS// =============================
// GOOGLE SHEETS
// =============================

function sendToGoogleSheets(record) {

  const payload = {
    fecha: record.date,
    hora: record.time,
    regional: record.regional,
    factura: record.invoice,
    premio: record.prize
  };

  console.log(
    "Enviando participación a Google Sheets:",
    payload
  );

  fetch(
    GOOGLE_SCRIPT_URL,
    {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    }
  )
  .then(() => {

    console.log(
      "Participación enviada a Google Sheets."
    );

  })
  .catch(error => {

    console.error(
      "ERROR enviando participación a Google Sheets:",
      error
    );

  });
}


// =============================
// ESTADO DE VALIDACIÓN
// =============================

function setValidationState(type, message) {

  validationCard.classList.remove(
    "error",
    "success"
  );

  if (type) {

    validationCard.classList.add(type);

  }

  statusText.textContent = message;
}


// ==========================================
// ANIMACIÓN DEL ESTADO DE VERIFICACIÓN
// ==========================================

function startVerificationAnimation() {

  stopVerificationAnimation();

  const baseText = "Verificando factura";
  let dots = 0;

  statusText.textContent = baseText + "...";

  verificationAnimationTimer =
    setInterval(() => {

      dots = (dots + 1) % 4;

      statusText.textContent =
        baseText + ".".repeat(dots);

    }, 350);
}

function stopVerificationAnimation() {

  if (verificationAnimationTimer) {

    clearInterval(
      verificationAnimationTimer
    );

    verificationAnimationTimer = null;
  }
}

async function validateData() {

  const regional =
    regionalSelect.value.trim();

  const invoice =
    invoiceInput.value.trim();


  // ==========================================
  // VALIDAR REGIONAL
  // ==========================================

  if (!regional) {

    setValidationState(
      "error",
      "Selecciona una regional para continuar."
    );

    regionalSelect.focus();

    return;
  }


  // ==========================================
  // VALIDAR FACTURA
  // ==========================================

  if (!invoice) {

    setValidationState(
      "error",
      "Ingresa tu número de factura para continuar."
    );

    invoiceInput.focus();

    return;
  }


  // ==========================================
  // DESACTIVAR BOTÓN
  // ==========================================

  validateBtn.disabled = true;


  setValidationState(
    "",
    "Verificando factura..."
  );

  startVerificationAnimation();


  try {

    console.log(
      "================================="
    );

    console.log(
      "VALIDANDO FACTURA:",
      invoice
    );


    // ==========================================
    // CONSULTAR GOOGLE SHEETS
    // ==========================================

    const exists =
      await checkInvoiceInGoogleSheets(
        invoice
      );


    console.log(
      "RESULTADO:",
      exists
    );

    stopVerificationAnimation();


    // ==========================================
    // FACTURA DUPLICADA
    // ==========================================

    if (exists === true) {

      console.log(
        "🚫 FACTURA DUPLICADA"
      );


      setValidationState(
        "error",
        "Esta factura ya participó anteriormente."
      );


      // MUY IMPORTANTE:
      // NO crear participante
      // NO pasar a la ruleta
      // NO ejecutar transición

      currentParticipant = null;


      validateBtn.disabled = false;

      invoiceInput.focus();

      return;
    }


    // ==========================================
    // FACTURA DISPONIBLE
    // ==========================================

    console.log(
      "✅ FACTURA DISPONIBLE"
    );


    currentParticipant = {

      invoice: invoice,

      regional: regional

    };


    activePrizes =
      prizesByRegional[regional] ||
      prizesByRegional["La Paz"];


    drawWheel();


    setValidationState(
      "success",
      "Factura válida. Preparando tu participación..."
    );


    stopIdleSpin();


    setTimeout(
      showSuccessTransition,
      600
    );


  } catch (error) {

    stopVerificationAnimation();

    console.error(
      "ERROR VALIDANDO FACTURA:",
      error
    );


    currentParticipant = null;


    setValidationState(
      "error",
      "No se pudo verificar la factura. Intenta nuevamente."
    );


    validateBtn.disabled = false;

  }

}


// =============================
// TRANSICIÓN A RULETA
// =============================

function showSuccessTransition() {

  successTransition.classList.remove(
    "hidden"
  );


  setTimeout(() => {

    screenInvoice.classList.add(
      "exit-left"
    );


    setTimeout(() => {

      screenInvoice.classList.remove(
        "active",
        "exit-left"
      );


      invoiceDisplay.textContent =
        currentParticipant.invoice;


      screenWheel.classList.add(
        "active",
        "enter-right"
      );


      // Iniciar giro lento
      startIdleSpin();


      setTimeout(() => {

        screenWheel.classList.remove(
          "enter-right"
        );

        successTransition.classList.add(
          "hidden"
        );

      }, 720);

    }, 420);

  }, 900);
}


// =============================
// DIBUJAR RULETA
// =============================

function drawWheel() {

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 14;

  if (!activePrizes || activePrizes.length === 0) {
    return;
  }

  const arc = (Math.PI * 2) / activePrizes.length;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(center, center);

  // =============================
  // SEGMENTOS
  // =============================
  for (let i = 0; i < activePrizes.length; i++) {

    const start = -Math.PI / 2 + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();

    const esSigaParticipando =
      activePrizes[i] === "Siga participando";

    if (esSigaParticipando) {

      const gradientBlanco = ctx.createRadialGradient(
        0, 0, 90,
        0, 0, radius
      );

      gradientBlanco.addColorStop(0, "#ffffff");
      gradientBlanco.addColorStop(0.58, "#ffffff");
      gradientBlanco.addColorStop(1, "#e8e8e8");

      ctx.fillStyle = gradientBlanco;

    } else {

      const gradient = ctx.createRadialGradient(
        0, 0, 90,
        0, 0, radius
      );

      gradient.addColorStop(
        0,
        i % 2 === 0 ? "#830309" : "#0f0f11"
      );

      gradient.addColorStop(
        0.58,
        colors[i % colors.length]
      );

      gradient.addColorStop(
        1,
        i % 2 === 0 ? "#ff1824" : "#303035"
      );

      ctx.fillStyle = gradient;
    }

    ctx.fill();

    // Separación entre segmentos
    ctx.strokeStyle = "rgba(255,255,255,.48)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // =============================
    // TEXTO
    // =============================
    ctx.save();

    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 4;
    ctx.font = "800 20px Arial";

    const words = activePrizes[i]
      .toUpperCase()
      .split(" ");

    const split = Math.ceil(words.length / 2);

    const line1 = words
      .slice(0, split)
      .join(" ");

    const line2 = words
      .slice(split)
      .join(" ");

    if (activePrizes[i] === "Siga participando") {

      ctx.fillStyle = "#000000";
      ctx.fillText(
        "SIGA",
        radius - 58,
        -13
      );

      ctx.fillStyle = "#e30613";
      ctx.fillText(
        "PARTICIPANDO",
        radius - 58,
        13
      );

    } else {

      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        line1,
        radius - 58,
        -13
      );

      if (line2) {
        ctx.fillText(
          line2,
          radius - 58,
          13
        );
      }
    }

    ctx.restore();
  }

  // =============================
  // BORDE EXTERIOR
  // =============================
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    radius - 3,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.restore();
}


// =============================
// BOMBILLAS
// =============================

function buildBulbs() {

  const total = 28;

  bulbRing.innerHTML = "";


  for (
    let i = 0;
    i < total;
    i++
  ) {

    const bulb =
      document.createElement("i");


    bulb.className =
      "bulb";


    const angle =
      i * (360 / total);


    const radius = 49;


    bulb.style.left =
      `${50 +
        radius *
        Math.cos(
          (angle - 90) *
          Math.PI / 180
        )}%`;


    bulb.style.top =
      `${50 +
        radius *
        Math.sin(
          (angle - 90) *
          Math.PI / 180
        )}%`;


    bulbRing.appendChild(
      bulb
    );
  }
}


// =============================
// PARTÍCULAS
// =============================

function createParticles() {

  const particles =
    document.getElementById(
      "particles"
    );


  if (!particles) {
    return;
  }


  particles.innerHTML = "";


  for (
    let i = 0;
    i < 34;
    i++
  ) {

    const dot =
      document.createElement("i");


    dot.style.left =
      Math.random() *
      100 +
      "%";


    dot.style.animationDuration =
      (8 +
        Math.random() * 11) +
      "s";


    dot.style.animationDelay =
      (-Math.random() * 15) +
      "s";


    dot.style.opacity =
      (
        0.07 +
        Math.random() * 0.25
      ).toFixed(2);


    particles.appendChild(
      dot
    );
  }
}


// =============================
// SONIDO DE LA RULETA
// =============================

function playTickSequence(
  duration = 5600
) {

  let audioCtx;


  try {

    audioCtx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

  } catch {

    return;
  }


  const start =
    performance.now();


  function tick() {

    if (!spinning) {
      return;
    }


    const osc =
      audioCtx.createOscillator();


    const gain =
      audioCtx.createGain();


    osc.type =
      "square";


    osc.frequency.value =
      760;


    gain.gain.setValueAtTime(
      0.025,
      audioCtx.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.035
    );


    osc
      .connect(gain)
      .connect(audioCtx.destination);


    osc.start();


    osc.stop(
      audioCtx.currentTime + 0.04
    );


    const progress =
      Math.min(
        1,
        (
          performance.now() -
          start
        ) / duration
      );


    const delay =
      55 +
      Math.pow(
        progress,
        2.7
      ) *
      430;


    if (progress < 0.93) {

      tickTimer =
        setTimeout(
          tick,
          delay
        );

    }
  }


  tick();
}


// =============================
// ELEGIR PREMIO POR PESO
// =============================

function chooseWinnerIndex() {

  // ==========================================
  // AQUÍ CONTROLAS LAS PROBABILIDADES
  // ==========================================
  //
  // Todos en 1 = misma probabilidad.
  //
  // Ejemplo:
  //
  // "Gorra": 2
  //
  // significa que la Gorra tendrá el doble
  // de probabilidad que un premio con peso 1.
  //
  // ==========================================

  const prizeProbabilities = {

    "Gorra": 1,

    "Tomatodo": 1,

    "Bolsa ecologica": 1,

    "Mochila": 1,

    "Alcancia": 1,

    "Llavero": 1,

    "Boligrafo": 1,

    "Siga participando": 1

  };


  // -----------------------------
  // CALCULAR PESO TOTAL
  // -----------------------------

  const totalWeight =
    activePrizes.reduce(
      (total, prize) => {

        return total +
          (
            prizeProbabilities[prize] ||
            0
          );

      },
      0
    );


  // Si por algún motivo todos
  // tienen peso 0, usamos elección
  // completamente aleatoria.

  if (totalWeight <= 0) {

    return Math.floor(
      Math.random() *
      activePrizes.length
    );
  }


  // -----------------------------
  // NÚMERO ALEATORIO
  // -----------------------------

  let random =
    Math.random() *
    totalWeight;


  // -----------------------------
  // ENCONTRAR PREMIO
  // -----------------------------

  for (
    let i = 0;
    i < activePrizes.length;
    i++
  ) {

    const prize =
      activePrizes[i];


    const weight =
      prizeProbabilities[prize] ||
      0;


    random -= weight;


    if (random < 0) {

      return i;
    }
  }


  // Seguridad
  return activePrizes.length - 1;
}


async function spinWheel() {

  // ==========================================
  // SEGURIDAD
  // ==========================================

  if (
    spinning ||
    !currentParticipant ||
    !activePrizes.length
  ) {
    return;
  }


  // ==========================================
  // AHORA SÍ: GIRAR
  // La factura ya fue validada al presionar
  // "Continuar", así que no volvemos a
  // consultar Google Sheets aquí.
  // ==========================================

  spinBtn.disabled = true;
  spinning = true;
  stopIdleSpin();
  wheelStage.classList.add(
    "spinning"
  );


  // ==========================================
  // ELEGIR PREMIO
  // ==========================================

  const winnerIndex =
    chooseWinnerIndex();


  // ==========================================
  // ÁNGULO
  // ==========================================

  const segmentAngle =
    360 /
    activePrizes.length;

  const targetCenter =
    winnerIndex *
      segmentAngle +
    segmentAngle / 2;


  const startRotation =
    currentRotation;


  const currentMod =
    (
      (currentRotation % 360) +
      360
    ) % 360;


  const desiredMod =
    (
      360 -
      targetCenter +
      360
    ) % 360;


  let delta =
    desiredMod -
    currentMod;


  if (delta < 0) {
    delta += 360;
  }


  const totalTurns = 9;

  const finalRotation =
    currentRotation +
    360 * totalTurns +
    delta;


  const duration = 5600;

  playTickSequence(
    duration
  );


  const startTime =
    performance.now();


  function animateSpin(now) {

    const elapsed =
      now - startTime;

    const progress =
      Math.min(
        elapsed / duration,
        1
      );

    const eased =
      1 -
      Math.pow(
        1 - progress,
        4
      );

    currentRotation =
      startRotation +
      (
        finalRotation -
        startRotation
      ) *
      eased;

    wheelFrame.style.transform =
      `rotate(${currentRotation}deg)`;

    if (progress < 1) {

      spinFrame =
        requestAnimationFrame(
          animateSpin
        );

      return;
    }

    spinFrame = null;

    currentRotation =
      finalRotation;

    wheelFrame.style.transform =
      `rotate(${currentRotation}deg)`;

    finishSpin(
      winnerIndex
    );
  }


  spinFrame =
    requestAnimationFrame(
      animateSpin
    );
}


// =============================
// FINALIZAR GIRO
// =============================

function finishSpin(
  winnerIndex
) {

  spinning = false;


  // Cancelar animación por seguridad

  if (spinFrame) {

    cancelAnimationFrame(
      spinFrame
    );

    spinFrame = null;
  }


  // Detener sonido

  clearTimeout(
    tickTimer
  );


  // Quitar efecto visual

  wheelStage.classList.remove(
    "spinning"
  );


  // -----------------------------
  // OBTENER PREMIO
  // -----------------------------

  const winner =
    activePrizes[winnerIndex];


  // -----------------------------
  // FECHA Y HORA
  // -----------------------------

  const now =
    new Date();


  // -----------------------------
  // CREAR REGISTRO
  // -----------------------------

  const record = {

    id:
      (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
      )
        ? crypto.randomUUID()
        : String(Date.now()),

    invoice:
      currentParticipant.invoice,

    regional:
      currentParticipant.regional,

    prize:
      winner,

    timestamp:
      now.toISOString(),

    date:
      now.toLocaleDateString(
        "es-BO"
      ),

    time:
      now.toLocaleTimeString(
        "es-BO"
      )

  };


  // -----------------------------
  // GUARDAR LOCALMENTE
  // -----------------------------

  saveParticipation(
    record
  );


  // -----------------------------
  // ENVIAR A GOOGLE SHEETS
  // -----------------------------

  sendToGoogleSheets(
    record
  );
// -----------------------------
  // MOSTRAR RESULTADO
  // -----------------------------

  prizeName.textContent =
    winner;


  resultInvoice.textContent =
    record.invoice;


  if (resultRegional) {

    resultRegional.textContent =
      record.regional;
  }


  // -----------------------------
  // SIN PREMIO
  // -----------------------------

  if (
    winner ===
    "Siga participando"
  ) {

    resultTitle.textContent =
      "¡CASI!";


    resultMessage.textContent =
      "Esta vez no hubo premio, pero puedes seguir participando en futuras compras.";


    prizeLabel.textContent =
      "RESULTADO";


    confettiLayer.innerHTML =
      "";

  }


  // -----------------------------
  // PREMIO
  // -----------------------------

  else {

    resultTitle.textContent =
      "¡FELICIDADES!";


    resultMessage.textContent =
      "Tu compra acaba de convertirse en:";


    prizeLabel.textContent =
      "TU PREMIO";


    createConfetti();

  }


  // -----------------------------
  // MOSTRAR MODAL
  // -----------------------------

  resultModal.classList.remove(
    "hidden"
  );
}


// =============================
// CONFETI
// =============================

function createConfetti() {

  confettiLayer.innerHTML = "";

  const pieces = 120;

  const palette = [
    "#e30613",
    "#ffffff",
    "#9b9ba1",
    "#ff3843",
    "#d71920",
    "#f5f5f5"
  ];

  for (let i = 0; i < pieces; i++) {

    const piece =
      document.createElement("i");

    piece.className = "confetti";

    const startX =
      Math.random() * 100;

    const drift =
      -250 + Math.random() * 500;

    const rotation =
      360 + Math.random() * 1080;

    const duration =
      2.2 + Math.random() * 2.2;

    const delay =
      Math.random() * 0.7;

    piece.style.left =
      startX + "%";

    piece.style.background =
      palette[
        Math.floor(
          Math.random() * palette.length
        )
      ];

    piece.style.width =
      (5 + Math.random() * 8) + "px";

    piece.style.height =
      (8 + Math.random() * 14) + "px";

    piece.style.setProperty(
      "--drift",
      drift + "px"
    );

    piece.style.setProperty(
      "--rotation",
      rotation + "deg"
    );

    piece.style.animationDuration =
      duration + "s";

    piece.style.animationDelay =
      delay + "s";

    piece.style.transform =
      `rotate(${Math.random() * 360}deg)`;

    confettiLayer.appendChild(piece);
  }
}


// =============================
// REINICIAR EXPERIENCIA
// =============================

function resetExperience() {

  // -----------------------------
  // OCULTAR RESULTADO
  // -----------------------------

  resultModal.classList.add(
    "hidden"
  );


  // -----------------------------
  // DETENER ANIMACIONES
  // -----------------------------

  stopIdleSpin();


  if (spinFrame) {

    cancelAnimationFrame(
      spinFrame
    );

    spinFrame = null;
  }


  clearTimeout(
    tickTimer
  );


  // -----------------------------
  // REINICIAR ESTADO
  // -----------------------------

  currentParticipant =
    null;

  spinning =
    false;


  // -----------------------------
  // LIMPIAR FORMULARIO
  // -----------------------------

  invoiceInput.value =
    "";


  regionalSelect.value =
    "";


  validateBtn.disabled =
    false;


  spinBtn.disabled =
    false;


  // -----------------------------
  // MENSAJE INICIAL
  // -----------------------------

  setValidationState(
    "",
    "Selecciona tu regional e ingresa tu número de factura para continuar."
  );


  // -----------------------------
  // VOLVER A PANTALLA INICIAL
  // -----------------------------

  screenWheel.classList.remove(
    "active"
  );


  screenInvoice.classList.add(
    "active"
  );


  // -----------------------------
  // REINICIAR RULETA
  // -----------------------------

  currentRotation =
    0;


  wheelFrame.style.transform =
    "rotate(0deg)";


  activePrizes =
    prizesByRegional["La Paz"];


  drawWheel();


  // -----------------------------
  // VOLVER A GIRO IDLE
  // -----------------------------

  startIdleSpin();
}


// =============================
// EVENTOS
// =============================

// Solo permitir números en factura

invoiceInput.addEventListener(
  "input",
  () => {

    invoiceInput.value =
      invoiceInput.value.replace(
        /\D/g,
        ""
      );

  }
);


// Cambio de regional

regionalSelect.addEventListener(
  "change",
  () => {

    setValidationState(
      "",
      "Selecciona tu regional e ingresa tu número de factura para continuar."
    );

  }
);


// Botón validar

validateBtn.addEventListener(
  "click",
  validateData
);


// Botón girar

spinBtn.addEventListener(
  "click",
  spinWheel
);


// Botón finalizar

finishBtn.addEventListener(
  "click",
  resetExperience
);


// =============================
// INICIALIZACIÓN
// =============================

createParticles();

buildBulbs();

drawWheel();

startIdleSpin();

// Preparar Google Sheets en segundo plano.
// No bloquea la carga de la página.
warmupGoogleSheets();