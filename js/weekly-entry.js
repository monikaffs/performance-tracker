
console.log("weekly-entry.js loaded");


document.addEventListener('DOMContentLoaded', () => {
    checkAuth((user, userData) => {
        // document.getElementById('navUserName').textContent = userData.name || "Monika";
        //document.getElementById('prdEntryForm').addEventListener('submit', handleEntrySave);
        document.getElementById('navUserName').textContent = userData.name || "User";
        document.getElementById('prdEntryForm').addEventListener('submit', handleEntrySave);
        
        // Load members for the dropdown
        loadMembersDropdown();
        
    });

    // Recording Listeners
    document.getElementById('startVid').addEventListener('click', () => startCapture(true));
    document.getElementById('startAud').addEventListener('click', () => startCapture(false));
    document.getElementById('stopMed').addEventListener('click', stopCapture);
    
    // Save Logic
    // document.getElementById('entryForm').addEventListener('submit', handleEntrySave);
    // document.getElementById('prdEntryForm').addEventListener('submit', handleEntrySave);
});



// --- MEDIA RECORDING ---
let recorder;
let chunks = [];
let localStream;

async function startCapture(video) {
    chunks = [];
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
        
        if (video) {
            const v = document.getElementById('videoPreview');
            v.srcObject = localStream;
            v.style.display = 'block';
        }

        recorder = new MediaRecorder(localStream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: video ? 'video/webm' : 'audio/webm' });
            const url = URL.createObjectURL(blob);
            if (video) {
                document.getElementById('videoPreview').srcObject = null;
                document.getElementById('videoPreview').src = url;
            } else {
                const a = document.getElementById('audioPreview');
                a.src = url;
                a.style.display = 'block';
            }
        };

        recorder.start();
        toggleUI(true);
    } catch (err) {
        alert("Please allow camera/mic access!");
    }
}

function stopCapture() {
    if (recorder) recorder.stop();
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
    }
    toggleUI(false);
}


/*
function toggleUI(isRec) {
    document.getElementById('recStatus').style.display = isRec ? 'block' : 'none';
    document.getElementById('stopMed').style.display = isRec ? 'inline-block' : 'none';
    document.getElementById('startVid').style.display = isRec ? 'none' : 'inline-block';
    document.getElementById('startAud').style.display = isRec ? 'none' : 'inline-block';
}
*/

async function handleEntrySave(e) {
    e.preventDefault();

    const btn = document.getElementById('saveBtn');

    // Disable only after validation passes
    btn.disabled = true;
    btn.innerHTML = "Saving...";

    // 🔍 VALIDATION
    const memberSelect = document.getElementById('memberName');
    const week = parseInt(document.getElementById('weekNumber').value);

    if (!memberSelect.value) {
        showToast("⚠️ Please select a member", "error");
        btn.disabled = false;
        btn.innerHTML = "SAVE WEEKLY RECORD";
        return;
    }

    if (!week || week < 1) {
        showToast("⚠️ Invalid week selected", "error");
        btn.disabled = false;
        btn.innerHTML = "SAVE WEEKLY RECORD";
        return;
    }

    // Numeric validations
    const referrals = parseInt(document.getElementById('referrals').value) || 0;
    const visitors = parseInt(document.getElementById('visitors').value) || 0;
    const oneToOne = parseInt(document.getElementById('oneToOne').value) || 0;

    if (referrals < 0 || visitors < 0 || oneToOne < 0) {
        showToast("⚠️ Values cannot be negative", "error");
        btn.disabled = false;
        btn.innerHTML = "SAVE WEEKLY RECORD";
        return;
    }


    // const memberSelect = document.getElementById('memberName'); // to be removed
    
    const entry = {
    weekNumber: week,
    memberId: memberSelect.value,
    memberName: memberSelect.options[memberSelect.selectedIndex].text,

    attendance: document.getElementById('attendance').checked,
    referrals: referrals,
    visitorsInvited: visitors,
    oneToOneCount: oneToOne,

    testimonialSubmitted: document.getElementById('testimonial').checked,
    thirtySecOnTime: document.getElementById('thirtySec').checked,
    specificAskGiven: document.getElementById('specificAsk').checked,
    specificTaskCompleted: document.getElementById('taskDone').checked,

    remarks: document.getElementById('remarks').value || "",

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

    try {
        // 🔍 CHECK DUPLICATE ENTRY
        const existing = await db.collection('weekly_entries')
            .where('memberId', '==', entry.memberId)
            .where('weekNumber', '==', entry.weekNumber)
            .get();

        if (!existing.empty) {
            alert("⚠️ Entry already exists for this member in this week!");
            
            btn.disabled = false;
            btn.innerHTML = "SAVE WEEKLY RECORD";
            return;
        }

        // ✅ SAVE IF NO DUPLICATE
        await db.collection('weekly_entries').add(entry);

        alert("✅ Record Saved!");

        setTimeout(() => window.location.href = 'dashboard.html', 1000);

    } catch (err) {
        console.error(err);
        alert("❌ Error saving record");

        btn.disabled = false;
        btn.innerHTML = "SAVE WEEKLY RECORD";
    }
}


async function loadMembersDropdown() {
    const select = document.getElementById('memberName');

    // Default option
    select.innerHTML = `<option value="">Select Member</option>`;

    try {
        const snapshot = await db.collection('members').get();

        if (snapshot.empty) {
            console.warn("No members found");
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.name;

            select.appendChild(option);
        });

        console.log("Members loaded");

    } catch (error) {
        console.error("Error loading members:", error);
    }
}





document.querySelectorAll('.toggle-box').forEach(box => {
    box.addEventListener('click', () => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
    });
});


document.querySelectorAll('.glass-card.clickable').forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== "INPUT") {
            const inputs = card.querySelectorAll('input[type="number"]');
            inputs.forEach(input => input.focus());
        }
    });
});

document.getElementById('prdEntryForm').addEventListener('keydown', (e) => {
    if (e.key === "Enter") e.preventDefault();
});

document.getElementById('vRec').addEventListener('click', () => startCapture(true));
document.getElementById('aRec').addEventListener('click', () => startCapture(false));
document.getElementById('sRec').addEventListener('click', stopCapture);

function toggleUI(isRec) {
    document.getElementById('status').style.display = isRec ? 'block' : 'none';
    document.getElementById('sRec').style.display = isRec ? 'inline-block' : 'none';
    document.getElementById('vRec').style.display = isRec ? 'none' : 'inline-block';
    document.getElementById('aRec').style.display = isRec ? 'none' : 'inline-block';
}

document.getElementById('prdEntryForm').addEventListener('keydown', (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
    }
});

const nameInput = document.getElementById('memberName');

nameInput.addEventListener('input', () => {
    localStorage.setItem('memberName', nameInput.value);
});

window.addEventListener('load', () => {
    nameInput.value = localStorage.getItem('memberName') || "";
});
