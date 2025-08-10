document.addEventListener('DOMContentLoaded', function() {

    function isUserLoggedIn() {
    const loginData = localStorage.getItem('safetyReportLoginData');
    if (!loginData) return false;

    try {
        const parsed = JSON.parse(loginData);

        if (!parsed.user || !parsed.email || !parsed.accessCode) return false;

        const now = Date.now();
        const eightHours = 8 * 60 * 60 * 1000;
        if (now - parsed.loginTime > eightHours) {
            localStorage.removeItem('safetyReportLoginData');
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}

    // Kalau di halaman login → jangan redirect
    if (window.location.href.startsWith('https://gifary10.github.io/isr-login-access/')) {
        return;
    }

    // Kalau belum login atau sudah expired → redirect
    if (!isUserLoggedIn()) {
        window.location.href = 'https://gifary10.github.io/isr-login-access/';
    }

});


