/**
 * Habits STRIKE - Core JavaScript Logic
 * ระบบจัดการผู้ใช้แบบ Isolation, รักษาวินัย 30 วัน, และระบบคำนวณคะแนนสะสมรายเดือน
 */

// คอนฟิกูเรชันเริ่มต้นของระบบ
let currentUser = "guest"; // ชื่อผู้ใช้ปัจจุบัน (Default: guest)
let habits = [];           // อาร์เรย์สำหรับเก็บรายการกิจกรรมทั้งหมดของยูสเซอร์ปัจจุบัน

// ระบบจำลองวันปัจจุบัน (Index 2 คือ วันที่ 3 ของเดือน) 
// เอาไว้ล็อกไม่ให้กดย้อนหลังล่วงหน้า สามารถเปลี่ยนเป็นวันที่ต้องการทดสอบได้
window.currentSystemDayIndex = 2; 

/**
 * 1. ฟังก์ชันสลับบัญชีผู้ใช้งาน (Switch User)
 * @param {string} inputName - ชื่อผู้ใช้ที่พิมพ์เข้ามา
 */
function switchUser(inputName) {
    const username = inputName.trim();
    if (username === "") {
        console.error("กรุณาระบุชื่อผู้ใช้งาน");
        return;
    }
    
    // แปลงเป็นตัวพิมพ์เล็กเพื่อไม่ให้เกิดความสับสนในการจำคีย์ใน LocalStorage
    currentUser = username.toLowerCase(); 
    
    // โหลดข้อมูลและอัปเดตสถานะบอร์ด
    loadUserData();
    console.log(`สลับผู้ใช้งานไปยัง: ${currentUser}`);
}

/**
 * 2. ฟังก์ชันโหลดข้อมูลจาก LocalStorage
 */
function loadUserData() {
    const savedData = localStorage.getItem(`habits_strike_weekly_${currentUser}`);
    if (savedData) {
        habits = JSON.parse(savedData);
    } else {
        // หากเป็นยูสเซอร์ใหม่ ให้สร้างข้อมูลจำลองเริ่มต้น (Sample Data)
        initSampleData();
    }
    updateTotalPoints();
}

/**
 * 3. ฟังก์ชันบันทึกข้อมูลลง LocalStorage
 */
function saveUserData() {
    if (currentUser) {
        localStorage.setItem(`habits_strike_weekly_${currentUser}`, JSON.stringify(habits));
    }
}

/**
 * 4. ฟังก์ชันสร้างข้อมูลตัวอย่าง (สำหรับบัญชีใหม่)
 */
