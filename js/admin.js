(function () {
  var fileWarning = document.getElementById("file-protocol-warning");
  var firebaseWarning = document.getElementById("firebase-warning");
  if (fileWarning && window.location.protocol === "file:") {
    fileWarning.style.display = "block";
  }

  if (typeof firebase === "undefined") {
    if (firebaseWarning) firebaseWarning.style.display = "block";
    return;
  }

  var GAME_ID = window.GAME_ID || "main";
  var db, gameRef, participantsRef, wordsRef, gameStateRef;
  try {
    db = firebase.database();
    gameRef = db.ref("games/" + GAME_ID);
    participantsRef = gameRef.child("participants");
    wordsRef = gameRef.child("words");
    gameStateRef = gameRef.child("gameState");
  } catch (e) {
    var msg = "Firebase bağlantısı kurulamadı: " + (e.message || e);
    if (window.KELIMEAVI_DEBUG) window.KELIMEAVI_DEBUG(msg);
    if (firebaseWarning) {
      firebaseWarning.style.display = "block";
      firebaseWarning.innerHTML = "<p>" + msg + "</p><p>Siteyi <strong>sunucu üzerinden</strong> açın (örn. <code>npx serve .</code>).</p>";
    }
    return;
  }
  if (window.KELIMEAVI_DEBUG) window.KELIMEAVI_DEBUG("Veritabanına bağlanılıyor…");

  const participantListEl = document.getElementById("participant-list");
  const participantEmptyEl = document.getElementById("participant-empty");
  const participantCountEl = document.getElementById("participant-count");
  const connectionStatusEl = document.getElementById("connection-status");
  const wordListEl = document.getElementById("word-list");
  const wordEmptyEl = document.getElementById("word-empty");
  const newWordInput = document.getElementById("new-word");
  const addWordBtn = document.getElementById("add-word-btn");
  const startGameBtn = document.getElementById("start-game-btn");
  const resetGameBtn = document.getElementById("reset-game-btn");
  const gameStatusEl = document.getElementById("game-status");

  if (connectionStatusEl) connectionStatusEl.textContent = "Veritabanına bağlanılıyor…";
  participantsRef.once("value")
    .then(function (snap) {
      if (window.KELIMEAVI_DEBUG) window.KELIMEAVI_DEBUG("Veritabanı bağlı. Butonlar çalışır.");
      if (connectionStatusEl) {
        connectionStatusEl.textContent = "Veritabanı bağlı. Liste anlık güncellenir.";
        connectionStatusEl.style.color = "#22c55e";
      }
    })
    .catch(function (err) {
      var errMsg = (err && err.message) || String(err);
      if (window.KELIMEAVI_DEBUG) window.KELIMEAVI_DEBUG("HATA: " + errMsg);
      if (connectionStatusEl) {
        connectionStatusEl.textContent = "Bağlantı hatası: " + errMsg + " — Realtime Database kurallarını kontrol edin.";
        connectionStatusEl.style.color = "#ef4444";
      }
    });

  // Başlangıçta gameState yoksa oluştur
  gameStateRef.once("value", function (snap) {
    if (!snap.exists()) {
      gameStateRef.set({ status: "waiting" });
    }
  });

  // Katılımcıları dinle
  participantsRef.on("value", function (snap) {
    const data = snap.val() || {};
    const entries = Object.entries(data);
    if (participantCountEl) {
      participantCountEl.textContent = "(" + entries.length + ")";
    }
    participantListEl.innerHTML = "";
    participantEmptyEl.style.display = entries.length ? "none" : "block";
    entries.forEach(function ([id, p]) {
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="name">' +
        escapeHtml(p.name || "İsimsiz") +
        "</span>" +
        (p.status === "approved"
          ? '<span class="badge badge-approved">Onaylı</span>'
          : '<span class="badge badge-pending">Beklemede</span>');
      const actions = document.createElement("span");
      actions.style.display = "flex";
      actions.style.gap = "0.5rem";
      if (p.status !== "approved") {
        const approveBtn = document.createElement("button");
        approveBtn.className = "btn btn-success";
        approveBtn.textContent = "Onayla";
        approveBtn.type = "button";
        approveBtn.style.padding = "0.35rem 0.75rem";
        approveBtn.style.fontSize = "0.85rem";
        approveBtn.onclick = function () {
          participantsRef.child(id).update({ status: "approved" });
        };
        actions.appendChild(approveBtn);
      }
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger";
      removeBtn.textContent = "Sil";
      removeBtn.type = "button";
      removeBtn.style.padding = "0.35rem 0.75rem";
      removeBtn.style.fontSize = "0.85rem";
      removeBtn.onclick = function () {
        participantsRef.child(id).remove();
      };
      actions.appendChild(removeBtn);
      li.appendChild(actions);
      participantListEl.appendChild(li);
    });
  });

  // Kelime listesini dinle
  wordsRef.on("value", function (snap) {
    const data = snap.val() || {};
    const entries = Object.entries(data);
    wordListEl.innerHTML = "";
    wordEmptyEl.style.display = entries.length ? "none" : "block";
    entries.forEach(function ([id, word]) {
      const li = document.createElement("li");
      li.innerHTML = '<span class="name">' + escapeHtml(word) + "</span>';
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Sil";
      delBtn.type = "button";
      delBtn.style.padding = "0.35rem 0.75rem";
      delBtn.style.fontSize = "0.85rem";
      delBtn.onclick = function () {
        wordsRef.child(id).remove();
      };
      li.appendChild(delBtn);
      wordListEl.appendChild(li);
    });
  });

  // Oyun durumunu dinle
  gameStateRef.on("value", function (snap) {
    const state = snap.val() || { status: "waiting" };
    gameStatusEl.textContent = "Durum: " + (state.status === "playing" ? "Oyun başladı" : "Beklemede");
    startGameBtn.disabled = state.status === "playing";
    resetGameBtn.style.visibility = state.status === "playing" ? "visible" : "hidden";
  });

  addWordBtn.addEventListener("click", function () {
    const word = (newWordInput.value || "").trim();
    if (!word) {
      alert("Lütfen bir kelime yazın.");
      return;
    }
    newWordInput.value = "";
    addWordBtn.disabled = true;
    wordsRef
      .push(word)
      .then(function () {
        addWordBtn.disabled = false;
        var msg = document.createElement("span");
        msg.id = "add-word-msg";
        msg.style.cssText = "margin-left: 0.5rem; color: var(--success); font-size: 0.9rem;";
        msg.textContent = "Eklendi.";
        addWordBtn.parentNode.appendChild(msg);
        setTimeout(function () {
          if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 2000);
      })
      .catch(function (err) {
        addWordBtn.disabled = false;
        newWordInput.value = word;
        alert("Kelime eklenemedi: " + (err.message || err) + "\n\nFirebase Console'da Realtime Database kurallarını kontrol edin (games altında read/write true olmalı).");
      });
  });

  newWordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addWordBtn.click();
  });

  startGameBtn.addEventListener("click", function () {
    wordsRef.once("value", function (snap) {
      const wordsObj = snap.val() || {};
      const words = Object.values(wordsObj);
      if (words.length === 0) {
        alert("En az bir kelime ekleyin.");
        return;
      }
      const { grid, wordPositions } = generateWordSearchGrid(words);
      gameStateRef.set({
        status: "playing",
        grid: grid,
        wordPositions: wordPositions,
        startedAt: Date.now()
      });
    });
  });

  resetGameBtn.addEventListener("click", function () {
    if (!confirm("Oyunu sıfırlamak istediğinize emin misiniz? Yeni tur için katılımcılar tekrar bekleyecek.")) return;
    gameStateRef.set({ status: "waiting" });
  });

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
})();
