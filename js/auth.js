document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // 🔐 Login with Firebase Auth
            const userCred = await auth.signInWithEmailAndPassword(email, password);
            const user = userCred.user;

            // 📥 Get user data from Firestore
            const doc = await db.collection('users').doc(user.uid).get();

            if (!doc.exists) {
                alert("User not registered in system");
                return;
            }

            const userData = doc.data();

            // ✏️ Update name only (optional)
            await db.collection('users').doc(user.uid).set({
                name: fullName
            }, { merge: true });

            // 🚀 Redirect
            window.location.href = 'dashboard.html';

        } catch (err) {
            alert(err.message);
        }
    });
});

function logout() {
    auth.signOut();
    window.location.href = "index.html";
}
