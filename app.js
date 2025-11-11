const LOCAL_STORAGE_KEY = 'mustansiriyah_history_data';
const CENTRAL_DATA_URL = 'data.json'; // هذا هو ملف JSON الذي تضعه على استضافة الويب

document.addEventListener('DOMContentLoaded', () => {
    // 1. تسجيل Service Worker لتمكين PWA والعمل دون اتصال
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Registration Failed:', err));
    }

    // 2. تفعيل منطق الجرس (الإشعارات)
    setupNotificationDropdown();
    
    // 3. بدء عملية المزامنة
    syncData();
});

/**
 * 4. المزامنة: جلب البيانات الجديدة من data.json وتحديث localStorage
 */
async function syncData() {
    // 1. قراءة البيانات المحلية المخزنة
    let localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    let lastSyncTime = localData ? localData.lastSync : 0;
    
    // 2. التحقق من الاتصال بالإنترنت
    if (navigator.onLine) {
        try {
            const response = await fetch(CENTRAL_DATA_URL);
            const centralData = await response.json();

            // 3. مقارنة التاريخ أو الإصدار والتحديث
            if (centralData.version > (localData ? localData.version : 0)) {
                console.log("New data available. Updating local storage.");
                centralData.lastSync = Date.now(); // إضافة وقت المزامنة
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(centralData));
                localData = centralData; // استخدام البيانات الجديدة فوراً
                alert('تم تحديث البيانات بنجاح!');
            }
        } catch (error) {
            console.error('Failed to fetch central data, using local data.', error);
            // متابعة العمل بالبيانات المحلية في حال فشل الجلب
        }
    }
    
    // 4. عرض التنبيهات على شريط التنبيهات
    displayAlertBar(localData);
    
    // 5. تعبئة قائمة الجرس
    populateNotificationDropdown(localData);
}

/**
 * وظيفة عرض أحدث تنبيه في الشريط العاجل
 */
function displayAlertBar(data) {
    const alertBar = document.getElementById('alert-bar');
    if (data && data.alerts && data.alerts.length > 0) {
        // عرض أحدث تنبيه
        alertBar.textContent = `🚨 تنبيه عاجل: ${data.alerts[0].message}`;
    } else {
        alertBar.textContent = 'لا توجد تنبيهات عاجلة حالياً.';
    }
}

/**
 * وظيفة إظهار/إخفاء قائمة التنبيهات المنبثقة
 */
function toggleNotifications() {
    document.getElementById("notification-dropdown").classList.toggle("show");
    // إخفاء النقطة الحمراء بعد الضغط
    document.querySelector('.alert-dot').classList.add('hidden');
}

/**
 * وظيفة تعبئة قائمة التنبيهات المنبثقة
 */
function populateNotificationDropdown(data) {
    const dropdown = document.getElementById('notification-dropdown');
    dropdown.innerHTML = ''; // تفريغ القائمة الحالية

    if (data && data.alerts && data.alerts.length > 0) {
        // إظهار النقطة الحمراء
        document.querySelector('.alert-dot').classList.remove('hidden');
        
        data.alerts.forEach(alert => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `<strong>${alert.title}</strong><p>${alert.message}</p><small>${alert.date}</small><hr>`;
            dropdown.appendChild(item);
        });
    } else {
        dropdown.innerHTML = '<p style="padding: 10px;">لا توجد تنبيهات جديدة.</p>';
    }
}
