/**
 * Firebase yapılandırması
 * Bu dosyadaki değerleri kendi Firebase projenizden alıp doldurun.
 * Firebase Console: https://console.firebase.google.com
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

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
}

// Tek oda için sabit oyun ID (Realtime Database path)
const GAME_ID = "main";
