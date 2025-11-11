const LOCAL_STORAGE_KEY = 'mustansiriyah_history_data';

document.addEventListener('DOMContentLoaded', () => {
    // تحميل وعرض البيانات الحالية عند فتح الصفحة
    loadCurrentData();

    // 1. معالج إرسال نموذج التنبيهات
    document.getElementById('alerts-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddAlert();
    });

    // 2. معالج إرسال نموذج الطلبة
    document.getElementById('students-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddStudent();
    });
});

/**
 * دالة قراءة البيانات من localStorage أو إنشاء هيكل جديد
 */
function getLocalData() {
    const dataString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (dataString) {
        return JSON.parse(dataString);
    }
    // هيكل البيانات الافتراضي إذا لم يكن هناك شيء محفوظ
    return {
        version: 0,
        lastSync: 0,
        alerts: [],
        schedule: [],
        students: [],
        summaries: []
    };
}

/**
 * دالة لحفظ البيانات المحدثة في localStorage
 */
function saveLocalData(data) {
    // زيادة رقم الإصدار (Version) لإجبار التطبيق على المزامنة عند الاتصال بالإنترنت
    data.version += 1; 
    data.lastSync = Date.now();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    alert('تم حفظ البيانات بنجاح في جهازك!');
    loadCurrentData(); // إعادة تحميل العرض
}

/**
 * 1. معالج إضافة تنبيه جديد
 */
function handleAddAlert() {
    const message = document.getElementById('alert-message').value.trim();
    if (!message) return;

    const data = getLocalData();
    const newAlert = {
        id: Date.now(),
        title: "تنبيه جديد",
        message: message,
        date: new Date().toLocaleDateString('ar-IQ') // تاريخ اليوم
    };

    // إضافة التنبيه في بداية المصفوفة لضمان عرضه أولاً
    data.alerts.unshift(newAlert);

    // إذا أردت فقط الاحتفاظ بـ 10 تنبيهات مثلاً
    if (data.alerts.length > 10) {
        data.alerts.pop();
    }

    saveLocalData(data);
    document.getElementById('alert-message').value = '';
}

/**
 * 2. معالج إضافة طالب جديد
 */
function handleAddStudent() {
    const studentName = document.getElementById('student-name').value.trim();
    if (!studentName) return;

    const data = getLocalData();
    
    // منع التكرار
    if (!data.students.includes(studentName)) {
        data.students.push(studentName);
        // ترتيب القائمة أبجدياً
        data.students.sort(); 
    } else {
        alert('هذا الاسم موجود بالفعل.');
        return;
    }

    saveLocalData(data);
    document.getElementById('student-name').value = '';
}

/**
 * دالة عرض البيانات الحالية المخزنة محلياً
 */
function loadCurrentData() {
    const data = getLocalData();
    const currentDataDiv = document.getElementById('current-data');
    
    currentDataDiv.innerHTML = `
        <p><strong>الإصدار الحالي:</strong> ${data.version}</p>
        <p><strong>آخر حفظ:</strong> ${new Date(data.lastSync).toLocaleString('ar-IQ')}</p>
        <hr>
        <h4>التنبيهات (${data.alerts.length}):</h4>
        <ul>
            ${data.alerts.map(a => `<li>[${a.date}] ${a.message}</li>`).join('')}
        </ul>
        <hr>
        <h4>أسماء الطلبة (${data.students.length}):</h4>
        <p>${data.students.slice(0, 5).join('، ')} ...</p>
    `;
    
    // هنا يجب عليك إضافة المزيد من المنطق لعرض وتحرير بيانات الجدول والملخصات
}
