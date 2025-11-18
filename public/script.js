let gameId = null;
let gameOver = false;
let safeHints = [];
let currentClientId = null;

// ---------------- SOUND  ----------------
let audioCtx = null;
function playTone(freq, duration = 0.15, type = "sine") {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}
const sndClick = () => playTone(900, 0.08, "square");
const sndLose  = () => playTone(200, 0.25, "sawtooth");
const sndUI    = () => playTone(600, 0.12, "square");

// ---------------- GAME ----------------
async function startGame() {
  const clientIdInput = document.getElementById("clientId");
  const clientId = clientIdInput.value.trim();

  if (!clientId) {
    document.getElementById("status").innerText =
      "Please Enter Client ID .";
    return;
  }

  currentClientId = clientId;

  const res = await fetch("/api/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId })
  });

  const data = await res.json();
  gameId = data.id;
  gameOver = false;
  safeHints = data.guaranteedSafe || [];

  sndUI();
  renderGrid();
  autoRevealSafeBoxes();

  // YAHAN PEHLE text show ho raha tha, ab hata diya:
  document.getElementById("status").innerText = "";
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.onclick = () => reveal(i, btn);
    grid.appendChild(btn);
  }
}

function autoRevealSafeBoxes() {
  const cells = document.querySelectorAll(".cell");
  safeHints.forEach(i => {
    const cell = cells[i];
    if (!cell) return;
    cell.classList.add("safe");
    cell.textContent = "💎";
  });
}

async function reveal(index, el) {
  if (!gameId || gameOver) return;
  if (el.classList.contains("safe") || el.classList.contains("mine")) return;

  const res = await fetch("/api/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: gameId, index })
  });

  const data = await res.json();

  if (data.mine) {
    sndLose();
    el.classList.add("mine");
    el.textContent = "💣";
    document.getElementById("status").innerText =
      `Game Over! You hit a mine 💥`;
    gameOver = true;
  } else {
    sndClick();
    el.classList.add("safe");
    el.textContent = "💎";
  }
}
