// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD60cktX5bdh0oVUif1nR41r8htlQEtgfg",
  authDomain: "bni-mcm-tracker.firebaseapp.com",
  projectId: "bni-mcm-tracker",
  storageBucket: "bni-mcm-tracker.firebasestorage.app",
  messagingSenderId: "457959291384",
  appId: "1:457959291384:web:0e6331f6fa04bb5c9a3e0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
// ... Your Firebase Initialization Keys ...


// THE CORE AUTH CHECKER (Fix #5, #6)
const checkAuth = (callback) => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            db.collection('users').doc(user.uid).get().then((doc) => {
                const userData = doc.exists ? doc.data() : { name: "User", role: "member" };
                
                // Update Navbar Elements globally
                const nameEl = document.getElementById('navUserName');
                const roleEl = document.getElementById('navUserRole');
                if (nameEl) nameEl.textContent = userData.name;
                if (roleEl) roleEl.textContent = userData.role;

                callback(user, userData);
            }).catch(err => console.error("Auth error:", err));
        } else {
            window.location.href = 'index.html';
        }
    });
};

// Global Toast Notification
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `position:fixed; bottom:20px; right:20px; padding:15px 25px; border-radius:12px; background:${type==='success'?'#10b981':'#e63946'}; color:white; z-index:9999; animation: slideIn 0.3s ease;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


// // FAKE FIREBASE FOR DEMO MODE
// const auth = {
//     onAuthStateChanged: (callback) => {
//         // Automatically tell the app we are logged in as an Admin
//         callback({ uid: "demo-user-123" });
//     },
//     signOut: () => {
//         window.location.href = 'index.html';
//         return Promise.resolve();
//     },
//     signInWithEmailAndPassword: (email, password) => {
//         // Let any login pass
//         return Promise.resolve({ user: { uid: "demo-user-123" } });
//     }
// };

// const db = {
//     collection: (name) => ({
//         doc: (id) => ({
//             get: () => Promise.resolve({
//                 exists: true,
//                 data: () => {
//                     if (name === 'users') return { name: "Demo Admin", role: "admin", status: "active" };
//                     if (name === 'settings') return { currentWeek: 1, totalWeeks: 25, scoring: {} };
//                     return {};
//                 }
//             }),
//             set: () => Promise.resolve(),
//             update: () => Promise.resolve()
//         }),
//         where: () => ({
//             get: () => Promise.resolve({ empty: true, size: 0, forEach: () => {} }),
//             orderBy: () => ({ get: () => Promise.resolve({ empty: true, forEach: () => {} }) })
//         }),
//         orderBy: () => ({ 
//             get: () => Promise.resolve({ empty: true, forEach: () => {} }) 
//         }),
//         add: () => Promise.resolve()
//     })
// };

// const storage = {
//     ref: () => ({ child: () => ({ put: () => Promise.resolve(), getDownloadURL: () => Promise.resolve("demo-url") }) })
// };

// // Global helper for the bypass
// const checkAuth = (callback) => {
//     callback({ uid: "demo-user" }, { name: "Demo Admin", role: "admin", status: "active" });
// };

// function showToast(message, type = 'success') {
//     alert(message); // Simple alert instead of toast for demo
// }