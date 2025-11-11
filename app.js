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


// --- 3. تسجيل SW وإعداد الفحص الدوري (المنطق الرئيسي) ---
document.addEventListener('DOMContentLoaded', () => {
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
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });

            exams.forEach(exam => {
                const examDate = new Date(exam.date + 'T00:00:00'); 
                const timeDiff = examDate.getTime() - now.getTime();
                
                if (timeDiff >= 0) { // المستقبل أو اليوم
                    if (timeDiff < closestDateDiff) {
                        closestDateDiff = timeDiff;
                        closestExam = exam;
                    }
                }
            });

            // 3. تحديد التنبيه الأهم للعرض (الامتحان الأقرب أولاً)
            let mainAlertText = 'لا توجد تنبيهات عاجلة حالياً.';
            let isImportantAlert = false; 

            if (closestExam) {
                const examDayFormatted = dateFormatter.format(new Date(closestExam.date));
                // حساب الأيام المتبقية
                const daysUntil = Math.floor(closestDateDiff / (1000 * 60 * 60 * 24)); 
                
                let timeMessage;
                if (daysUntil === 0) {
                    timeMessage = 'اليوم!';
                } else if (daysUntil === 1) {
                    timeMessage = 'غداً!';
                } else {
                    timeMessage = `بعد ${daysUntil} يوم.`;
                }
                
                // النص الذي سيظهر في شريط التنبيهات
                mainAlertText = `⚠️ موعد امتحان الشهر الثاني: ${closestExam.subject} (${closestExam.day} ${examDayFormatted}) - ${timeMessage}`;
                isImportantAlert = true;

            } else if (allAnnouncements.length > 0) {
                mainAlertText = allAnnouncements[allAnnouncements.length - 1]; 
                isImportantAlert = true;
            }

            // 4. تطبيق التنبيه على الواجهة
            alertBar.textContent = mainAlertText;
            alertBar.classList.add('active'); 
            
            if (isImportantAlert) {
                document.querySelector('.alert-dot').classList.remove('hidden');
            } else {
                document.querySelector('.alert-dot').classList.add('hidden');
            }


            // 5. تحديث القائمة المنسدلة (تشمل كل الامتحانات القادمة والتنبيهات العامة)
            
            // تصفية وترتيب الامتحانات القادمة (من الأقرب للأبعد)
            const futureExamsAlerts = exams.filter(exam => {
                const examDate = new Date(exam.date + 'T00:00:00');
                return examDate.getTime() >= now.getTime();
            }).sort((a, b) => {
                 return new Date(a.date).getTime() - new Date(b.date).getTime();
            }).map(exam => {
                const examDayFormatted = dateFormatter.format(new Date(exam.date));
                return `**موعد امتحان:** ${exam.subject} (${exam.day} ${examDayFormatted})`;
            });
            
            // دمج قائمة الامتحانات القادمة مع قائمة التنبيهات العامة
            const dropdownItems = [...futureExamsAlerts, ...allAnnouncements];

            if (dropdownItems.length > 0) {
                notificationDropdown.innerHTML = dropdownItems.map(
                    (item) => `<p>• ${item}</p>`
                ).join('');
            } else {
                notificationDropdown.innerHTML = '<p>لا توجد تنبيهات جديدة.</p>';
            }


        } catch (error) {
            console.error('فشل في جلب البيانات:', error);
        }
    }

    // تبديل عرض قائمة الإشعارات المنسدلة
    bellIcon.addEventListener('click', () => {
        notificationDropdown.style.display = notificationDropdown.style.display === 'block' ? 'none' : 'block';
        document.querySelector('.alert-dot').classList.add('hidden'); 
    });
    
    loadAlertsAndDisplay();
});
