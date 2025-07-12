// DOM要素の取得
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const pixelArtImage = document.getElementById('pixel-art-image');
const loadingSpinner = document.getElementById('loading-spinner');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const randomBtn = document.getElementById('random-btn');
const seedValue = document.getElementById('seed-value');
const generationTime = document.getElementById('generation-time');
const galleryGrid = document.getElementById('gallery-grid');
const backBtn = document.getElementById('back-btn');

// ローカルストレージのキー
const GALLERY_KEY = 'pixel-art-gallery';

// ランダムな文字列生成用の配列
const RANDOM_WORDS = [
    '星', '月', '太陽', '雲', '雨', '風', '花', '木', '山', '海',
    'dragon', 'phoenix', 'unicorn', 'magic', 'crystal', 'rainbow', 
    'adventure', 'mystery', 'legend', 'hero', 'dream', 'future',
    '冒険', '魔法', '宝石', '勇者', '伝説', '神秘', '奇跡', '希望'
];

// ギャラリーデータの読み込み
function loadGallery() {
    const gallery = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
    return gallery.slice(-6); // 最新6件のみ表示
}

// ギャラリーデータの保存
function saveToGallery(seed, imageUrl, timestamp) {
    const gallery = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
    gallery.push({ seed, imageUrl, timestamp });
    
    // 最大20件まで保存
    if (gallery.length > 20) {
        gallery.shift();
    }
    
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    updateGalleryDisplay();
}

// ギャラリー表示の更新
function updateGalleryDisplay() {
    const gallery = loadGallery();
    galleryGrid.innerHTML = '';
    
    gallery.reverse().forEach(item => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${item.imageUrl}" alt="ピクセルアート" loading="lazy">
            <div class="gallery-overlay">
                <div class="gallery-seed">${item.seed}</div>
                <div class="gallery-time">${new Date(item.timestamp).toLocaleString('ja-JP')}</div>
            </div>
        `;
        
        // クリックでそのシードを入力欄に設定
        galleryItem.addEventListener('click', () => {
            textInput.value = item.seed;
            generatePixelArt(item.seed);
        });
        
        galleryGrid.appendChild(galleryItem);
    });
}

// ピクセルアートの生成
async function generatePixelArt(seed) {
    if (!seed.trim()) {
        alert('文字を入力してください！');
        return;
    }
    
    // ローディング表示
    showLoading();
    resultSection.classList.add('visible');
    
    // タイトルの更新
    resultTitle.textContent = `「${seed}」さんのピクセルアートはこちらです！`;
    
    try {
        // APIのURL構築（シード値をURLエンコード）
        const encodedSeed = encodeURIComponent(seed);
        const apiUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodedSeed}&size=300`;
        
        // 画像の読み込み
        await loadImage(apiUrl);
        
        // 情報の更新
        seedValue.textContent = seed;
        generationTime.textContent = new Date().toLocaleString('ja-JP');
        
        // ギャラリーに保存
        saveToGallery(seed, apiUrl, Date.now());
        
        // ローディング非表示
        hideLoading();
        
        // ダウンロードボタンの設定
        downloadBtn.onclick = () => downloadImage(apiUrl, seed);
        shareBtn.onclick = () => copyToClipboard(apiUrl);
        
    } catch (error) {
        console.error('ピクセルアート生成エラー:', error);
        hideLoading();
        alert('ピクセルアートの生成に失敗しました。もう一度お試しください。');
    }
}

// 画像の読み込み
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            pixelArtImage.src = url;
            pixelArtImage.style.display = 'block';
            resolve();
        };
        img.onerror = reject;
        img.src = url;
    });
}

// ローディング表示
function showLoading() {
    loadingSpinner.style.display = 'block';
    pixelArtImage.style.display = 'none';
}

// ローディング非表示
function hideLoading() {
    loadingSpinner.style.display = 'none';
    pixelArtImage.style.display = 'block';
}

// 画像のダウンロード
async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `pixel-art-${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(downloadUrl);
        
        // 成功メッセージ
        showMessage('画像をダウンロードしました！ 📥');
    } catch (error) {
        console.error('ダウンロードエラー:', error);
        alert('ダウンロードに失敗しました。');
    }
}

// URLのコピー
function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        showMessage('URLをクリップボードにコピーしました！ 📋');
    }).catch(() => {
        // フォールバック
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('URLをクリップボードにコピーしました！ 📋');
    });
}

// ランダム生成
function generateRandom() {
    const randomWord = RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    const randomSeed = `${randomWord}${randomNumber}`;
    
    textInput.value = randomSeed;
    generatePixelArt(randomSeed);
}

// メッセージ表示
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-popup';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 2000);
}

// イベントリスナーの設定
generateBtn.addEventListener('click', () => {
    generatePixelArt(textInput.value);
});

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generatePixelArt(textInput.value);
    }
});

randomBtn.addEventListener('click', generateRandom);

backBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// 入力フィールドのフォーカス時アニメーション
textInput.addEventListener('focus', () => {
    textInput.parentElement.classList.add('focused');
});

textInput.addEventListener('blur', () => {
    textInput.parentElement.classList.remove('focused');
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    updateGalleryDisplay();
    
    // URLパラメータからシードを取得
    const urlParams = new URLSearchParams(window.location.search);
    const seedFromUrl = urlParams.get('seed');
    if (seedFromUrl) {
        textInput.value = seedFromUrl;
        generatePixelArt(seedFromUrl);
    }
});