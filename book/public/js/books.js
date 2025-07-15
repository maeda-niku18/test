import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

let allBooks = [];
let currentFilters = {
    available: true,
    borrowed: true,
    lost: true
};

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadBooks();
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
    const filterAvailable = document.getElementById('filter-available');
    const filterBorrowed = document.getElementById('filter-borrowed');
    const filterLost = document.getElementById('filter-lost');
    const modal = document.getElementById('book-modal');
    const closeBtn = document.querySelector('.close');

    searchInput.addEventListener('input', filterBooks);
    filterAvailable.addEventListener('change', updateFilters);
    filterBorrowed.addEventListener('change', updateFilters);
    filterLost.addEventListener('change', updateFilters);

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function loadBooks() {
    try {
        const booksRef = collection(db, 'books');
        const querySnapshot = await getDocs(booksRef);
        
        allBooks = [];
        querySnapshot.forEach((doc) => {
            allBooks.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayBooks(allBooks);
    } catch (error) {
        console.error('書籍の読み込みに失敗しました:', error);
        document.getElementById('books-container').innerHTML = 
            '<div class="card"><p>書籍の読み込みに失敗しました。</p></div>';
    }
}

function updateFilters() {
    currentFilters.available = document.getElementById('filter-available').checked;
    currentFilters.borrowed = document.getElementById('filter-borrowed').checked;
    currentFilters.lost = document.getElementById('filter-lost').checked;
    filterBooks();
}

function filterBooks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filteredBooks = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm);
        const matchesFilter = currentFilters[book.status] || false;
        return matchesSearch && matchesFilter;
    });

    displayBooks(filteredBooks);
}

function displayBooks(books) {
    const container = document.getElementById('books-container');
    
    if (books.length === 0) {
        container.innerHTML = '<div class="card"><p>該当する書籍が見つかりませんでした。</p></div>';
        return;
    }

    const booksHtml = books.map(book => `
        <div class="card book-card" onclick="showBookDetails('${book.id}')">
            <div class="book-title">${book.title}</div>
            <div class="book-info">ISBN: ${book.isbn || '不明'}</div>
            <div class="book-info">場所: ${book.location || '不明'}</div>
            <div class="book-info">追加日: ${formatDate(book.addedAt)}</div>
            <div style="margin-top: 0.5rem;">
                <span class="status-label ${book.status}">
                    ${getStatusText(book.status)}
                </span>
            </div>
            ${book.remarks ? `<div class="book-info" style="margin-top: 0.5rem;">備考: ${book.remarks}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = booksHtml;
}

function getStatusText(status) {
    switch (status) {
        case 'available': return '貸出可能';
        case 'borrowed': return '貸出中';
        case 'lost': return '紛失';
        default: return '不明';
    }
}

function formatDate(dateString) {
    if (!dateString) return '不明';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
}

async function showBookDetails(bookId) {
    const modal = document.getElementById('book-modal');
    const detailsContainer = document.getElementById('book-details');
    
    try {
        const bookDoc = await getDoc(doc(db, 'books', bookId));
        if (!bookDoc.exists()) {
            detailsContainer.innerHTML = '<p>書籍が見つかりませんでした。</p>';
            modal.style.display = 'block';
            return;
        }

        const book = { id: bookDoc.id, ...bookDoc.data() };
        
        const detailsHtml = `
            <h2>${book.title}</h2>
            <div class="book-info"><strong>ISBN:</strong> ${book.isbn || '不明'}</div>
            <div class="book-info"><strong>場所:</strong> ${book.location || '不明'}</div>
            <div class="book-info"><strong>追加日:</strong> ${formatDate(book.addedAt)}</div>
            <div class="book-info" style="margin-top: 1rem;">
                <strong>ステータス:</strong> 
                <span class="status-label ${book.status}">
                    ${getStatusText(book.status)}
                </span>
            </div>
            ${book.remarks ? `<div class="book-info" style="margin-top: 1rem;"><strong>備考:</strong><br>${book.remarks}</div>` : ''}
            
            <h3 style="margin-top: 2rem;">貸出履歴</h3>
            <div id="lending-history">
                <p>貸出履歴機能は今後実装予定です。</p>
            </div>
        `;

        detailsContainer.innerHTML = detailsHtml;
        modal.style.display = 'block';
    } catch (error) {
        console.error('書籍詳細の読み込みに失敗しました:', error);
        detailsContainer.innerHTML = '<p>書籍詳細の読み込みに失敗しました。</p>';
        modal.style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('facilityId');
    window.location.href = 'index.html';
}