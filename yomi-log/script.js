// アプリケーションの状態管理
class YomiLogApp {
    constructor() {
        this.currentScreen = 'home-screen';
        this.userData = this.loadUserData();
        this.scanner = null;
        this.isScanning = false;
        this.lastSearchResults = null;
        
        // レベル定義（仕様書通り）
        this.levelDefinitions = [
            { level: 1, requiredBooks: 0, name: '卵', image: 'level1.png' },
            { level: 2, requiredBooks: 5, name: 'ヒヨコ', image: 'level2.png' },
            { level: 3, requiredBooks: 10, name: '小ドラゴン', image: 'level3.png' },
            { level: 4, requiredBooks: 20, name: '成長ドラゴン', image: 'level4.png' },
            { level: 5, requiredBooks: 35, name: '青年ドラゴン', image: 'level5.png' },
            { level: 6, requiredBooks: 50, name: '騎士竜', image: 'level6.png' },
            { level: 7, requiredBooks: 70, name: '賢者竜', image: 'level7.png' },
            { level: 8, requiredBooks: 85, name: '飛翔竜', image: 'level8.png' },
            { level: 9, requiredBooks: 99, name: '天空竜', image: 'level9.png' },
            { level: 10, requiredBooks: 100, name: '伝説のドラゴン', image: 'level10.png' }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateHomeScreen();
        this.showScreen('home-screen');
    }

    // ローカルストレージからユーザーデータを読み込み
    loadUserData() {
        const saved = localStorage.getItem('yomilog-data');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            level: 1,
            exp: 0,
            registeredBooks: []
        };
    }

