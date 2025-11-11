// admin.js

document.addEventListener('DOMContentLoaded', () => {
    const alertsForm = document.getElementById('alerts-form');
    const studentsForm = document.getElementById('students-form');
    const currentDataDiv = document.getElementById('current-data');

    // دالة لجلب البيانات وعرضها
    async function displayCurrentData() {
        let studentsList = [];
        let announcementsList = [];
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            studentsList = data.students || [];
            announcementsList = data.announcements || [];
        } catch (error) {
            console.error('Failed to load data.json:', error);
        }
        
        const addedStudents = JSON.parse(localStorage.getItem('addedStudents')) || [];
        const addedAlerts = JSON.parse(localStorage.getItem('newAlerts')) || [];
        
        const combinedStudents = [...studentsList, ...addedStudents];
        const combinedAlerts = [...announcementsList, ...addedAlerts];

        currentDataDiv.innerHTML = `
            <h3>التنبيه العاجل النشط:</h3>
            <p>${combinedAlerts.length > 0 ? combinedAlerts[combinedAlerts.length - 1] : 'لا يوجد تنبيهات.'}</p>
            <p style="font-size: 12px; color: #5d2528;">(تم تخزين ${addedAlerts.length} تنبيهات جديدة محلياً بواسطة المشرف.)</p>

            <h3 style="margin-top: 20px;">عدد الطلاب الكلي:</h3>
            <p>${combinedStudents.length} طالب.</p>
            <p style="font-size: 12px; color: #5d2528;">(تم إضافة ${addedStudents.length} طالب جديد محلياً بواسطة المشرف.)</p>
        `;
    }

    // 1. معالجة نموذج التنبيهات
    alertsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const alertMessage = document.getElementById('alert-message').value.trim();
        if (alertMessage) {
            let alerts = JSON.parse(localStorage.getItem('newAlerts')) || [];
            alerts.push(alertMessage);
            localStorage.setItem('newAlerts', JSON.stringify(alerts));
            alert('✅ تم حفظ التنبيه بنجاح.');
            document.getElementById('alert-message').value = ''; 
            displayCurrentData();
        }
    });

    // 2. معالجة نموذج إضافة الطلبة
    studentsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentName = document.getElementById('student-name').value.trim();
        if (studentName) {
            let students = JSON.parse(localStorage.getItem('addedStudents')) || [];
            if (!students.includes(studentName)) {
                students.push(studentName);
                localStorage.setItem('addedStudents', JSON.stringify(students));
                alert(`✅ تم إضافة الطالب: ${studentName}`);
                document.getElementById('student-name').value = ''; 
                displayCurrentData();
            } else {
                alert('⚠️ هذا الطالب مسجل بالفعل.');
            }
        }
    });

    displayCurrentData();
});
