import { db } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const facilityId = document.getElementById('facility-id').value;
        const password = document.getElementById('password').value;

        try {
            await authenticateFacility(facilityId, password);
            sessionStorage.setItem('facilityId', facilityId);
            window.location.href = 'home.html';
        } catch (error) {
            showError('ログインに失敗しました。施設IDとパスワードを確認してください。');
        }
    });

    async function authenticateFacility(facilityId, password) {
        const facilitiesRef = collection(db, 'facilities');
        const q = query(facilitiesRef, where('id', '==', facilityId), where('password', '==', password));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('Invalid credentials');
        }
        
        return true;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});