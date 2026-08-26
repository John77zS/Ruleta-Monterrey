const prizes = [
  "Gorra Monterrey",
  "Polera Monterrey",
  "Tomatodo",
  "Lapicero",
  "Cuaderno",
  "Mochila",
  "Agenda",
  "Chanchito"
];

const colors = [
  "#e30613",
  "#17171a",
  "#a9040d",
  "#252529",
  "#e30613",
  "#17171a",
  "#a9040d",
  "#252529"
];

const STORAGE_KEY = "monterrey-participaciones-v3";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5R8Aqr5p5mUTfyTSpnBamzIeB2BI9nKknQcdxcvG069OyZwAMLi4WPb29Q6yDUMGu/exec";

const screenInvoice = document.getElementById("screenInvoice");
const screenWheel = document.getElementById("screenWheel");
const successTransition = document.getElementById("successTransition");

const invoiceInput = document.getElementById("invoice");
const validateBtn = document.getElementById("validateBtn");
const validationCard = document.getElementById("validationCard");
const statusText = document.getElementById("statusText");

const invoiceDisplay = document.getElementById("invoiceDisplay");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const wheelStage = document.getElementById("wheelStage");
const bulbRing = document.getElementById("bulbRing");
const spinBtn = document.getElementById("spinBtn");

const resultModal = document.getElementById("resultModal");
const prizeName = document.getElementById("prizeName");
const resultInvoice = document.getElementById("resultInvoice");
const finishBtn = document.getElementById("finishBtn");
const confettiLayer = document.getElementById("confettiLayer");

let currentParticipant = null;
let currentRotation = 0;
let spinning = false;
let tickTimer = null;

function getParticipations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveParticipation(data) {
  const list = getParticipations();
  list.push(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function sendToGoogleSheets(record) {
  const payload = {
    fecha: record.date,
    hora: record.time,
    factura: record.invoice,
    premio: record.prize
  };

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error("No se pudo enviar la participación a Google Sheets:", error);
  });
}

function invoiceAlreadyUsed(invoice) {
  return getParticipations().some(item => item.invoice === invoice);
}

function setValidationState(type, message) {
  validationCard.classList.remove("error", "success");
  if (type) validationCard.classList.add(type);
  statusText.textContent = message;
}

function validateData() {
  const invoice = invoiceInput.value.trim();

  if (!invoice) {
    setValidationState("error", "Ingresa tu número de factura para continuar.");
    return;
  }

  if (invoiceAlreadyUsed(invoice)) {
    setValidationState("error", "Esta factura ya participó anteriormente.");
    return;
  }

  currentParticipant = { invoice };

  setValidationState("success", "Factura válida. Preparando tu participación...");
  validateBtn.disabled = true;

  setTimeout(showSuccessTransition, 600);
}

function showSuccessTransition() {
  successTransition.classList.remove("hidden");

  setTimeout(() => {
    screenInvoice.classList.add("exit-left");

    setTimeout(() => {
      screenInvoice.classList.remove("active", "exit-left");

      invoiceDisplay.textContent = currentParticipant.invoice;

      screenWheel.classList.add("active", "enter-right");

      setTimeout(() => {
        screenWheel.classList.remove("enter-right");
        successTransition.classList.add("hidden");
      }, 720);
    }, 420);
  }, 900);
}

/* MISMO DIBUJO DE RULETA */
function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 14;
  const arc = Math.PI * 2 / prizes.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);

  for (let i = 0; i < prizes.length; i++) {
    const start = -Math.PI / 2 + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 90, 0, 0, radius);
    gradient.addColorStop(0, i % 2 === 0 ? "#830309" : "#0f0f11");
    gradient.addColorStop(.58, colors[i]);
    gradient.addColorStop(1, i % 2 === 0 ? "#ff1824" : "#303035");

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.42)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 5;
    ctx.font = "800 22px Arial";

    const words = prizes[i].toUpperCase().split(" ");
    const split = Math.ceil(words.length / 2);
    const line1 = words.slice(0, split).join(" ");
    const line2 = words.slice(split).join(" ");

    ctx.fillText(line1, radius - 58, -13);
    if (line2) ctx.fillText(line2, radius - 58, 13);

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.restore();
}

