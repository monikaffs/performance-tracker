document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth and set Navbar Name
    checkAuth((user, userData) => {

        const navName = document.getElementById('navUserName');
        if (navName) navName.textContent = userData.name;

        const navRole = document.getElementById('navUserRole');
        if (navRole) navRole.textContent = (userData.role || 'member').toUpperCase();

        // 🔴 BLOCK NON-ADMINS
        if ((userData.role || 'member') !== 'admin') {
            alert("Access Denied: Admins only");
            window.location.href = 'dashboard.html';
            return;
        }

        // ✅ SHOW PAGE ONLY FOR ADMIN
        document.body.style.visibility = 'visible';

        // ✅ ONLY ADMIN CAN CONTINUE
        loadMembers();
    });

    // 2. Handle Form Submission
    const memberForm = document.getElementById('memberForm');
    if (memberForm) {
        memberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            saveMember();
        });
    }
});

// --- LOAD MEMBERS ---
async function loadMembers() {
    const listBody = document.getElementById('membersList');
    
    try {
        const snapshot = await db.collection('users').orderBy('name').get();
        
        // Fix #3: If database is empty, add dummy members automatically
        if (snapshot.empty) {
            console.log("Database empty. Seeding dummy members...");
            await seedDummyMembers();
            loadMembers(); // Reload after seeding
            return;
        }

        listBody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = `
                <tr class="animate-fade">
                    <td>
                        <div style="font-weight:600; color:#fff;">${data.name}</div>
                        <div style="font-size:0.7rem; color:var(--text-dim);">${data.email}</div>
                    </td>
                    <td>
                        <span style="padding:4px 10px; border-radius:20px; font-size:0.7rem; font-weight:600; 
                        background:${data.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; 
                        color:${data.status === 'active' ? '#10b981' : '#f59e0b'}; border:1px solid currentColor;">
                            ${data.status.toUpperCase()}
                        </span>
                    </td>
                    <td style="font-size:0.8rem; color:var(--text-dim);">
                        ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style="text-align: right;">
                        <button onclick="deleteMember('${doc.id}')" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; padding:5px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
            listBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error loading members:", error);
        showToast("Error loading members", "error");
    }
}

// --- SAVE NEW MEMBER ---
async function saveMember() {
    const name = document.getElementById('mName').value;
    const email = document.getElementById('mEmail').value;
    const status = document.getElementById('mStatus').value;

    try {
        await db.collection('users').add({
            name,
            email,
            status,
            role: 'member', // Default role
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Also add to 'members' collection for the dropdowns in other forms
        await db.collection('members').add({ name, status });

        showToast("Member added successfully!");
        closeModal();
        loadMembers();
    } catch (error) {
        showToast("Error adding member", "error");
    }
}

// --- DELETE MEMBER ---
async function deleteMember(id) {
    if (confirm("Remove this member from the committee?")) {
        try {
            await db.collection('users').doc(id).delete();
            showToast("Member removed");
            loadMembers();
        } catch (error) {
            showToast("Delete failed", "error");
        }
    }
}

// --- MODAL CONTROLS ---
function openModal() {
    document.getElementById('memberModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('memberModal').style.display = 'none';
}

// --- SEED DUMMY DATA (Fix #3) ---
async function seedDummyMembers() {
    const dummies = [
        { name: "Rahul Sharma", email: "rahul@bni.com", status: "active", role: "member" },
        { name: "Anjali Gupta", email: "anjali@bni.com", status: "active", role: "member" },
        { name: "Vikram Singh", email: "vikram@bni.com", status: "active", role: "member" },
        { name: "Priya Mehta", email: "priya@bni.com", status: "active", role: "member" },
        { name: "Sameer Khan", email: "sameer@bni.com", status: "inactive", role: "member" }
    ];

    for (const d of dummies) {
        await db.collection('users').add({
            ...d,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('members').add({ name: d.name, status: d.status });
    }
}

function logout() {
    // auth.signOut().then(() => window.location.href = 'index.html'); // will delete this line
    auth.signOut().then(() => {
    localStorage.removeItem('userData'); // clear cache
    window.location.href = 'index.html';
});
}