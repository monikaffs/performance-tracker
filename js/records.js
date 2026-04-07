let userRole = 'member';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth((user, userData) => {
        userRole = userData.role;
        
        // Hide Admin columns if not authorized
        if (userRole !== 'admin') {
            const adminOnlyElements = document.querySelectorAll('.admin-only');
            adminOnlyElements.forEach(el => el.style.display = 'none');
        }

        setupFilters();
        loadRecords(); // Initial load
    });

    // Listen for filter changes
    document.getElementById('filterWeek').addEventListener('change', loadRecords);
    document.getElementById('filterMember').addEventListener('change', loadRecords);
});

async function setupFilters() {
    const weekSelect = document.getElementById('filterWeek');
    const memberSelect = document.getElementById('filterMember');

    // 1. Generate Weeks 1-25
    for (let i = 1; i <= 25; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Week ${i}`;
        weekSelect.appendChild(opt);
    }

    // 2. Load Members for Filter
    const membersSnap = await db.collection('members').orderBy('name').get();
    membersSnap.forEach(doc => {
        let opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = doc.data().name;
        memberSelect.appendChild(opt);
    });
}

async function loadRecords() {
    const weekFilter = document.getElementById('filterWeek').value;
    const memberFilter = document.getElementById('filterMember').value;
    
    const desktopBody = document.getElementById('desktopRecordsBody');
    const mobileContainer = document.getElementById('mobileRecords');
    const emptyState = document.getElementById('emptyState');

    desktopBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading...</td></tr>';
    mobileContainer.innerHTML = '';

    try {
        let query = db.collection('weekly_entries').orderBy('weekNumber', 'desc');

        // Apply filters in Firestore if not "all"
        if (weekFilter !== 'all') {
            query = query.where('weekNumber', '==', parseInt(weekFilter));
        }
        if (memberFilter !== 'all') {
            query = query.where('memberId', '==', memberFilter);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            desktopBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        desktopBody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;

            // --- Desktop Row ---
            const row = `
                <tr>
                    <td>W${data.weekNumber}</td>
                    <td style="font-weight:600;">${data.memberName}</td>
                    <td>${data.attendance ? '<i class="fas fa-check-circle" style="color:#10b981;"></i>' : '<i class="fas fa-times-circle" style="color:#e63946;"></i>'}</td>
                    <td>${data.referrals || 0}</td>
                    <td>${data.oneToOneCount || 0}</td>
                    <td>${data.visitorsInvited || 0}</td>
                    <td>${data.mediaUrl ? '<i class="fas fa-play-circle" style="color:#a855f7;"></i>' : '-'}</td>
                    <td class="admin-only" style="display: ${userRole === 'admin' ? 'table-cell' : 'none'}">
                        <button onclick="deleteEntry('${id}')" class="btn btn-secondary btn-small" style="color:#ff4d4d;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            desktopBody.innerHTML += row;

            // --- Mobile Card ---
            const card = `
                <div class="glass-card record-card animate-fade">
                    <div class="record-header">
                        <div>
                            <div style="font-weight:700; font-size:1.1rem;">${data.memberName}</div>
                            <div style="color:var(--text-muted); font-size:0.8rem;">Week ${data.weekNumber} • ${data.date}</div>
                        </div>
                        ${data.attendance ? '<span class="badge badge-active">Present</span>' : '<span class="badge badge-inactive">Absent</span>'}
                    </div>
                    <div class="record-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Referrals</span>
                            <span class="metric-value">${data.referrals || 0}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">1-to-1</span>
                            <span class="metric-value">${data.oneToOneCount || 0}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Visitors</span>
                            <span class="metric-value">${data.visitorsInvited || 0}</span>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);">
                        ${data.mediaUrl ? '<p><i class="fas fa-paperclip"></i> Media Attached</p>' : ''}
                        ${data.remarks ? `<p><i class="fas fa-comment-alt"></i> ${data.remarks}</p>` : ''}
                    </div>
                    ${userRole === 'admin' ? `
                        <div class="admin-actions">
                             <button onclick="deleteEntry('${id}')" class="btn btn-secondary btn-small" style="color:#ff4d4d; border-color:#ff4d4d33;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            mobileContainer.innerHTML += card;
        });

    } catch (error) {
        console.error("Error loading records:", error);
        showToast("Error loading records", "error");
    }
}

async function deleteEntry(id) {
    if (confirm("Permanently delete this record? This will also remove associated scores.")) {
        try {
            // Check if media exists and delete from storage if needed
            const doc = await db.collection('weekly_entries').doc(id).get();
            const data = doc.data();
            
            if (data.mediaUrl) {
                // Optional: Delete from storage logic here if required
                // storage.refFromURL(data.mediaUrl).delete();
            }

            await db.collection('weekly_entries').doc(id).delete();
            showToast("Record deleted successfully");
            loadRecords(); // Refresh UI
        } catch (error) {
            console.error("Delete error:", error);
            showToast("Failed to delete record", "error");
        }
    }
}