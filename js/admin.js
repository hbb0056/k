(function () {
  var fb = initFirebase();
  if (!fb) {
    setStatus("Firebase bağlantısı kurulamadı. Sayfayı sunucu üzerinden açın (npx serve .).", true);
    return;
  }

  var db = fb.database();
  var ref = db.ref(YARISMA_REF);

  var statusEl = document.getElementById("connection-status");
  var listEl = document.getElementById("participant-list");
  var emptyEl = document.getElementById("empty-list");

  function setStatus(text, isError) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.color = isError ? "#ef476f" : "#06d6a0";
    }
  }

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

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
})();
