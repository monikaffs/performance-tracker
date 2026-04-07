document.addEventListener('DOMContentLoaded', () => {
    checkAuth(async (user, userData) => {
        if (userData.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }
        
        const settings = await loadAnalyticsSettings();
        loadAnalyticsData(settings.scoring);
    });
});

async function loadAnalyticsSettings() {
    const doc = await db.collection('settings').doc('config').get();
    return doc.exists ? doc.data() : {
        scoring: { attendance: 5, referral: 3, visitor: 5, oneToOne: 3, testimonial: 2, thirtySec: 3, specificAsk: 4, task: 5 }
    };
}

async function loadAnalyticsData(weights) {
    try {
        const snapshot = await db.collection('weekly_entries').get();
        const memberScores = {}; // Map memberId -> { name, totalScore }
        const weeklyTrends = {}; // Map weekNum -> { referrals, visitors }

        snapshot.forEach(doc => {
            const data = doc.data();
            const mId = data.memberId;
            const week = data.weekNumber;

            // 1. Calculate Score for this entry
            let score = 0;
            if (data.attendance) score += weights.attendance;
            score += (data.referrals || 0) * weights.referral;
            score += (data.visitorsInvited || 0) * weights.visitor;
            score += (data.oneToOneCount || 0) * weights.oneToOne;
            if (data.testimonialSubmitted) score += weights.testimonial;
            if (data.thirtySecOnTime) score += weights.thirtySec;
            if (data.specificAskGiven) score += weights.specificAsk;
            if (data.specificTaskCompleted) score += weights.task;

            // 2. Aggregate Member Leaderboard
            if (!memberScores[mId]) {
                memberScores[mId] = { name: data.memberName, totalScore: 0 };
            }
            memberScores[mId].totalScore += score;

            // 3. Aggregate Weekly Trends
            if (!weeklyTrends[week]) {
                weeklyTrends[week] = { referrals: 0, visitors: 0 };
            }
            weeklyTrends[week].referrals += (data.referrals || 0);
            weeklyTrends[week].visitors += (data.visitorsInvited || 0);
        });

        renderLeaderboard(memberScores);
        renderTrendsChart(weeklyTrends);
        renderDistributionChart(weeklyTrends);

    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

function renderLeaderboard(scoresObj) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';

    // Convert to array and sort by score
    const sorted = Object.values(scoresObj).sort((a, b) => b.totalScore - a.totalScore);

    if (sorted.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px;">No data recorded yet.</p>';
        return;
    }

    sorted.forEach((item, index) => {
        const rankClass = index < 3 ? `top-${index + 1}` : '';
        const row = `
            <div class="leaderboard-row ${rankClass}">
                <div style="display:flex; align-items:center;">
                    <span class="rank">${index + 1}</span>
                    <span style="font-weight:600;">${item.name}</span>
                </div>
                <span class="score-pill">${item.totalScore} pts</span>
            </div>
        `;
        list.innerHTML += row;
    });
}

function renderTrendsChart(trends) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    const weeks = Object.keys(trends).sort((a, b) => a - b);
    const referralData = weeks.map(w => trends[w].referrals);
    const visitorData = weeks.map(w => trends[w].visitors);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks.map(w => `W${w}`),
            datasets: [
                {
                    label: 'Referrals',
                    data: referralData,
                    borderColor: '#e63946',
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Visitors',
                    data: visitorData,
                    borderColor: '#457b9d',
                    backgroundColor: 'rgba(69, 123, 157, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderDistributionChart(trends) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    let totalRef = 0;
    let totalVis = 0;

    Object.values(trends).forEach(t => {
        totalRef += t.referrals;
        totalVis += t.visitors;
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Referrals', 'Total Visitors'],
            datasets: [{
                data: [totalRef, totalVis],
                backgroundColor: ['#e63946', '#457b9d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

