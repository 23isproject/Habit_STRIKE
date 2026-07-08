/**
 * Habits STRIKE - Core JavaScript Logic (Updated for Day 1)
 */

let currentUser = "guest"; 
let habits = [];           

// เปลี่ยนค่าเป็น 0 เพื่อให้ระบบเริ่มต้นล็อกอินมาอยู่ที่ "วันที่ 1" ของการทำวินัยทันที
window.currentSystemDayIndex = 0; 

function switchUser(inputName) {
    const username = inputName.trim();
    if (username === "") {
        console.error("กรุณาระบุชื่อผู้ใช้งาน");
        return;
    }
    currentUser = username.toLowerCase(); 
    loadUserData();
}

function loadUserData() {
    const savedData = localStorage.getItem(`habits_strike_weekly_${currentUser}`);
    if (savedData) {
        habits = JSON.parse(savedData);
    } else {
        initSampleData();
    }
    updateTotalPoints();
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem(`habits_strike_weekly_${currentUser}`, JSON.stringify(habits));
    }
}

function initSampleData() {
    // ปรับ Data ตัวอย่างให้สอดคล้องกับวันเริ่มต้นวันที่ 1 (ยังไม่มีวันไหนถูกกดบันทึกสำเร็จ)
    habits = [
        {
            id: 1,
            name: "ออกกำลังกาย 30 นาที",
            days: Array(30).fill(null),
            historyPoints: Array(30).fill(0),
            currentStreak: 0,   
            nextEarnPoint: 5    
        }
    ];
    saveUserData();
}

function addHabit(habitName) {
    const name = habitName.trim();
    if (name === "") return;

    const newHabit = {
        id: Date.now(),             
        name: name,
        days: Array(30).fill(null),  
        historyPoints: Array(30).fill(0), 
        currentStreak: 0,
        nextEarnPoint: 5            
    };

    habits.push(newHabit);
    saveUserData();
    updateTotalPoints();
}

function deleteHabit(habitId) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจวัตรนี้?`)) {
        habits = habits.filter(h => h.id !== habitId);
        saveUserData();
        updateTotalPoints();
    }
}

function checkInHabit(habitId, dayIndex) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (dayIndex > window.currentSystemDayIndex) {
        console.error("ยังไม่ถึงวันที่กำหนด");
        return;
    }

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
}

function updateTotalPoints() {
    let grandTotal = 0;
    habits.forEach(habit => {
        grandTotal += habit.historyPoints.reduce((sum, current) => sum + current, 0);
    });
    return grandTotal;
}

function calculateMonthlySummary() {
    let grandTotalPoints = updateTotalPoints();
    let summaryReport = {
        username: currentUser,
        grandTotalPoints: grandTotalPoints,
        details: []
    };

    habits.forEach(habit => {
        let habitMonthlyPoints = habit.historyPoints.reduce((sum, score) => sum + score, 0);
        let habitMonthlySuccessCount = habit.days.filter(status => status === true).length;

        summaryReport.details.push({
            habitName: habit.name,
            successDays: habitMonthlySuccessCount,   
            totalDays: 30,
            pointsEarned: habitMonthlyPoints          
        });
    });

    return summaryReport; 
}