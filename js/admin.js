(function () {
  var statusEl = document.getElementById("connection-status");
  function setStatus(text, isError) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.color = isError ? "#ef476f" : "#06d6a0";
    }
  }

  var fb = initFirebase();
  if (!fb) {
    setStatus("Firebase bağlantısı kurulamadı. Sayfayı sunucu üzerinden açın (npx serve .).", true);
    var btnAdd = document.getElementById("btn-add-word");
    if (btnAdd) btnAdd.addEventListener("click", function () {
      alert("Çalışmıyor: Sayfa dosya olarak açılmış (file://).\n\nProje klasöründe terminalde \"npx serve .\" yazın, sonra tarayıcıda http://localhost:3000/admin.html açın.");
    });
    return;
  }

  var db = fb.database();
  var ref = db.ref(YARISMA_REF);
  var wordsPath = typeof KELIME_HAVUZU_REF !== "undefined" ? KELIME_HAVUZU_REF : "yarisma/words";
  var wordsRef = db.ref(wordsPath);

  var statusEl = document.getElementById("connection-status");
  var listEl = document.getElementById("participant-list");
  var emptyEl = document.getElementById("empty-list");
  var wordListEl = document.getElementById("word-list");
  var emptyWordsEl = document.getElementById("empty-words");
  var inputWord = document.getElementById("input-word");
  var inputHint = document.getElementById("input-hint");
  var btnAddWord = document.getElementById("btn-add-word");


  ref.once("value")
    .then(function () {
      setStatus("Bağlı. Liste anlık güncellenir.", false);
    })
    .catch(function (err) {
      setStatus("Hata: " + (err.message || err) + " — Realtime Database kurallarını kontrol edin.", true);
    });

  ref.on("value", function (snap) {
    var data = snap.val() || {};
    var ids = Object.keys(data);
    listEl.innerHTML = "";
    emptyEl.style.display = ids.length ? "none" : "block";

    ids.forEach(function (id) {
      var p = data[id];
      var li = document.createElement("li");
      var name = (p && p.name) ? escapeHtml(p.name) : "—";
      var status = (p && p.status) === "approved" ? "approved" : "pending";
      li.innerHTML =
        '<span class="name">' + name + '</span>' +
        '<span class="badge badge-' + status + '">' + (status === "approved" ? "Onaylı" : "Beklemede") + '</span>';
      var actions = document.createElement("span");
      actions.className = "list-actions";
      if (status !== "approved") {
        var btnApprove = document.createElement("button");
        btnApprove.className = "btn btn-success";
        btnApprove.textContent = "Onayla";
        btnApprove.type = "button";
        btnApprove.onclick = function () {
          ref.child(id).update({ status: "approved" });
        };
        actions.appendChild(btnApprove);
      }
      var btnRemove = document.createElement("button");
      btnRemove.className = "btn btn-danger";
      btnRemove.textContent = "Sil";
      btnRemove.type = "button";
      btnRemove.onclick = function () {
        ref.child(id).remove();
      };
      actions.appendChild(btnRemove);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  });

  // Kelime havuzu dinle ve listele
  wordsRef.on("value", function (snap) {
    var data = snap.val() || {};
    var ids = Object.keys(data);
    wordListEl.innerHTML = "";
    emptyWordsEl.style.display = ids.length ? "none" : "block";
    ids.forEach(function (id) {
      var w = data[id];
      var word = (w && w.word) ? escapeHtml(w.word) : "—";
      var hint = (w && w.hint) ? escapeHtml(w.hint) : "—";
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="name"><strong>' + word + '</strong> <span style="color:#888; font-weight:normal;">(' + hint + ')</span></span>';
      var actions = document.createElement("span");
      actions.className = "list-actions";
      var btnDel = document.createElement("button");
      btnDel.className = "btn btn-danger";
      btnDel.textContent = "Sil";
      btnDel.type = "button";
      btnDel.onclick = function () {
        wordsRef.child(id).remove();
      };
      actions.appendChild(btnDel);
      li.appendChild(actions);
      wordListEl.appendChild(li);
    });
  });

  // Kelime ekle
  function addWord() {
    if (!inputWord || !wordsRef) {
      alert("Sayfa hazır değil. Yenileyin veya sunucu üzerinden açın (npx serve .).");
      return;
    }
    var word = (inputWord.value || "").trim();
    var hint = inputHint ? (inputHint.value || "").trim() : "";
    if (!word) {
      alert("Lütfen en az kelimeyi yazın.");
      return;
    }
    if (btnAddWord) btnAddWord.disabled = true;
    wordsRef.push({ word: word, hint: hint })
      .then(function () {
        if (inputWord) inputWord.value = "";
        if (inputHint) inputHint.value = "";
        if (inputWord) inputWord.focus();
        if (btnAddWord) btnAddWord.disabled = false;
      })
      .catch(function (err) {
        if (btnAddWord) btnAddWord.disabled = false;
        alert("Eklenemedi: " + (err.message || err) + "\n\nFirebase Console → Realtime Database → Kurallar: yarisma altında .write: true olmalı.");
      });
  }

  if (btnAddWord) btnAddWord.addEventListener("click", addWord);
  if (inputWord) inputWord.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addWord(); }
  });
  if (inputHint) inputHint.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addWord(); }
  });

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
})();
