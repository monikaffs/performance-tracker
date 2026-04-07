document.addEventListener('DOMContentLoaded', () => {
    checkAuth(async (user, userData) => {
        if (userData.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }
        
        await loadCurrentSettings();
        
        // Listen for changes in Total Weeks to update the Current Week dropdown
        document.getElementById('totalWeeks').addEventListener('input', (e) => {
            updateWeekDropdown(parseInt(e.target.value) || 25);
        });

        // Form submission
        document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    });
});

// Load settings from Firestore
async function loadCurrentSettings() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // Set Total Weeks
            document.getElementById('totalWeeks').value = data.totalWeeks || 25;
            updateWeekDropdown(data.totalWeeks || 25);
            
            // Set Current Week
            document.getElementById('currentWeek').value = data.currentWeek || 1;
            
            // Set Scoring Weights
            const s = data.scoring;
            if (s) {
                document.getElementById('score_attendance').value = s.attendance;
                document.getElementById('score_referral').value = s.referral;
                document.getElementById('score_visitor').value = s.visitor;
                document.getElementById('score_oneToOne').value = s.oneToOne;
                document.getElementById('score_testimonial').value = s.testimonial;
                document.getElementById('score_thirtySec').value = s.thirtySec;
                document.getElementById('score_specificAsk').value = s.specificAsk;
                document.getElementById('score_task').value = s.task;
            }
        } else {
            // If doc doesn't exist, just initialize the dropdown with default 25
            updateWeekDropdown(25);
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        showToast("Error loading settings", "error");
    }
}

// Dynamically update the Current Week dropdown based on Total Weeks
function updateWeekDropdown(total) {
    const select = document.getElementById('currentWeek');
    const currentValue = select.value;
    select.innerHTML = '';
    
    for (let i = 1; i <= total; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Week ${i}`;
        select.appendChild(opt);
    }
    
    // Restore value if it's still within range
    if (currentValue <= total) {
        select.value = currentValue;
    }
}

// Save all settings to Firestore
async function saveSettings(e) {
    e.preventDefault();
    const btn = document.getElementById('saveSettingsBtn');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';

    const settingsData = {
        totalWeeks: parseInt(document.getElementById('totalWeeks').value),
        currentWeek: parseInt(document.getElementById('currentWeek').value),
        scoring: {
            attendance: parseInt(document.getElementById('score_attendance').value),
            referral: parseInt(document.getElementById('score_referral').value),
            visitor: parseInt(document.getElementById('score_visitor').value),
            oneToOne: parseInt(document.getElementById('score_oneToOne').value),
            testimonial: parseInt(document.getElementById('score_testimonial').value),
            thirtySec: parseInt(document.getElementById('score_thirtySec').value),
            specificAsk: parseInt(document.getElementById('score_specificAsk').value),
            task: parseInt(document.getElementById('score_task').value)
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('settings').doc('config').set(settingsData, { merge: true });
        showToast("Settings updated successfully!");
    } catch (error) {
        console.error("Save Settings Error:", error);
        showToast("Failed to save settings", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> UPDATE GLOBAL SETTINGS';
    }
}