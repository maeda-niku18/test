import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

let allUsers = [];
let currentClassFilter = 'all';
let currentSortOption = 'name';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadUsers();
});

function checkAuth() {
    const facilityId = sessionStorage.getItem('facilityId');
    if (!facilityId) {
        window.location.href = 'index.html';
        return;
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const classFilters = document.querySelectorAll('input[name="class-filter"]');
    const sortSelect = document.getElementById('sort-select');

    searchInput.addEventListener('input', filterAndSortUsers);
    
    classFilters.forEach(filter => {
        filter.addEventListener('change', (e) => {
            currentClassFilter = e.target.value;
            filterAndSortUsers();
        });
    });

    sortSelect.addEventListener('change', (e) => {
        currentSortOption = e.target.value;
        filterAndSortUsers();
    });
}

async function loadUsers() {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        allUsers = [];
        querySnapshot.forEach((doc) => {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        filterAndSortUsers();
    } catch (error) {
        console.error('ユーザーの読み込みに失敗しました:', error);
        document.getElementById('users-container').innerHTML = 
            '<div class="card"><p>ユーザーの読み込みに失敗しました。</p></div>';
    }
}

function filterAndSortUsers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm);
        const matchesClass = currentClassFilter === 'all' || user.class === currentClassFilter;
        return matchesSearch && matchesClass;
    });

    // ソート
    filteredUsers.sort((a, b) => {
        switch (currentSortOption) {
            case 'name':
                return a.name.localeCompare(b.name, 'ja');
            case 'class':
                return a.class.localeCompare(b.class, 'ja');
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });

    displayUsers(filteredUsers);
}

function displayUsers(users) {
    const container = document.getElementById('users-container');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="card"><p>該当するユーザーが見つかりませんでした。</p></div>';
        return;
    }

    const usersHtml = users.map(user => `
        <div class="card user-card">
            <div>
                <div class="user-name">${user.name}</div>
                <div class="user-class">${user.class}</div>
                <div class="book-info">ユーザータイプ: ${getUserTypeText(user.userType)}</div>
                <div class="book-info">登録日: ${formatDate(user.createdAt)}</div>
            </div>
            <div>
                <span class="status-label available">
                    ${getClassIcon(user.class)}
                </span>
            </div>
        </div>
    `).join('');

    container.innerHTML = usersHtml;
}

function getUserTypeText(userType) {
    switch (userType) {
        case 'child': return '園児';
        case 'teacher': return '先生';
        case 'staff': return 'スタッフ';
        default: return '不明';
    }
}

function getClassIcon(className) {
    switch (className) {
        case '年少組': return '🌱';
        case '年中組': return '🌿';
        case '年長組': return '🌳';
        default: return '👤';
    }
}

function formatDate(dateString) {
    if (!dateString) return '不明';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
}

function logout() {
    sessionStorage.removeItem('facilityId');
    window.location.href = 'index.html';
}