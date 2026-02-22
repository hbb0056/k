(function () {
  if (typeof firebase === "undefined" || !firebase.apps?.length) {
    document.getElementById("firebase-warning").style.display = "block";
    document.getElementById("join-screen").style.display = "block";
    return;
  }

  const db = firebase.database();
  const gameRef = db.ref("games/" + GAME_ID);
  const participantsRef = gameRef.child("participants");
  const gameStateRef = gameRef.child("gameState");

  const joinScreen = document.getElementById("join-screen");
  const waitApprovalScreen = document.getElementById("wait-approval-screen");
  const notApprovedScreen = document.getElementById("not-approved-screen");
  const waitGameScreen = document.getElementById("wait-game-screen");
  const gameScreen = document.getElementById("game-screen");
  const playerNameInput = document.getElementById("player-name");
  const joinBtn = document.getElementById("join-btn");
  const wordGridContainer = document.getElementById("word-grid-container");
  const foundWordsEl = document.getElementById("found-words");

  let myParticipantId = null;
  let currentGrid = null;
  let currentWordPositions = null;
  let selectedCells = [];
  let foundWords = [];

  joinBtn.addEventListener("click", function () {
    const name = (playerNameInput.value || "").trim();
    if (!name) {
      alert("Lütfen bir isim girin.");
      return;
    }
    const ref = participantsRef.push({
      name: name,
      status: "pending",
      joinedAt: Date.now()
    });
    myParticipantId = ref.key;
    localStorage.setItem("kelimeavi_participant_id", myParticipantId);
    localStorage.setItem("kelimeavi_player_name", name);
    showScreen("wait-approval");
  });

  // Sayfa yüklendiğinde daha önce katılmış mı kontrol et
  (function checkStoredParticipant() {
    const storedId = localStorage.getItem("kelimeavi_participant_id");
    if (!storedId) return;
    participantsRef.child(storedId).once("value", function (snap) {
      if (!snap.exists()) {
        localStorage.removeItem("kelimeavi_participant_id");
        localStorage.removeItem("kelimeavi_player_name");
        return;
      }
      myParticipantId = storedId;
      const p = snap.val();
      if (p.status === "approved") {
        joinScreen.style.display = "none";
        waitApprovalScreen.style.display = "none";
        notApprovedScreen.style.display = "none";
        showScreen("wait-game");
        listenGameState();
        return;
      }
      showScreen("wait-approval");
    });
  })();

  if (!myParticipantId) {
    participantsRef.on("value", function (snap) {
      if (myParticipantId === null) return;
      const p = (snap.val() || {})[myParticipantId];
      if (!p) {
        showScreen("not-approved");
        return;
      }
      if (p.status === "approved") {
        showScreen("wait-game");
        listenGameState();
      } else {
        showScreen("wait-approval");
      }
    });
  }

  function showScreen(which) {
    joinScreen.style.display = "none";
    waitApprovalScreen.style.display = "none";
    notApprovedScreen.style.display = "none";
    waitGameScreen.style.display = "none";
    gameScreen.style.display = "none";
    if (which === "join") joinScreen.style.display = "block";
    else if (which === "wait-approval") waitApprovalScreen.style.display = "block";
    else if (which === "not-approved") notApprovedScreen.style.display = "block";
    else if (which === "wait-game") waitGameScreen.style.display = "block";
    else if (which === "game") gameScreen.style.display = "block";
  }

  function listenGameState() {
    gameStateRef.on("value", function (snap) {
      const state = snap.val() || {};
      if (state.status === "playing" && state.grid) {
        currentGrid = state.grid;
        currentWordPositions = state.wordPositions || {};
        renderGrid();
        showScreen("game");
      } else {
        currentGrid = null;
        currentWordPositions = null;
        showScreen("wait-game");
      }
    });
  }

  function renderGrid() {
    if (!currentGrid || !currentWordPositions) return;
    foundWords = [];
    selectedCells = [];
    wordGridContainer.innerHTML = "";
    const gridEl = document.createElement("div");
    gridEl.className = "word-grid";
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    gridEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("cell");
        cell.textContent = currentGrid[r][c];
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener("click", function () {
          toggleCell(r, c);
        });
        gridEl.appendChild(cell);
      }
    }
    wordGridContainer.appendChild(gridEl);
    updateFoundWordsDisplay();
  }

  function toggleCell(r, c) {
    const idx = selectedCells.findIndex(function (x) {
      return x.r === r && x.c === c;
    });
    if (idx >= 0) {
      selectedCells.splice(idx, 1);
    } else {
      selectedCells.push({ r, c });
    }
    updateSelectionUI();
    const word = getWordFromSelection(currentWordPositions, selectedCells);
    if (word && foundWords.indexOf(word) < 0) {
      foundWords.push(word);
      updateFoundWordsDisplay();
      selectedCells = [];
      updateSelectionUI();
    }
  }

  function updateSelectionUI() {
    const cells = wordGridContainer.querySelectorAll("cell");
    cells.forEach(function (cell) {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const isSelected = selectedCells.some(function (x) {
        return x.r === r && x.c === c;
      });
      const isFound = foundWords.some(function (w) {
        const pos = currentWordPositions[w];
        return pos && pos.some(function (p) {
          return p.r === r && p.c === c;
        });
      });
      cell.classList.toggle("selected", isSelected);
      cell.classList.toggle("found", isFound);
    });
  }

  function updateFoundWordsDisplay() {
    foundWordsEl.innerHTML = "";
    foundWords.forEach(function (w) {
      const span = document.createElement("span");
      span.textContent = w;
      foundWordsEl.appendChild(span);
    });
  }
})();
