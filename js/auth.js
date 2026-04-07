// document.addEventListener('DOMContentLoaded', () => {
//     const loginForm = document.getElementById('loginForm');
//     const loginBtn = document.getElementById('loginBtn');
//     const loginLoader = document.getElementById('loginLoader');
//     const errorMsg = document.getElementById('errorMsg');

//     if (loginForm) {
//         loginForm.addEventListener('submit', async (e) => {
//             e.preventDefault();
            
//             // UI State: Loading
//             loginBtn.disabled = true;
//             loginLoader.style.display = 'block';
//             errorMsg.textContent = '';

//             const email = document.getElementById('email').value;
//             const password = document.getElementById('password').value;

//             try {
//                 // 1. Sign in with Firebase Auth
//                 const userCredential = await auth.signInWithEmailAndPassword(email, password);
//                 const user = userCredential.user;

//                 // 2. Fetch User Role from Firestore 'users' collection
//                 const userDoc = await db.collection('users').doc(user.uid).get();

//                 if (userDoc.exists) {
//                     const userData = userDoc.data();
                    
//                     // Check if user is active
//                     if (userData.status === 'inactive') {
//                         await auth.signOut();
//                         throw new Error("Your account is deactivated. Contact Admin.");
//                     }

//                     // 3. Store role locally for quick UI checks (Optional)
//                     localStorage.setItem('userRole', userData.role);
//                     localStorage.setItem('userName', userData.name);

//                     // 4. Redirect to Dashboard
//                     window.location.href = 'dashboard.html';
//                 } else {
//                     // Handle case where auth user exists but firestore doc doesn't
//                     await auth.signOut();
//                     throw new Error("User profile not found in database.");
//                 }

//             } catch (error) {
//                 console.error("Login Error:", error);
//                 errorMsg.textContent = error.message;
//                 loginBtn.disabled = false;
//                 loginLoader.style.display = 'none';
//             }
//         });
//     }
// });

// // Logout function (to be used in navbars)
// async function logout() {
//     try {
//         await auth.signOut();
//         localStorage.clear();
//         window.location.href = 'index.html';
//     } catch (error) {
//         console.error("Logout Error:", error);
//     }
// }

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Just go straight to dashboard
            window.location.href = 'dashboard.html';
        });
    }
});

function logout() {
    window.location.href = 'index.html';
}

// Inside your login form listener in auth.js
const fullName = document.getElementById('fullName').value;
const email = document.getElementById('email').value;
const role = document.querySelector('input[name="userRole"]:checked').value;

// Save to localStorage so it appears instantly without waiting for database
localStorage.setItem('userName', fullName);
localStorage.setItem('userRole', role);

// If using Firebase, update the profile:
// user.updateProfile({ displayName: fullName });