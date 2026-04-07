document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Auth Check
    checkAuth(async (user, userData) => {
        
        // ✅ Requirement #6: Show Monika's name and role in Navbar
        const nameEl = document.getElementById('navUserName');
        const roleEl = document.getElementById('navUserRole');
        if (nameEl) nameEl.textContent = userData.name || "User";
        if (roleEl) roleEl.textContent = userData.role ? userData.role.toUpperCase() : "MEMBER";

        // ✅ Update Dashboard Header
        const displayWeek = document.getElementById('displayWeek');
        
        // ✅ Load Settings (Current Week)
        try {
            const settingsDoc = await db.collection('settings').doc('config').get();
            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                if (displayWeek) displayWeek.textContent = settingsData.currentWeek || "1";
            }
        } catch (e) {
            console.error("Settings error:", e);
        }

        // ✅ Role-Based Dashboard Logic (Requirement #2)
        if (userData.role === 'admin') {
            // User is Admin (Monika) -> Show Stats
            const adminStats = document.getElementById('adminStats');
            if (adminStats) adminStats.style.display = 'grid';
            loadAdminStats();
        } else {
            // User is Member -> Hide Admin boxes, Show personal table
            const adminStats = document.getElementById('adminStats');
            if (adminStats) adminStats.style.display = 'none';
            
            // Logic for Member Performance Table
            loadMemberPerformance(user.uid);
        }
    });
});

// --- ADMIN LOGIC: Fetch Summary Stats ---
async function loadAdminStats() {
    try {
        // 1. Total Active Members
        const membersSnap = await db.collection('users').where('status', '==', 'active').get();
        const statMembers = document.getElementById('statMembers');
        if (statMembers) statMembers.textContent = membersSnap.size;

        // 2. Performance Stats from weekly_entries
        const entriesSnap = await db.collection('weekly_entries').get();
        let totalReferrals = 0;
        let attendanceCount = 0;
        
        entriesSnap.forEach(doc => {
            const data = doc.data();
            totalReferrals += (data.referrals || 0);
            if (data.attendance) attendanceCount++;
        });

        const statRef = document.getElementById('statReferrals');
        const statAtt = document.getElementById('statAttendance');

        if (statRef) statRef.textContent = totalReferrals;
        
        if (statAtt && entriesSnap.size > 0) {
            const avg = Math.round((attendanceCount / (entriesSnap.size)) * 100);
            statAtt.textContent = `${avg}%`;
        }

    } catch (error) {
        console.error("Error loading admin stats:", error);
    }
}

// --- MEMBER LOGIC: Load Individual Performance Table ---
async function loadMemberPerformance(uid) {
    // If you add a table to dashboard.html for members, this logic fills it
    const tableBody = document.getElementById('memberDataBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading your records...</td></tr>';

    try {
        const entriesSnap = await db.collection('weekly_entries')
            .where('memberId', '==', uid)
            .orderBy('weekNumber', 'desc')
            .get();

        if (entriesSnap.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records found.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        entriesSnap.forEach(doc => {
            const data = doc.data();
            const row = `
                <tr>
                    <td>Week ${data.weekNumber}</td>
                    <td>${data.attendance ? '✅' : '❌'}</td>
                    <td>${data.referrals || 0}</td>
                    <td>${data.oneToOne || 0}</td>
                    <td>${data.visitors || 0}</td>
                    <td style="font-weight:bold; color:var(--primary);">Calculated...</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Member data error:", error);
    }
}

// Global Logout function
async function logout() {
    try {
        await auth.signOut();
        localStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout failed", error);
        window.location.href = 'index.html';
    }
}