    // ユーザーデータをローカルストレージに保存
    saveUserData() {
        localStorage.setItem('yomilog-data', JSON.stringify(this.userData));
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // ホーム画面のボタン
        document.getElementById('scan-book-btn').addEventListener('click', () => {
            this.showBookRegistration('camera');
        });

        document.getElementById('show-log-btn').addEventListener('click', () => {
            this.showLogScreen();
        });

        document.getElementById('manual-input-btn').addEventListener('click', () => {
            this.showBookRegistration('manual');
        });

        document.getElementById('title-search-btn').addEventListener('click', () => {
            this.showBookRegistration('title');
        });

        // 書籍登録画面のボタン
        document.getElementById('back-to-home').addEventListener('click', () => {
            this.stopScanner();
            this.showScreen('home-screen');
        });

        document.getElementById('search-book-btn').addEventListener('click', () => {
            this.searchBookManually();
        });

        document.getElementById('search-title-btn').addEventListener('click', () => {
            this.searchBookByTitle();
        });

        document.getElementById('register-book-btn').addEventListener('click', () => {
            this.registerBook();
        });

        // ログ画面のボタン
        document.getElementById('back-to-home-from-log').addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        // 手動ISBN入力でEnterキー対応
        document.getElementById('manual-isbn').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchBookManually();
            }
        });

        // タイトル検索でEnterキー対応
        document.getElementById('title-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchBookByTitle();
            }
        });

        // 戻るボタンのイベントリスナー
        document.getElementById('back-to-title-search').addEventListener('click', () => {
            this.showTitleSearch();
        });

        document.getElementById('back-to-search-results').addEventListener('click', () => {
            this.showLastSearchResults();
        });
    }

    // 画面切り替え
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
        this.currentScreen = screenId;
    }

    // ホーム画面の更新
    updateHomeScreen() {
        const totalBooks = this.userData.registeredBooks.reduce((sum, book) => sum + book.count, 0);
        const currentLevel = this.calculateLevel(totalBooks);
        const levelInfo = this.levelDefinitions[currentLevel - 1];
        const nextLevelInfo = this.levelDefinitions[currentLevel] || this.levelDefinitions[this.levelDefinitions.length - 1];

        // キャラクター情報の更新
        document.getElementById('character-image').src = `image/${levelInfo.image}`;
        document.getElementById('character-name').textContent = levelInfo.name;
        document.getElementById('current-level').textContent = currentLevel;
        document.getElementById('total-books').textContent = totalBooks;

        // プログレスバーと次のレベルまでの表示
        const booksToNext = nextLevelInfo.requiredBooks - totalBooks;
        document.getElementById('books-to-next').textContent = Math.max(0, booksToNext);

        const progress = currentLevel >= 10 ? 100 : 
            ((totalBooks - levelInfo.requiredBooks) / (nextLevelInfo.requiredBooks - levelInfo.requiredBooks)) * 100;
        document.getElementById('progress-fill').style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }

    // レベル計算
    calculateLevel(totalBooks) {
        for (let i = this.levelDefinitions.length - 1; i >= 0; i--) {
            if (totalBooks >= this.levelDefinitions[i].requiredBooks) {
                return this.levelDefinitions[i].level;
            }
        }
        return 1;
    }

    // 書籍登録画面の表示
    showBookRegistration(mode = 'camera') {
        this.showScreen('book-registration-screen');
        this.hideAllBookRegistrationSections();

        if (mode === 'camera') {
            this.startScanner();
        } else if (mode === 'manual') {
            this.showManualInput();
        } else if (mode === 'title') {
            this.showTitleSearch();
        }
    }

    // 書籍登録画面の全セクションを非表示
    hideAllBookRegistrationSections() {
        document.getElementById('scanner-container').classList.add('hidden');
        document.getElementById('manual-input-container').classList.add('hidden');
        document.getElementById('title-search-container').classList.add('hidden');
        document.getElementById('search-results-container').classList.add('hidden');
        document.getElementById('book-info-container').classList.add('hidden');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
    }

    // 手動入力画面の表示
    showManualInput() {
        this.hideAllBookRegistrationSections();
        document.getElementById('manual-input-container').classList.remove('hidden');
        document.getElementById('manual-isbn').value = '';
        document.getElementById('manual-isbn').focus();
    }

    // タイトル検索画面の表示
    showTitleSearch() {
        this.hideAllBookRegistrationSections();
        document.getElementById('title-search-container').classList.remove('hidden');
        document.getElementById('title-search-input').value = '';
        document.getElementById('title-search-input').focus();
    }

    // カメラスキャナーの開始
    async startScanner() {
        this.hideAllBookRegistrationSections();
        document.getElementById('scanner-container').classList.remove('hidden');

        try {
            const video = document.getElementById('scanner-video');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            video.srcObject = stream;

            // ZXingスキャナーの設定
            this.scanner = new ZXing.BrowserMultiFormatReader();
            this.isScanning = true;

            // スキャン開始
            this.scanner.decodeFromVideoDevice(null, video, (result, err) => {
                if (result && this.isScanning) {
                    const isbn = this.validateISBN(result.text);
                    if (isbn) {
                        this.stopScanner();
                        this.searchBook(isbn);
                    }
                }
            });

        } catch (error) {
            console.error('カメラアクセスエラー:', error);
            document.getElementById('scanner-status').textContent = 
                '📱 カメラにアクセスできません。手動入力をお試しください。';
            setTimeout(() => this.showManualInput(), 2000);
        }
    }

    // スキャナーの停止
    stopScanner() {
        this.isScanning = false;
        if (this.scanner) {
            this.scanner.reset();
        }
        const video = document.getElementById('scanner-video');
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }

    // ISBN形式の検証
    validateISBN(text) {
        const isbn = text.replace(/[-\s]/g, '');
        if (/^978\d{10}$/.test(isbn) || /^979\d{10}$/.test(isbn)) {
            return isbn;
        }
        return null;
    }

    // 手動検索
    searchBookManually() {
        const isbnInput = document.getElementById('manual-isbn').value.trim();
        const isbn = this.validateISBN(isbnInput);
        
        if (!isbn) {
            this.showError('正しい13桁のISBNを入力してください（例：9784567890123）');
            return;
        }
        
        this.searchBook(isbn);
    }

    // タイトル検索
    async searchBookByTitle() {
        const titleInput = document.getElementById('title-search-input').value.trim();
        
        if (!titleInput) {
            this.showError('本のタイトルを入力してください');
            return;
        }
        
        this.hideAllBookRegistrationSections();
        document.getElementById('loading').classList.remove('hidden');

        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(titleInput)}&maxResults=10&langRestrict=ja`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                this.lastSearchResults = data.items;
                this.showSearchResults(data.items);
            } else {
                this.showError(`「${titleInput}」に関連する書籍が見つかりませんでした`);
            }
        } catch (error) {
            console.error('検索エラー:', error);
            this.showError('書籍検索に失敗しました');
        }
    }

    // 最後の検索結果を再表示
    showLastSearchResults() {
        if (this.lastSearchResults) {
            this.showSearchResults(this.lastSearchResults);
        }
    }

    // 検索結果の表示
    showSearchResults(items) {
        this.hideAllBookRegistrationSections();
        
        const resultsContainer = document.getElementById('search-results-container');
        const resultsList = document.getElementById('search-results-list');
        
        resultsList.innerHTML = items.map((item, index) => {
            const book = item.volumeInfo;
            const thumbnail = book.imageLinks?.thumbnail || '';
            const title = book.title || '不明';
            const authors = book.authors ? book.authors.join(', ') : '不明';
            const year = book.publishedDate ? new Date(book.publishedDate).getFullYear() : '';
            
            return `
                <div class="search-result-item" data-index="${index}">
                    <div class="search-result-content">
                        <img class="search-result-image" src="${thumbnail}" alt="書籍画像">
                        <div class="search-result-details">
                            <div class="search-result-title">${title}</div>
                            <div class="search-result-author">${authors}</div>
                            <div class="search-result-year">${year}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultsContainer.classList.remove('hidden');
        
        // 検索結果のクリックイベントを追加
        resultsList.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (resultItem) {
                const index = parseInt(resultItem.dataset.index);
                this.selectSearchResult(items[index]);
            }
        });
    }

    // 検索結果から本を選択
    selectSearchResult(item) {
        const book = item.volumeInfo;
        const bookData = {
            isbn: this.getISBNFromItem(item) || 'unknown_' + Date.now(),
            title: book.title || '不明',
            authors: book.authors || ['不明'],
            thumbnail: book.imageLinks?.thumbnail || ''
        };
        
        this.showBookInfo(bookData, true);
    }

    // 書籍アイテムからISBNを取得
    getISBNFromItem(item) {
        if (item.volumeInfo.industryIdentifiers) {
            for (const identifier of item.volumeInfo.industryIdentifiers) {
                if (identifier.type === 'ISBN_13') {
                    return identifier.identifier;
                }
                if (identifier.type === 'ISBN_10') {
                    return identifier.identifier;
                }
            }
        }
        return null;
    }

    // Google Books APIで書籍検索
    async searchBook(isbn) {
        this.hideAllBookRegistrationSections();
        document.getElementById('loading').classList.remove('hidden');

        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const book = data.items[0].volumeInfo;
                this.showBookInfo({
                    isbn: isbn,
                    title: book.title || '不明',
                    authors: book.authors || ['不明'],
                    thumbnail: book.imageLinks?.thumbnail || ''
                });
            } else {
                this.showError('書籍情報が見つかりませんでした');
            }
        } catch (error) {
            console.error('API エラー:', error);
            this.showError('書籍情報の取得に失敗しました');
        }
    }

    // 書籍情報の表示
    showBookInfo(bookData, fromSearchResults = false) {
        this.hideAllBookRegistrationSections();
        
        document.getElementById('book-thumbnail').src = bookData.thumbnail;
        document.getElementById('book-title').textContent = bookData.title;
        document.getElementById('book-author').textContent = `著者: ${bookData.authors.join(', ')}`;
        document.getElementById('book-isbn').textContent = `ISBN: ${bookData.isbn}`;
        
        // 検索結果から来た場合は戻るボタンを表示
        const backButton = document.getElementById('back-to-search-results');
        if (fromSearchResults) {
            backButton.classList.remove('hidden');
        } else {
            backButton.classList.add('hidden');
        }
        
        document.getElementById('book-info-container').classList.remove('hidden');
        
        // 登録ボタンにデータを保存
        this.currentBookData = bookData;
    }

    // 本の登録
    registerBook() {
        if (!this.currentBookData) return;

        // ISBN、または タイトル+著者で既存の本を検索
        const existingBook = this.userData.registeredBooks.find(book => {
            if (this.currentBookData.isbn && !this.currentBookData.isbn.startsWith('unknown_')) {
                return book.isbn === this.currentBookData.isbn;
            } else {
                return book.title === this.currentBookData.title && 
                       book.authors.join(',') === this.currentBookData.authors.join(',');
            }
        });

        if (existingBook) {
            existingBook.count++;
            existingBook.readAt = new Date().toISOString();
        } else {
            this.userData.registeredBooks.push({
                isbn: this.currentBookData.isbn,
                title: this.currentBookData.title,
                authors: this.currentBookData.authors,
                thumbnail: this.currentBookData.thumbnail,
                readAt: new Date().toISOString(),
                count: 1
            });
        }

        this.saveUserData();
        this.updateHomeScreen();
        this.showRegistrationSuccess();
    }

    // 登録成功の表示
    showRegistrationSuccess() {
        const totalBooks = this.userData.registeredBooks.reduce((sum, book) => sum + book.count, 0);
        const newLevel = this.calculateLevel(totalBooks);
        const oldLevel = this.userData.level;

        if (newLevel > oldLevel) {
            this.userData.level = newLevel;
            this.saveUserData();
            alert(`🎉 レベルアップ！レベル ${newLevel} になりました！\n${this.levelDefinitions[newLevel - 1].name} に進化しました！`);
        } else {
            alert('📖 読み聞かせを記録しました！');
        }

        this.showScreen('home-screen');
    }

    // エラー表示
    showError(message) {
        this.hideAllBookRegistrationSections();
        document.getElementById('error-message').querySelector('p').textContent = `❌ ${message}`;
        document.getElementById('error-message').classList.remove('hidden');
    }

    // ログ画面の表示
    showLogScreen() {
        this.showScreen('log-screen');
        this.updateLogScreen();
    }

    // ログ画面の更新
    updateLogScreen() {
        const totalBooks = this.userData.registeredBooks.reduce((sum, book) => sum + book.count, 0);
        const uniqueBooks = this.userData.registeredBooks.length;

        document.getElementById('log-total-books').textContent = totalBooks;
        document.getElementById('log-unique-books').textContent = uniqueBooks;

        const logList = document.getElementById('log-list');
        const noLogs = document.getElementById('no-logs');

        if (this.userData.registeredBooks.length === 0) {
            logList.innerHTML = '';
            noLogs.classList.remove('hidden');
            return;
        }

        noLogs.classList.add('hidden');
        
        // 読書日時でソート（新しい順）
        const sortedBooks = [...this.userData.registeredBooks].sort((a, b) => 
            new Date(b.readAt) - new Date(a.readAt)
        );

        logList.innerHTML = sortedBooks.map(book => {
            const readDate = new Date(book.readAt).toLocaleDateString('ja-JP');
            return `
                <div class="log-item">
                    <div class="log-item-header">
                        <span class="log-date">${readDate}</span>
                        <span class="log-count">${book.count}回</span>
                    </div>
                    <div class="log-book-title">${book.title}</div>
                    <div class="log-book-author">${book.authors.join(', ')}</div>
                </div>
            `;
        }).join('');
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new YomiLogApp();
});

// サービスワーカーの登録（オフライン対応・将来的な機能拡張用）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 現在はサービスワーカーファイルがないのでコメントアウト
        // navigator.serviceWorker.register('./sw.js');
    });
}