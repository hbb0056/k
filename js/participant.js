(function () {
  var fb = initFirebase();
  if (!fb) {
    showError("Firebase bağlantısı kurulamadı. Sayfayı sunucu üzerinden açın (npx serve .).");
    return;
  }

  var db = fb.database();
  var ref = db.ref(YARISMA_REF);
  var gameRef = db.ref(typeof YARISMA_GAME_REF !== "undefined" ? YARISMA_GAME_REF : "yarisma/currentGame");

  var errorEl = document.getElementById("error-msg");
  var screenJoin = document.getElementById("screen-join");
  var screenWaiting = document.getElementById("screen-waiting");
  var screenApproved = document.getElementById("screen-approved");
  var inputName = document.getElementById("input-name");
  var btnJoin = document.getElementById("btn-join");
  var gameWait = document.getElementById("game-wait");
  var gamePlaying = document.getElementById("game-playing");
  var gameEnded = document.getElementById("game-ended");
  var wordDisplay = document.getElementById("word-display");
  var inputGuess = document.getElementById("input-guess");
  var btnGuess = document.getElementById("btn-guess");
  var gameResultText = document.getElementById("game-result-text");

  var myId = localStorage.getItem("yarisma_id");
  var revealTimer = null;

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
    }
  }

  function hideError() {
    if (errorEl) errorEl.style.display = "none";
  }

  function showScreen(id) {
    screenJoin.style.display = id === "join" ? "block" : "none";
    screenWaiting.style.display = id === "waiting" ? "block" : "none";
    screenApproved.style.display = id === "approved" ? "block" : "none";
  }

  function onStatusChange(snap) {
    if (!snap.exists()) {
      localStorage.removeItem("yarisma_id");
      localStorage.removeItem("yarisma_name");
      showScreen("join");
      return;
    }
    var data = snap.val();
    if (data.status === "approved") {
      showScreen("approved");
      startGameListener();
    } else {
      showScreen("waiting");
    }
  }

  function startGameListener() {
    gameRef.on("value", function (snap) {
      var g = snap.val() || {};
      var status = g.status || "idle";
      if (gameWait) gameWait.style.display = "none";
      if (gamePlaying) gamePlaying.style.display = "none";
      if (gameEnded) gameEnded.style.display = "none";

      if (status === "playing") {
        if (gameWait) gameWait.style.display = "none";
        if (gamePlaying) gamePlaying.style.display = "block";
        if (gameEnded) gameEnded.style.display = "none";
        runReveal(g);
      } else if (status === "ended") {
        if (gameWait) gameWait.style.display = "none";
        if (gamePlaying) gamePlaying.style.display = "none";
        if (gameEnded) gameEnded.style.display = "block";
        showResult(g);
      } else {
        if (gameWait) gameWait.style.display = "block";
      }
    });
  }

  function runReveal(g) {
    var word = g.word || "";
    var startedAt = g.startedAt || 0;
    var intervalSec = g.revealIntervalSeconds || 2;
    if (revealTimer) clearInterval(revealTimer);
    function update() {
      var elapsed = Date.now() - startedAt;
      var count = Math.min(word.length, Math.floor(elapsed / (intervalSec * 1000)));
      var visible = word.substring(0, count);
      var hidden = "";
      for (var i = count; i < word.length; i++) hidden += " _";
      if (wordDisplay) wordDisplay.textContent = visible + hidden;
    }
    update();
    revealTimer = setInterval(update, 500);
  }

  function showResult(g) {
    if (revealTimer) clearInterval(revealTimer);
    revealTimer = null;
    var correctWord = (g.word || "").trim();
    var myGuess = myId && g.guesses && g.guesses[myId] ? String(g.guesses[myId]).trim() : "";
    function norm(s) { return (s || "").toLowerCase().replace(/\s/g, ""); }
    var isCorrect = correctWord && norm(myGuess) === norm(correctWord);
    if (gameEnded) {
      gameEnded.className = isCorrect ? "msg msg-success" : "msg msg-error";
      gameEnded.style.display = "block";
    }
    if (gameResultText) {
      if (isCorrect) gameResultText.innerHTML = "Doğru!";
      else gameResultText.innerHTML = "Yanlış. Doğru kelime: <strong>" + (correctWord || "—") + "</strong>";
    }
  }

  if (myId) {
    ref.child(myId).on("value", onStatusChange);
    ref.child(myId).once("value", function (snap) {
      if (!snap.exists()) {
        myId = null;
        localStorage.removeItem("yarisma_id");
        localStorage.removeItem("yarisma_name");
        showScreen("join");
      } else if (snap.val().status === "approved") {
        startGameListener();
      }
    });
  } else {
    showScreen("join");
  }

  btnJoin.addEventListener("click", function () {
    var name = (inputName.value || "").trim();
    if (!name) {
      showError("Lütfen adınızı yazın.");
      return;
    }
    hideError();
    btnJoin.disabled = true;
    ref.push({
      name: name,
      status: "pending",
      joinedAt: Date.now()
    }).then(function (newRef) {
      myId = newRef.key;
      localStorage.setItem("yarisma_id", myId);
      localStorage.setItem("yarisma_name", name);
      showScreen("waiting");
      ref.child(myId).on("value", onStatusChange);
    }).catch(function (err) {
      showError("Kayıt yapılamadı: " + (err.message || err) + ". Firebase kurallarında yarisma yazma izni olmalı.");
    }).finally(function () {
      btnJoin.disabled = false;
    });
  });

  if (btnGuess) btnGuess.addEventListener("click", submitGuess);
  if (inputGuess) inputGuess.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submitGuess(); }
  });

  function submitGuess() {
    if (!myId || !gameRef || !inputGuess) return;
    var guess = (inputGuess.value || "").trim();
    gameRef.child("guesses").child(myId).set(guess);
    inputGuess.value = "";
  }
})();
