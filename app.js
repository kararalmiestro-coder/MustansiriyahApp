// app.js

// --- 1. وظيفة طلب إذن الإشعارات ---
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.log('Notification permission denied.');
            }
        });
    }
}
window.toggleNotifications = requestNotificationPermission;


// --- 2. وظيفة فحص الجدول وإرسال الإشعارات (المعدلة) ---
async function checkScheduleAndNotify() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return; 
    }

    const now = new Date(); 
    const dayNames = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const currentDayName = dayNames[now.getDay()];

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to fetch schedule.');
        const data = await response.json();
        const todaysSchedule = data.schedule[currentDayName];

        if (!todaysSchedule || todaysSchedule.length === 0) return;

        for (const lesson of todaysSchedule) {
            if (lesson.subject === 'استراحة') continue;

            const startTimeStr = lesson.time.split(' - ')[0]; 
            let [hours, minutes] = startTimeStr.split(':').map(Number);
            
            const lectureTime = new Date(now);
            lectureTime.setHours(hours, minutes, 0, 0);

            const notificationTime = lectureTime.getTime() - (5 * 60000); // 5 دقائق قبل المحاضرة
            const timeDifference = Math.floor((notificationTime - now.getTime()) / 60000); 

            if (timeDifference >= 0 && timeDifference < 5) { 
                const title = `تنبيه: محاضرة قادمة!`;
                const body = `${lesson.subject} (أ.د. ${lesson.instructor}) ستبدأ بعد ${timeDifference} دقيقة.`;
                
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        action: 'showNotification',
                        title: title,
                        body: body,
                        tag: `lecture-${currentDayName}-${startTimeStr}` 
                    });
                }
            } 
        }
    } catch (error) {
        console.error('فشل في فحص الجدول لإرسال الإشعارات:', error);
    }
}


// ------------------------------------------------------------------------
// --- 4. وظائف التحميل والعرض المباشر للبيانات الجديدة (للعرض في الواجهة) ---
// *ملاحظة: تحتاج إلى تطبيق منطق عرض البيانات الفعلي في الواجهة داخل هذه الدوال.*
// ------------------------------------------------------------------------

async function loadLectures() {
    // افتراض: جلب بيانات المحاضرات من ملف أو API وعرضها في عنصر معين
    try {
        const response = await fetch('data.json'); // افترض أن جدول المحاضرات موجود هنا
        const data = await response.json();
        // **هنا ضع الكود الذي يعرض بيانات جدول المحاضرات في الواجهة**
        console.log("✅ تم تحميل بيانات المحاضرات وعرضها مباشرة.");
    } catch (error) {
        console.error('❌ فشل في تحميل وعرض المحاضرات:', error);
    }
}

async function loadStudents() {
    // افتراض: جلب بيانات أسماء الطلبة
    try {
        const response = await fetch('students.json'); // يجب أن يكون لديك ملف لأسماء الطلبة
        const data = await response.json();
        // **هنا ضع الكود الذي يعرض قائمة أسماء الطلبة في الواجهة**
        console.log("✅ تم تحميل بيانات أسماء الطلبة وعرضها مباشرة.");
    } catch (error) {
        console.error('❌ فشل في تحميل وعرض أسماء الطلبة:', error);
    }
}

async function loadSummaries() {
    // افتراض: جلب بيانات الملخصات
    try {
        const response = await fetch('summaries.json'); // يجب أن يكون لديك ملف للملخصات
        const data = await response.json();
        // **هنا ضع الكود الذي يعرض الملخصات في الواجهة**
        console.log("✅ تم تحميل بيانات الملخصات وعرضها مباشرة.");
    } catch (error) {
        console.error('❌ فشل في تحميل وعرض الملخصات:', error);
    }
}


// ------------------------------------------------------------------------
// --- 3. تسجيل SW وإعداد الفحص الدوري (المنطق الرئيسي) ---
// ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // **🌟 التعديل المطلوب:** استدعاء جميع دوال تحميل البيانات فوراً عند تحميل الصفحة
    loadLectures();  
    loadStudents();  
    loadSummaries(); 

    const alertBar = document.getElementById('alert-bar');
    const bellIcon = document.querySelector('.bell-icon');
    const notificationDropdown = document.getElementById('notification-dropdown');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('✅ Service Worker registered successfully.');
            
            setInterval(checkScheduleAndNotify, 60000); 
            checkScheduleAndNotify(); 
        }).catch(error => {
            console.error('❌ Service Worker registration failed:', error);
        });
    } else {
        setInterval(checkScheduleAndNotify, 60000);
    }

    // دالة لجلب وعرض التنبيهات من data.json والتنبيهات المضافة محلياً
    async function loadAlertsAndDisplay() {
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            
            // 1. معالجة التنبيهات العامة (announcements)
            const baseAlerts = data.announcements || [];
            const addedAlerts = JSON.parse(localStorage.getItem('newAlerts')) || [];
            const allAnnouncements = [...baseAlerts, ...addedAlerts];

            // 2. معالجة مواعيد الامتحانات (Exams)
            const exams = data.exams || [];
            const now = new Date();
            // تعيين الوقت إلى منتصف الليل للمقارنة الدقيقة ليوم كامل
            now.setHours(0, 0, 0, 0); 
            
            let closestExam = null;
            let closestDateDiff = Infinity;

            const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
// ... (بقية الكود الخاص بك)
