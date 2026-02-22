/**
 * Firebase yapılandırması - Online uygulama
 */
const firebaseConfig = {
  apiKey: "AIzaSyBwzlkq9LZYCM_sk_M6tKfx5jme37Zw0u4",
  authDomain: "kelime-avi-bec9f.firebaseapp.com",
  databaseURL: "https://kelime-avi-bec9f-default-rtdb.firebaseio.com",
  projectId: "kelime-avi-bec9f",
  storageBucket: "kelime-avi-bec9f.firebasestorage.app",
  messagingSenderId: "154681825331",
  appId: "1:154681825331:web:7c8fec41e0d8ee2664eb46"
};

// Uygulama başlat (Firebase SDK yüklendikten sonra çağrılacak)
function initFirebase() {
  if (typeof firebase === "undefined") return null;
  try {
    firebase.initializeApp(firebaseConfig);
    return firebase;
  } catch (e) {
    if (e.code === "app/duplicate-app" || (e.message && e.message.indexOf("already exists") !== -1)) return firebase;
    console.error("Firebase init hatası:", e);
    return null;
  }
}

// Veritabanı yolları
const YARISMA_REF = "yarisma/participants";
const KELIME_HAVUZU_REF = "yarisma/words";
