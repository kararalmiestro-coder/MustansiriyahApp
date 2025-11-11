// --- 1. طلب إذن الإشعارات من المستخدم عند تحميل التطبيق ---
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
requestNotificationPermission();

// --- 2. وظيفة فحص الجدول وإرسال الإشعارات ---
async function checkScheduleAndNotify() {
    // التحقق من الإذن قبل المتابعة
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return; 
    }

    const today = new Date();
    // الحصول على اسم اليوم بالعربية (يجب أن يتطابق مع data.json)
    const dayNames = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const currentDayName = dayNames[today.getDay()];

    try {
        // جلب الجدول من data.json
        const response = await fetch('data.json');
        const data = await response.json();
        const todaysSchedule = data.schedule[currentDayName];

        if (!todaysSchedule || todaysSchedule.length === 0) return;

        for (const lesson of todaysSchedule) {
            // تجاهل فترات الاستراحة
            if (lesson.subject === 'استراحة') continue;

            // تحليل وقت بدء المحاضرة (مثل '8:30' من '8:30 - 9:15')
            const startTimeStr = lesson.time.split(' - ')[0]; 
            let [hours, minutes] = startTimeStr.split(':').map(Number);
            
            // إنشاء كائن Date لوقت بدء المحاضرة في هذا اليوم
            const lectureTime = new Date(today);
            lectureTime.setHours(hours, minutes, 0, 0);

            // حساب وقت الإشعار (5 دقائق قبل المحاضرة)
            const notificationTime = new Date(lectureTime.getTime() - (5 * 60000)); // طرح 5 دقائق
            
            // حساب الفرق الزمني بين الآن ووقت الإشعار (بالدقائق)
            const timeDifference = Math.floor((notificationTime.getTime() - today.getTime()) / 60000); 

            // إذا كان وقت الإشعار في المستقبل وخلال الـ 15 دقيقة القادمة (للتأكد من عدم إرسال إشعارات قديمة)
            if (timeDifference >= 0 && timeDifference <= 15) {
                const title = `تنبيه: محاضرة قادمة!`;
                const body = `${lesson.subject} (أ.د. ${lesson.instructor}) ستبدأ بعد ${timeDifference} دقيقة.`;
                
                // إرسال رسالة إلى Service Worker لعرض الإشعار
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


// --- 3. ضمان تسجيل Service Worker ثم فحص الجدول ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('Service Worker registered.');
            // فحص الجدول وإرسال الإشعارات بمجرد تفعيل Service Worker
            checkScheduleAndNotify(); 
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
} else { javascript // استمع للرسائل القادمة من service-worker لعرض الإشعارات داخل النافذة if ('serviceWorker' in navigator && navigator.serviceWorker.controller) { navigator.serviceWorker.addEventListener('message', event => { if (event.data && event abundante.data.action === 'showNotificationInModal') { showNotificationInModal(event.data.title, event.data.body); } }); }
    // إذا لم يكن هناك دعم، يتم الفحص بالرغم من أن الإشعارات قد لا تعمل
    window.addEventListener('load', checkScheduleAndNotify);
}
javascript function toggleNotifications() { Notification.requestPermission().then(function(permission) { if (permission === 'granted') { new Notification('تم تفعيل الإشعارات', {body: 'ستتلقى تنبيهات بأهم التحديثات.'}); console.log('Notification permission granted.'); } else { console.log('Notification permission denied.'); } }); }
// --- 4. يمكنك هنا إضافة كود آخر لعرض البيانات على الواجهة (مثل عرض الجدول) ---
// (الكود الحالي يركز على الإشعارات فقط، ويجب أن يكون كود عرض الواجهة موجوداً هنا أيضاً)


