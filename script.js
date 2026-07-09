/**
 * Habits STRIKE - Core Logic with Day Selector (External JavaScript)
 */

let currentUser = "guest";
let habits = [];
let systemDayIndex = 0; // วันที่ที่ผู้ใช้กำลังเลือกดู/บันทึกงานอยู่ ณ ปัจจุบัน (0 = วันที่ 1)

window.onload = function() {
    buildDaySelectorOptions(); // สร้างตัวเลือกวันที่ 1-30 ใน Dropdown
    initApp();
};

// ฟังก์ชันสร้างตัวเลือกวันที่ 1 ถึง 30 ในเมนู Dropdown
function buildDaySelectorOptions() {
    const selector = document.getElementById('day-selector');
    selector.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `วันที่ ${i + 1}`;
        selector.appendChild(option);
    }
}

function initApp() {
    const usernameInput = document.getElementById('username').value.trim();
    currentUser = usernameInput !== "" ? usernameInput.toLowerCase() : "guest";
    document.getElementById('display-username').innerText = usernameInput !== "" ? usernameInput : "Guest";
    
    // โหลดวันที่ล่าสุดที่ผู้ใช้เคยเปิดทิ้งไว้
    const savedDay = localStorage.getItem(`habits_strike_day_${currentUser}`);
    systemDayIndex = savedDay ? parseInt(savedDay) : 0;
    
    document.getElementById('day-selector').value = systemDayIndex; // ปรับ Dropdown ให้ตรงกับค่าระบบ
    updateDayLabel();
    clearReportBoard();
    loadUserData();
    renderHabits();
}

function triggerSwitchUser() {
    initApp();
}

function updateDayLabel() {
    document.getElementById('current-day-label').innerText = `วันที่ ${systemDayIndex + 1}`;
}

// ฟังก์ชันทำงานเมื่อผู้ใช้กดสลับวันที่ผ่าน Dropdown เพื่อย้อนดูข้อมูลวันเก่าๆ
function changeDayBySelector() {
    const selector = document.getElementById('day-selector');
    systemDayIndex = parseInt(selector.value);
    
    // บันทึกสถานะวันล่าสุดที่เลือกไว้
    localStorage.setItem(`habits_strike_day_${currentUser}`, systemDayIndex);
    
    updateDayLabel();
    renderHabits();
    clearReportBoard();
}

// ฟังก์ชันกดข้ามวัน (หากข้ามไปวันถัดไปโดยไม่ได้กดบันทึก ระบบจะปรับเป็นขาดวินัย ❌ ทันที)
function advanceToNextDay() {
    if (systemDayIndex >= 29) {
        alert("คุณเดินทางมาถึงวันที่ 30 แล้ว! ไม่สามารถข้ามวันได้อีก กรุณากดสรุปผลรายเดือน");
        return;
    }
    
    // บันทึก ❌ (false) ให้กับกิจกรรมที่ผู้ใช้ลืมกดบันทึกในวันนั้นๆ
    habits.forEach(habit => {
        if (habit.days[systemDayIndex] === null) {
            habit.days[systemDayIndex] = false;
            habit.historyPoints[systemDayIndex] = 0;
            habit.currentStreak = 0;
            habit.nextEarnPoint = 5; 
        }
    });

    systemDayIndex++;
    localStorage.setItem(`habits_strike_day_${currentUser}`, systemDayIndex);
    document.getElementById('day-selector').value = systemDayIndex; // ขยับ Dropdown ตาม
    
    updateDayLabel();
    saveUserData();
    renderHabits();
    clearReportBoard();
}

function clearReportBoard() {
    document.getElementById('monthly-result-container').style.display = "none";
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem(`habits_strike_compact_${currentUser}`, JSON.stringify(habits));
    }
}

function loadUserData() {
    const savedData = localStorage.getItem(`habits_strike_compact_${currentUser}`);
    if (savedData) {
        habits = JSON.parse(savedData);
    } else {
        initSampleData();
    }
    updateTotalPoints();
}

function initSampleData() {
    habits = [
        {
            id: 1,
            name: "ดื่มน้ำวันละ 2 ลิตร",
            days: Array(30).fill(null),
            historyPoints: Array(30).fill(0),
            currentStreak: 0, 
            nextEarnPoint: 5
        }
    ];
    saveUserData();
}

function triggerAddHabit() {
    const input = document.getElementById('habit-name-input');
    const name = input.value.trim();
    if(name === "") return;

    const newHabit = {
        id: Date.now(),
        name: name,
        days: Array(30).fill(null),
        historyPoints: Array(30).fill(0),
        currentStreak: 0,
        nextEarnPoint: 5 
    };

    habits.push(newHabit);
    input.value = "";
    saveUserData();
    updateTotalPoints();
    renderHabits();
    clearReportBoard();
}