function initSampleData() {
    habits = [
        {
            id: 1,
            name: "ออกกำลังกาย 30 นาที",
            // บันทึกสถานะ 30 วัน (null = ยังไม่ถึง/ลืมกด, true = สำเร็จ, false = ไม่สำเร็จ)
            days: [true, true, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            // บันทึกแต้มที่ได้ในแต่ละวันแยกเก็บตาม Index
            historyPoints: [5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            currentStreak: 2,   // จำนวนวันที่ทำต่อเนื่องปัจจุบัน
            nextEarnPoint: 7    // แต้มที่จะได้รับในการกดครั้งถัดไป (สะสมเพิ่มทีละ 1 ตั้งแต่ 5 ถึงสูงสุด 8)
        }
    ];
    saveUserData();
}

/**
 * 5. ฟังก์ชันเพิ่มกิจกรรมใหม่ (Add Habit)
 * @param {string} habitName - ชื่อกิจกรรมที่ต้องการเพิ่ม
 */
function addHabit(habitName) {
    const name = habitName.trim();
    if (name === "") {
        console.error("ชื่อกิจกรรมต้องไม่เป็นช่องว่าง");
        return;
    }

    const newHabit = {
        id: Date.now(),             // ใช้ Timestamp เป็น ID อ้างอิงที่ไม่ซ้ำกัน
        name: name,
        days: Array(30).fill(null),  // สร้างอาร์เรย์ว่าง 30 วัน
        historyPoints: Array(30).fill(0), // สร้างอาร์เรย์เก็บแต้ม 30 วัน
        currentStreak: 0,
        nextEarnPoint: 5            // เริ่มต้นที่ 5 แต้ม
    };

    habits.push(newHabit);
    saveUserData();
    updateTotalPoints();
}

/**
 * 6. ฟังก์ชันลบกิจกรรมที่ไม่ต้องการ (Delete Habit)
 * @param {number} habitId - ID ของกิจกรรมที่ต้องการลบ
 */
function deleteHabit(habitId) {
    // กรองกิจกรรมตัวที่ ID ตรงกันออกไป
    habits = habits.filter(h => h.id !== habitId);
    saveUserData();
    updateTotalPoints();
}

/**
 * 7. ฟังก์ชันเช็กอินประจำวัน (Check-In)
 * @param {number} habitId - ID ของกิจกรรม
 * @param {number} dayIndex - วันที่ที่ต้องการกด (0-29 แทน วันที่ 1-30)
 */
function checkInHabit(habitId, dayIndex) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // ห้ามกดวันล่วงหน้า (ห้ามเกินกว่าระบบปัจจุบัน)
    if (dayIndex > window.currentSystemDayIndex) {
        console.error("ยังไม่ถึงวันที่กำหนด ไม่สามารถเช็กอินล่วงหน้าได้");
        return;
    }

    // ตรวจสอบเงื่อนไขความต่อเนื่อง (Streak Reset)
    // หากวันก่อนหน้าถูกปล่อยว่าง (null) หรือทำไม่สำเร็จ (false) แต้มต่อเนื่องจะรีเซ็ตกลับไปเริ่มต้นที่ 5 ใหม่
    if (dayIndex > 0 && (habit.days[dayIndex - 1] === false || habit.days[dayIndex - 1] === null)) {
        habit.nextEarnPoint = 5;
        habit.currentStreak = 0;
    }

    // บันทึกสถานะสำเร็จและใส่แต้มที่ได้รับ
    habit.days[dayIndex] = true;
    habit.historyPoints[dayIndex] = habit.nextEarnPoint;
    habit.currentStreak += 1;

    // คำนวณแต้มสำหรับการกดครั้งถัดไป (เพิ่มขึ้นรอบละ +1 แต่เพดานสูงสุดห้ามเกิน 8 แต้ม)
    let nextPoint = habit.nextEarnPoint + 1;
    if (nextPoint > 8) nextPoint = 8;
    habit.nextEarnPoint = nextPoint;

    saveUserData();
    updateTotalPoints();
}

/**
 * 8. ฟังก์ชันคำนวณแต้มรวมภาพรวม ณ ปัจจุบัน (Real-time Grand Total)
 * @returns {number} คะแนนรวมจากทุกกิจกรรม
 */
function updateTotalPoints() {
    let grandTotal = 0;
    habits.forEach(habit => {
        grandTotal += habit.historyPoints.reduce((sum, current) => sum + current, 0);
    });
    return grandTotal;
}

/**
 * 9. ระบบสรุปผลคะแนนแยกรายกิจกรรมประจำเดือน (Monthly Summary)
 * @returns {Object} ข้อมูลสรุปสถิติสำหรับนำไปแสดงผลบน UI
 */
function calculateMonthlySummary() {
    let grandTotalPoints = updateTotalPoints();
    let summaryReport = {
        username: currentUser,
        grandTotalPoints: grandTotalPoints,
        details: []
    };

    if (habits.length === 0) {
        return summaryReport;
    }

    // วนลูปเจาะลึกข้อมูลทีละกิจวัตรเพื่อแยกสรุปผลรายเดือน
    habits.forEach(habit => {
        let habitMonthlyPoints = habit.historyPoints.reduce((sum, score) => sum + score, 0);
        let habitMonthlySuccessCount = habit.days.filter(status => status === true).length;

        summaryReport.details.push({
            habitName: habit.name,
            successDays: habitMonthlySuccessCount,   // จำนวนวันที่ทำสำเร็จ (เช่น 15 จาก 30 วัน)
            totalDays: 30,
            pointsEarned: habitMonthlyPoints          // คะแนนรวมเฉพาะของกิจกรรมนี้
        });
    });

    return summaryReport; 
    // ตัวอย่างการส่งออก: { username: "guest", grandTotalPoints: 13, details: [{ habitName: "ออกกำลังกาย...", successDays: 2, totalDays: 30, pointsEarned: 11 }] }
}