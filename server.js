const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let games = {};
let nextId = 1;

function createGame(clientId = null) {
  const id = String(nextId++);
  const totalCells = 25;
  const minesCount = 3;

  // --- random mines (3) ---
  const minesSet = new Set();
  while (minesSet.size < minesCount) {
    minesSet.add(Math.floor(Math.random() * totalCells)); // 0..24
  }
  const mines = [...minesSet];

  // --- 3 guaranteed safe cells (not mines) ---
  const safeCandidates = [];
  for (let i = 0; i < totalCells; i++) {
    if (!mines.includes(i)) safeCandidates.push(i);
  }

  const guaranteedSafe = [];
  while (guaranteedSafe.length < 3 && safeCandidates.length > 0) {
    const r = Math.floor(Math.random() * safeCandidates.length);
    guaranteedSafe.push(safeCandidates[r]);
    safeCandidates.splice(r, 1);
  }

  // ye 3 safe boxes server side se hi revealed maanenge
  const revealed = [...guaranteedSafe];

  games[id] = {
    mines,
    revealed,
    isOver: false,
    totalCells,
    minesCount,
    guaranteedSafe,
    clientId      // yaha stake ka client id store hoga
  };

  // frontend ko id + 3 safe boxes bhej rahe
  return { id, guaranteedSafe, clientId };
}

// naya game
app.post("/api/new", (req, res) => {
  const { clientId } = req.body || {};
  const game = createGame(clientId || null);
  res.json(game);
});

// cell reveal
app.post("/api/reveal", (req, res) => {
  const { id, index } = req.body;

  if (id == null || index == null) {
    return res.status(400).json({ error: "id and index required" });
  }

  const game = games[id];
  if (!game) {
    return res.status(400).json({ error: "Invalid game ID" });
  }

  if (game.isOver) {
    return res.json({
      mine: false,
      isOver: true,
      revealed: game.revealed,
      mines: game.mines,
      clientId: game.clientId
    });
  }

  const idx = Number(index);

  if (game.revealed.includes(idx)) {
    return res.json({
      mine: false,
      already: true,
      isOver: game.isOver,
      revealed: game.revealed,
      clientId: game.clientId
    });
  }

  // mine?
  if (game.mines.includes(idx)) {
    game.isOver = true;
    return res.json({
      mine: true,
      isOver: true,
      mines: game.mines,
      clientId: game.clientId
    });
  }

  // safe
  game.revealed.push(idx);

  const safeCells = game.totalCells - game.mines.length;
  const isWin = game.revealed.length >= safeCells;
  if (isWin) {
    game.isOver = true;
  }

  return res.json({
    mine: false,
    isOver: game.isOver,
    isWin,
    revealed: game.revealed,
    clientId: game.clientId
  });
});

app.listen(PORT, () => {
  console.log("Running on http://localhost:" + PORT);
});