function triggerDeleteHabit(habitId) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจวัตรนี้?`)) {
        habits = habits.filter(h => h.id !== habitId);
        saveUserData();
        updateTotalPoints();
        renderHabits();
        clearReportBoard(); 
    }
}

function renderHabits() {
    const container = document.getElementById('habits-container');
    container.innerHTML = "";

    if(habits.length === 0) {
        container.innerHTML = `<p class="text-center" style="color:var(--text-muted); padding: 10px; font-size:0.8rem;">ยังไม่มีกิจวัตรในตอนนี้</p>`;
        return;
    }

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        const habitTotalPoints = habit.historyPoints.reduce((a, b) => a + b, 0);

        let headerHTML = `
            <div class="habit-header">
                <div>
                    <h3>${habit.name}</h3>
                    <div class="streak-info">ทำต่อเนื่อง: <span class="streak-count">${habit.currentStreak} วัน</span> | รวม: ${habitTotalPoints} Pts</div>
                </div>
                <div class="habit-actions">
                    <div class="point-multiplier">+${habit.nextEarnPoint} Pts</div>
                    <button class="delete-habit-btn" onclick="triggerDeleteHabit(${habit.id})">🗑️</button>
                </div>
            </div>
        `;

        let gridHTML = `<div class="days-grid">`;
        for (let i = 0; i < 30; i++) {
            let dayStatus = habit.days[i];
            let classList = "day-box";
            let textInside = `วันที่ ${i+1}`; 
            let clickAction = "";

            if (dayStatus === true) {
                classList += " completed";
                textInside += `<div class="pts">+${habit.historyPoints[i]}</div>`;
            } else if (dayStatus === false) {
                classList += " disabled";
                textInside += `<div class="pts" style="color:var(--danger);">❌</div>`;
            }

            // ระบบตารางอัจฉริยะ: 
            // วันที่เลือกดูอยู่ (i === systemDayIndex) และยังไม่มีสถานะบันทึก จะเปิดให้คลิกบันทึกได้ทันที
            // วันอื่นๆ ที่ไม่ได้เลือกดูอยู่ จะแสดงเป็นสถานะสีเทา (Disabled) เพื่อบังคับให้ผู้ใช้เปลี่ยน Dropdown ด้านบนก่อนแก้ข้อมูล เพื่อการคุมความสม่ำเสมอ
            if (i === systemDayIndex && dayStatus === null) {
                clickAction = `onclick="triggerCheckIn(${habit.id}, ${i})"`;
            } else if (i !== systemDayIndex && dayStatus === null) {
                classList += " disabled"; 
            }

            gridHTML += `<div class="${classList}" ${clickAction}>${textInside}</div>`;
        }
        gridHTML += `</div>`;

        card.innerHTML = headerHTML + gridHTML;
        container.appendChild(card);
    });
}

function triggerCheckIn(habitId, dayIndex) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // ตรวจสอบคะแนนความต่อเนื่อง (Streak)
    if (dayIndex > 0 && (habit.days[dayIndex - 1] === false || habit.days[dayIndex - 1] === null)) {
        habit.nextEarnPoint = 5;
        habit.currentStreak = 0;
    }

    habit.days[dayIndex] = true;
    habit.historyPoints[dayIndex] = habit.nextEarnPoint;
    habit.currentStreak += 1;

    let nextPoint = habit.nextEarnPoint + 1;
    if (nextPoint > 8) nextPoint = 8;
    habit.nextEarnPoint = nextPoint;

    saveUserData();
    updateTotalPoints();
    renderHabits();
}

function updateTotalPoints() {
    let grandTotal = 0;
    habits.forEach(habit => {
        grandTotal += habit.historyPoints.reduce((sum, current) => sum + current, 0);
    });
    document.getElementById('total-points').innerText = grandTotal;
    return grandTotal;
}

function triggerMonthlySummary() {
    const container = document.getElementById('monthly-result-container');
    container.style.display = "block";

    let htmlContent = `<div style="font-weight:bold; border-bottom: 1px solid var(--success); padding-bottom:4px; margin-bottom:8px; color:var(--accent);">📊 สรุปผลรายเดือน (30 วัน)</div>`;
    let grandTotalPoints = updateTotalPoints();

    if(habits.length === 0) {
        container.innerHTML = "ไม่มีข้อมูลกิจวัตร";
        return;
    }

    habits.forEach(habit => {
        let habitMonthlyPoints = habit.historyPoints.reduce((sum, score) => sum + score, 0);
        let habitMonthlySuccessCount = habit.days.filter(d => d === true).length;

        htmlContent += `
                    <div class="report-item">
                        <span><b>${habit.name}</b></span>
                        <span>สำเร็จ <b>${habitMonthlySuccessCount}/30</b> วัน | <b>+${habitMonthlyPoints}</b> Pts</span>
                    </div>
                `;
    });

    const currentDisplayUser = document.getElementById('username').value.trim() || "Guest";
    htmlContent += `
        <div style="margin-top: 10px; font-weight: bold; text-align: right; color:#6ee7b7; font-size:0.85rem;">
            แต้มสุทธิของ ${currentDisplayUser}: <span style="color:black; background:var(--accent); padding:2px 6px; border-radius:4px;">${grandTotalPoints} Points</span>
        </div>
    `;
    container.innerHTML = htmlContent;
}