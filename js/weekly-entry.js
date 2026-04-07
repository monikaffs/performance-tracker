document.addEventListener('DOMContentLoaded', () => {
    checkAuth((user, userData) => {
        document.getElementById('navUserName').textContent = userData.name || "Monika";
        
        // Load members for the dropdown
       
        
    });

    // Recording Listeners
    document.getElementById('startVid').addEventListener('click', () => startCapture(true));
    document.getElementById('startAud').addEventListener('click', () => startCapture(false));
    document.getElementById('stopMed').addEventListener('click', stopCapture);
    
    // Save Logic
    document.getElementById('entryForm').addEventListener('submit', handleEntrySave);
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

function toggleUI(isRec) {
    document.getElementById('recStatus').style.display = isRec ? 'block' : 'none';
    document.getElementById('stopMed').style.display = isRec ? 'inline-block' : 'none';
    document.getElementById('startVid').style.display = isRec ? 'none' : 'inline-block';
    document.getElementById('startAud').style.display = isRec ? 'none' : 'inline-block';
}

async function handleEntrySave(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = "Saving...";

    const entry = {
        week: parseInt(document.getElementById('weekNumber').value),
        memberId: document.getElementById('memberName').value,
        memberName: document.getElementById('memberName').options[document.getElementById('memberName').selectedIndex].text,
        attendance: document.getElementById('attendance').checked,
        thirtySec: document.getElementById('thirtySec').checked,
        referrals: parseInt(document.getElementById('referrals').value),
        visitors: parseInt(document.getElementById('visitors').value),
        oneToOne: parseInt(document.getElementById('oneToOne').value),
        tyfcb: parseFloat(document.getElementById('tyfcb').value),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('weekly_entries').add(entry);
        showToast("Record Saved!", "success");
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (err) {
        showToast("Error saving!", "error");
        btn.disabled = false;
    }
}

document.querySelectorAll('.toggle-box').forEach(box => {
    box.addEventListener('click', () => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
    });
});

document.getElementById('entryForm').addEventListener('keydown', function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
    }
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
