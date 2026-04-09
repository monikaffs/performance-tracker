
// Import Firebase via CDN (already in HTML)
const firebaseConfig = {
  apiKey: "AIzaSyAJjrSMRts29SGn4myP5viFXpNRD7962bA",
  authDomain: "mcm-tracker-6a3cc.firebaseapp.com",
  projectId: "mcm-tracker-6a3cc",
  storageBucket: "mcm-tracker-6a3cc.firebasestorage.app",
  messagingSenderId: "284372700866",
  appId: "1:284372700866:web:bdff04a00870f084b2755b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();

// AUTH CHECK (GLOBAL)

function checkAuth(callback) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // TRY CACHE FIRST
        let userData = JSON.parse(localStorage.getItem('userData'));

        if (userData && userData.uid === user.uid) {
            callback(user, userData);
            return;
        }

        // FIRST TIME ONLY
        const doc = await db.collection('users').doc(user.uid).get();
        userData = doc.exists ? doc.data() : { name: "User", role: "member" };

        //  SAVE CACHE
        localStorage.setItem('userData', JSON.stringify({
            ...userData,
            uid: user.uid
        }));

        callback(user, userData);
    });
}

// GLOBAL TOAST
function showToast(msg, type = 'success') {
    alert(msg);
}
