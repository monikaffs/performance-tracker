document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginLoader = document.getElementById('loginLoader');
    const errorMsg = document.getElementById('errorMsg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 1. Get UI Elements for loading state
            if(loginBtn) loginBtn.disabled = true;
            if(loginLoader) loginLoader.style.display = 'block';
            if(errorMsg) errorMsg.textContent = '';

            // 2. Capture Form Data (Monika's Requirement #5)
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.querySelector('input[name="userRole"]:checked').value;

            try {
                // 3. Sign in with Firebase Auth
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 4. Update/Check Firestore Record
                // We ensure the user document has the name provided in the login form
                await db.collection('users').doc(user.uid).set({
                    name: fullName,
                    email: email,
                    role: role,
                    status: 'active',
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // 5. Store data locally (Requirement #6 - Instant Name Display)
                localStorage.setItem('userName', fullName);
                localStorage.setItem('userRole', role);

                // 6. Success! Redirect to Dashboard
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error("Login Error:", error);
                
                // If user doesn't exist in Auth, try to Register them 
                // (Optional: Remove if you want strictly invite-only)
                if (error.code === 'auth/user-not-found') {
                    try {
                        const newUser = await auth.createUserWithEmailAndPassword(email, password);
                        await db.collection('users').doc(newUser.user.uid).set({
                            name: fullName,
                            email: email,
                            role: role,
                            status: 'active',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        localStorage.setItem('userName', fullName);
                        localStorage.setItem('userRole', role);
                        window.location.href = 'dashboard.html';
                        return;
                    } catch (regError) {
                        errorMsg.textContent = regError.message;
                    }
                } else {
                    errorMsg.textContent = error.message;
                }

                if(loginBtn) loginBtn.disabled = false;
                if(loginLoader) loginLoader.style.display = 'none';
            }
        });
    }
});

/**
 * Global Logout Function
 * Clears local storage and redirects to login
 */
async function logout() {
    try {
        await auth.signOut();
        localStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout Error:", error);
        // Fallback redirect
        window.location.href = 'index.html';
    }
}