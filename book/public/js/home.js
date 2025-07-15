document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const facilityId = sessionStorage.getItem('facilityId');
    if (!facilityId) {
        window.location.href = 'index.html';
        return;
    }
}

function logout() {
    sessionStorage.removeItem('facilityId');
    window.location.href = 'index.html';
}