// DOM要素の取得
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadPreview = document.getElementById('upload-preview');
const previewImage = document.getElementById('preview-image');
const changeImageBtn = document.getElementById('change-image-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const resultSection = document.getElementById('result-section');
const loadingContainer = document.getElementById('loading-container');
const resultsContainer = document.getElementById('results-container');
const resultSummary = document.getElementById('result-summary');
const resultsGrid = document.getElementById('results-grid');
const noResults = document.getElementById('no-results');
const backBtn = document.getElementById('back-btn');

let currentImageFile = null;

// アップロードエリアのイベントリスナー
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
uploadArea.addEventListener('dragleave', handleDragLeave);

// ファイル選択のイベントリスナー
fileInput.addEventListener('change', handleFileSelect);
changeImageBtn.addEventListener('click', () => fileInput.click());
analyzeBtn.addEventListener('click', analyzeImage);
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// ドラッグオーバー処理
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

// ドラッグ離脱処理
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

// ドロップ処理
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// ファイル選択処理
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// ファイル処理
function handleFile(file) {
    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
        showMessage('画像ファイルを選択してください', 'error');
        return;
    }
    
    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
        showMessage('ファイルサイズは10MB以下にしてください', 'error');
        return;
    }
    
    currentImageFile = file;
    showImagePreview(file);
}

// 画像プレビュー表示
function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 画像解析実行
async function analyzeImage() {
    if (!currentImageFile) {
        showMessage('画像を選択してください', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // 画像をBase64に変換
        const base64 = await convertToBase64(currentImageFile);
        
        // trace.moe APIに送信
        const results = await searchAnime(base64);
        
        hideLoading();
        displayResults(results);
        
    } catch (error) {
        console.error('解析エラー:', error);
        hideLoading();
        showMessage('解析中にエラーが発生しました。もう一度お試しください。', 'error');
    }
}

// ファイルをBase64に変換
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// trace.moe APIで検索
async function searchAnime(base64Image) {
    const response = await fetch('https://api.trace.moe/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image: base64Image
        })
    });
    
    if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

// 結果表示
function displayResults(data) {
    resultSection.style.display = 'block';
    resultsContainer.style.display = 'block';
    noResults.style.display = 'none';
    
    // 結果概要
    const resultCount = data.result ? data.result.length : 0;
    resultSummary.textContent = `${resultCount}件の候補が見つかりました`;
    
    if (resultCount === 0) {
        resultsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    // 結果をグリッドに表示
    resultsGrid.innerHTML = '';
    data.result.slice(0, 6).forEach((result, index) => {
        const resultCard = createResultCard(result, index + 1);
        resultsGrid.appendChild(resultCard);
    });
}

// 結果カード作成
function createResultCard(result, rank) {
    const similarity = (result.similarity * 100).toFixed(1);
    const isHighConfidence = result.similarity > 0.85;
    
    // 時間を分:秒形式に変換
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const card = document.createElement('div');
    card.className = `result-card ${isHighConfidence ? 'high-confidence' : ''}`;
    
    card.innerHTML = `
        <div class="result-rank">#${rank}</div>
        <div class="result-confidence">
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${similarity}%"></div>
            </div>
            <span class="confidence-text">${similarity}%一致</span>
        </div>
        
        <div class="result-image">
            <img src="${result.image}" alt="アニメシーン" loading="lazy">
            <div class="similarity-badge ${isHighConfidence ? 'high' : ''}">${similarity}%</div>
        </div>
        
        <div class="result-info">
            <h3 class="anime-title">${result.filename || '不明な作品'}</h3>
            
            <div class="episode-info">
                <div class="info-item">
                    <span class="info-label">📺 話数:</span>
                    <span class="info-value">${result.episode || '不明'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">⏰ 時間:</span>
                    <span class="info-value">${formatTime(result.from)} - ${formatTime(result.to)}</span>
                </div>
            </div>
            
            ${result.anilist ? `
                <div class="additional-info">
                    <div class="anilist-info">
                        <div class="anilist-item">
                            <span class="info-label">🎭 ジャンル:</span>
                            <span class="info-value">${result.anilist.isAdult ? '成人向け' : '一般向け'}</span>
                        </div>
                        ${result.anilist.title ? `
                            <div class="anilist-item">
                                <span class="info-label">🏷️ 正式名:</span>
                                <span class="info-value">${result.anilist.title.romaji || result.anilist.title.native}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="result-actions">
            <button onclick="openAnimeInfo('${result.anilist?.id || ''}')" class="info-btn" ${!result.anilist?.id ? 'disabled' : ''}>
                📖 詳細情報
            </button>
            <button onclick="copyResult(${JSON.stringify(result).replace(/"/g, '&quot;')})" class="copy-btn">
                📋 結果をコピー
            </button>
        </div>
    `;
    
    return card;
}

// アニメ詳細情報を開く
function openAnimeInfo(anilistId) {
    if (anilistId) {
        window.open(`https://anilist.co/anime/${anilistId}`, '_blank');
    }
}

// 結果をコピー
function copyResult(result) {
    const text = `
アニメ: ${result.filename || '不明'}
話数: ${result.episode || '不明'}
時間: ${Math.floor(result.from / 60)}:${Math.floor(result.from % 60).toString().padStart(2, '0')} - ${Math.floor(result.to / 60)}:${Math.floor(result.to % 60).toString().padStart(2, '0')}
一致度: ${(result.similarity * 100).toFixed(1)}%
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        showMessage('結果をコピーしました！', 'success');
    }).catch(() => {
        showMessage('コピーに失敗しました', 'error');
    });
}

// ローディング表示
function showLoading() {
    resultSection.style.display = 'block';
    loadingContainer.style.display = 'block';
    resultsContainer.style.display = 'none';
    noResults.style.display = 'none';
}

// ローディング非表示
function hideLoading() {
    loadingContainer.style.display = 'none';
}

// メッセージ表示
function showMessage(message, type = 'info') {
    // 既存のメッセージを削除
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="message-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // アニメーション表示
    setTimeout(() => messageDiv.classList.add('show'), 100);
    
    // 自動削除
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // 初期状態では結果セクションを非表示
    resultSection.style.display = 'none';
    uploadPreview.style.display = 'none';
});