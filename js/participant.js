(function () {
  var fb = initFirebase();
  if (!fb) {
    showError("Firebase bağlantısı kurulamadı. Sayfayı sunucu üzerinden açın (npx serve .).");
    return;
  }

  var db = fb.database();
  var ref = db.ref(YARISMA_REF);

  var errorEl = document.getElementById("error-msg");
  var screenJoin = document.getElementById("screen-join");
  var screenWaiting = document.getElementById("screen-waiting");
  var screenApproved = document.getElementById("screen-approved");
  var inputName = document.getElementById("input-name");
  var btnJoin = document.getElementById("btn-join");

  var myId = localStorage.getItem("yarisma_id");

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
    } else {
      showScreen("waiting");
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
})();