function buildBulbs() {
  const total = 28;
  bulbRing.innerHTML = "";

  for (let i = 0; i < total; i++) {
    const bulb = document.createElement("i");
    bulb.className = "bulb";

    const angle = i * (360 / total);
    const radius = 49;

    bulb.style.left =
      `${50 + radius * Math.cos((angle - 90) * Math.PI / 180)}%`;

    bulb.style.top =
      `${50 + radius * Math.sin((angle - 90) * Math.PI / 180)}%`;

    bulbRing.appendChild(bulb);
  }
}

function createParticles() {
  const particles = document.getElementById("particles");

  for (let i = 0; i < 34; i++) {
    const dot = document.createElement("i");
    dot.style.left = Math.random() * 100 + "%";
    dot.style.animationDuration = (8 + Math.random() * 11) + "s";
    dot.style.animationDelay = (-Math.random() * 15) + "s";
    dot.style.opacity = (.07 + Math.random() * .25).toFixed(2);
    particles.appendChild(dot);
  }
}

function playTickSequence(duration = 5500) {
  let audioCtx;

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return;
  }

  const start = performance.now();

  function tick() {
    if (!spinning) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "square";
    osc.frequency.value = 760;

    gain.gain.setValueAtTime(.025, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .035);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + .04);

    const elapsed = performance.now() - start;
    const progress = Math.min(1, elapsed / duration);
    const delay = 55 + Math.pow(progress, 2.7) * 430;

    if (progress < .93) {
      tickTimer = setTimeout(tick, delay);
    }
  }

  tick();
}

function spinWheel() {
  if (spinning || !currentParticipant) return;

  spinning = true;
  spinBtn.disabled = true;
  wheelStage.classList.add("spinning");

  const winnerIndex = Math.floor(Math.random() * prizes.length);

  const segmentAngle = 360 / prizes.length;
  const targetCenter = winnerIndex * segmentAngle + segmentAngle / 2;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const desiredMod = (360 - targetCenter) % 360;
  const delta = (desiredMod - currentMod + 360) % 360;

  currentRotation += (360 * 9) + delta;

  playTickSequence(5600);
  canvas.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    spinning = false;
    clearTimeout(tickTimer);
    wheelStage.classList.remove("spinning");

    const winner = prizes[winnerIndex];
    const now = new Date();

    const record = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      invoice: currentParticipant.invoice,
      prize: winner,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("es-BO"),
      time: now.toLocaleTimeString("es-BO")
    };

    saveParticipation(record);
    sendToGoogleSheets(record);

    prizeName.textContent = winner;
    resultInvoice.textContent = record.invoice;

    createConfetti();
    resultModal.classList.remove("hidden");
  }, 5750);
}

function createConfetti() {
  confettiLayer.innerHTML = "";

  const palette = ["#e30613", "#ffffff", "#9b9ba1", "#ff3843"];

  for (let i = 0; i < 95; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = palette[i % palette.length];
    piece.style.width = (6 + Math.random() * 8) + "px";
    piece.style.height = (8 + Math.random() * 15) + "px";
    piece.style.animationDelay = (Math.random() * .9) + "s";
    piece.style.animationDuration = (2.1 + Math.random() * 1.9) + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }
}

function resetExperience() {
  resultModal.classList.add("hidden");

  currentParticipant = null;
  spinning = false;

  invoiceInput.value = "";
  validateBtn.disabled = false;
  spinBtn.disabled = false;

  setValidationState("", "Ingresa tu número de factura para continuar.");

  screenWheel.classList.remove("active");
  screenInvoice.classList.add("active");
}

invoiceInput.addEventListener("input", () => {
  invoiceInput.value = invoiceInput.value.replace(/\D/g, "");
});

validateBtn.addEventListener("click", validateData);
spinBtn.addEventListener("click", spinWheel);
finishBtn.addEventListener("click", resetExperience);

createParticles();
buildBulbs();
drawWheel();
