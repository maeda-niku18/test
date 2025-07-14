import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBKhb3ctxhr-KT_4z32Iyfjo_tOc7LpImA",
    authDomain: "auth-test-ba58c.firebaseapp.com",
    projectId: "auth-test-ba58c",
    storageBucket: "auth-test-ba58c.firebasestorage.app",
    messagingSenderId: "856692946306",
    appId: "1:856692946306:web:d8cbddf97686f542bd0b9b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = null;
let currentRoom = null;
let messagesUnsubscribe = null;
let selectedMessageId = null;
let stampList = [];

// ページ読み込み時にlocalStorageからユーザー情報を復元とスタンプ読み込み
window.addEventListener('load', async function() {
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            // 保存されたユーザー情報がある場合、直接部屋一覧へ
            document.getElementById('username-screen').classList.remove('active');
            document.getElementById('rooms-screen').classList.add('active');
            document.getElementById('user-info').textContent = `ログイン中: ${currentUser.name}`;
            
            // 入力フィールドに前回の値を設定
            document.getElementById('username-input').value = currentUser.name;
            document.getElementById('user-number-input').value = currentUser.number;
        } catch (error) {
            console.error('保存されたユーザー情報の復元に失敗:', error);
            localStorage.removeItem('chatUser');
        }
    }
    
    // スタンプを読み込み
    loadStamps();
    
    // NGワードフィルターを初期化（確実に読み込むまで待機）
    await initializeNGFilterWithRetry();
});

// スタンプを動的に読み込む関数
async function loadStamps() {
    try {
        // まずstamp_list.jsonから読み込み
        const response = await fetch('stamp/stamp_list.json');
        if (response.ok) {
            const stampFiles = await response.json();
            stampList = stampFiles;
            console.log('スタンプリスト読み込み成功:', stampList);
            renderStampGrid();
            return;
        }
    } catch (error) {
        console.error('stamp_list.jsonの読み込みに失敗:', error);
    }
    
    try {
        // フォールバック: 動的検出
        const stampFiles = await detectStampFiles();
        stampList = stampFiles;
        console.log('動的検出結果:', stampList);
        renderStampGrid();
    } catch (error) {
        console.error('スタンプの読み込みに失敗:', error);
        // 最終フォールバック
        stampList = [];
        renderStampGrid();
    }
}

// スタンプファイルを検出する関数（フォールバック用）
async function detectStampFiles() {
    const stampFiles = [];
    
    // よくある名前パターンを試行
    const commonNames = [
        'pan.png', 'wait_wolf.png', 'fly_bard.png', 'hangry_wolf.png', 
        'wait_sheep.png', 'god_sheep.png', 'good_sheep.png',
        'sample1.png', 'sample2.png', 'sample3.png', 
        'heart.png', 'smile.png', 'thumbs.png'
    ];
    
    for (const name of commonNames) {
        try {
            const response = await fetch(`stamp/${name}`);
            if (response.ok && !stampFiles.includes(name)) {
                stampFiles.push(name);
            }
        } catch (error) {
            // ファイルが存在しない場合は無視
        }
    }
    
    // 1から50まで試行して存在するpngファイルを検出
    for (let i = 1; i <= 50; i++) {
        const filename = `stamp${i}.png`;
        try {
            const response = await fetch(`stamp/${filename}`);
            if (response.ok && !stampFiles.includes(filename)) {
                stampFiles.push(filename);
            }
        } catch (error) {
            // ファイルが存在しない場合は無視
        }
    }
    
    return stampFiles;
}

// スタンプグリッドを描画する関数
function renderStampGrid() {
    const stampGrid = document.getElementById('stamp-grid');
    stampGrid.innerHTML = '';
    
    if (stampList.length === 0) {
        stampGrid.innerHTML = '<p style="text-align: center; color: #718096;">スタンプが見つかりませんでした</p>';
        return;
    }
    
    console.log('スタンプを描画中:', stampList);
    
    stampList.forEach(stampFile => {
        const img = document.createElement('img');
        img.src = `stamp/${stampFile}`;
        img.className = 'stamp-item';
        img.alt = stampFile;
        img.onclick = () => sendStamp(stampFile);
        
        // 画像読み込み成功時のログ
        img.onload = () => {
            console.log('スタンプ読み込み成功:', stampFile);
        };
        
        // 画像読み込みエラーの場合の処理
        img.onerror = () => {
            console.error('スタンプ読み込み失敗:', stampFile);
            img.style.display = 'none';
        };
        
        stampGrid.appendChild(img);
    });
}

// スタンプメニューの表示/非表示を切り替え
window.toggleStampMenu = function() {
    const stampMenu = document.getElementById('stamp-menu');
    stampMenu.classList.toggle('active');
};

// スタンプを送信する関数
window.sendStamp = async function(stampFile) {
    if (!currentUser || !currentRoom) return;
    
    try {
        await addDoc(collection(db, 'rooms', currentRoom, 'messages'), {
            type: 'stamp',
            stampFile: stampFile,
            userId: currentUser.id,
            userName: currentUser.name,
            userDisplayName: currentUser.displayName,
            timestamp: serverTimestamp(),
            reactions: {}
        });
        
        // スタンプメニューを閉じる
        document.getElementById('stamp-menu').classList.remove('active');
    } catch (error) {
        console.error('スタンプ送信エラー:', error);
    }
};

window.setUsername = async function() {
    const usernameInput = document.getElementById('username-input');
    const userNumberInput = document.getElementById('user-number-input');
    const username = usernameInput.value.trim();
    const userNumber = userNumberInput.value.trim();
    
    if (!username) {
        document.getElementById('username-error').textContent = 'ユーザー名を入力してください';
        return;
    }

    if (!userNumber || userNumber.length !== 5 || !/^\d{5}$/.test(userNumber)) {
        document.getElementById('username-error').textContent = '5桁の数字を入力してください';
        return;
    }

    // ユーザーIDを「ユーザー名#番号」の形式で生成
    const userId = `${username}#${userNumber}`;
    
    currentUser = {
        id: userId,
        name: username,
        number: userNumber,
        displayName: `${username}#${userNumber}`,
        timestamp: new Date()
    };

    // localStorageに保存
    localStorage.setItem('chatUser', JSON.stringify(currentUser));

    document.getElementById('username-screen').classList.remove('active');
    document.getElementById('rooms-screen').classList.add('active');
    document.getElementById('user-info').textContent = `ログイン中: ${currentUser.name}`;
};

window.joinRoom = function(roomId) {
    currentRoom = roomId;
    document.getElementById('room-title').textContent = getRoomName(roomId);
    document.getElementById('rooms-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    
    loadMessages();
};

window.backToRooms = function() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }
    document.getElementById('chat-screen').classList.remove('active');
    document.getElementById('rooms-screen').classList.add('active');
    currentRoom = null;
};

// ユーザー情報をリセットする関数（デバッグ用）
window.resetUser = function() {
    localStorage.removeItem('chatUser');
    currentUser = null;
    document.getElementById('rooms-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.remove('active');
    document.getElementById('username-screen').classList.add('active');
    document.getElementById('username-input').value = '';
    document.getElementById('user-number-input').value = '';
    document.getElementById('user-info').textContent = '';
};

function getRoomName(roomId) {
    const roomNames = {
        'general': '一般チャット',
        'random': '雑談ルーム',
        'tech': '技術討論'
    };
    return roomNames[roomId] || roomId;
}

window.sendMessage = async function() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    console.log('メッセージ送信開始:', message);
    
    if (!message || !currentUser || !currentRoom) {
        console.log('送信条件不足:', { message, currentUser, currentRoom });
        return;
    }

    // NGワードチェック
    console.log('NGフィルター状態:', {
        exists: !!window.ngFilter,
        initialized: window.ngFilter?.isInitialized
    });
    
    if (window.ngFilter && window.ngFilter.isInitialized) {
        console.log('NGワードチェック実行中...');
        const checkResult = window.ngFilter.checkMessage(message);
        console.log('チェック結果:', checkResult);
        
        if (!checkResult.isClean) {
            console.log('NGワード検出！送信を阻止します');
            
            // NGワードが検出された場合 - メッセージ送信を完全に阻止
            showNGWordError(checkResult.detectedWords);
            
            // 入力欄を赤くして警告
            messageInput.style.borderColor = '#e53e3e';
            messageInput.style.backgroundColor = '#fed7d7';
            
            // 2秒後に元に戻す
            setTimeout(() => {
                messageInput.style.borderColor = '#e2e8f0';
                messageInput.style.backgroundColor = 'white';
            }, 2000);
            
            return; // ここで完全に処理を終了
        }
        console.log('NGワードチェック通過');
    } else {
        console.warn('NGフィルターが初期化されていません');
    }

    try {
        console.log('Firestore送信開始');
        await addDoc(collection(db, 'rooms', currentRoom, 'messages'), {
            text: message,
            userId: currentUser.id,
            userName: currentUser.name,
            userDisplayName: currentUser.displayName,
            timestamp: serverTimestamp(),
            reactions: {}
        });
        
        console.log('メッセージ送信成功');
        messageInput.value = '';
    } catch (error) {
        console.error('メッセージ送信エラー:', error);
    }
};

// NGフィルター初期化（リトライ機能付き）
async function initializeNGFilterWithRetry() {
    let retryCount = 0;
    const maxRetries = 10;
    
    while (retryCount < maxRetries) {
        if (window.initializeNGFilter) {
            console.log('NGフィルター初期化開始');
            try {
                await window.initializeNGFilter();
                console.log('NGフィルター初期化完了');
                return;
            } catch (error) {
                console.error('NGフィルター初期化エラー:', error);
            }
        }
        
        console.log(`NGフィルター初期化待機中... (${retryCount + 1}/${maxRetries})`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('NGフィルターの初期化に失敗しました');
}

// NGワードエラー表示専用関数
function showNGWordError(detectedWords) {
    // 既存のエラーメッセージを削除
    const existingError = document.querySelector('.ng-word-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 新しいエラーメッセージを作成
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error ng-word-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.zIndex = '1000';
    errorDiv.textContent = `🚫 不適切な表現が含まれています: ${detectedWords.join(', ')}`;
    
    document.body.appendChild(errorDiv);
    
    // 5秒後に自動で削除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// エラー表示用の要素を作成
function createErrorElement() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error ng-word-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.zIndex = '1000';
    errorDiv.style.display = 'none';
    document.body.appendChild(errorDiv);
    return errorDiv;
}

function loadMessages() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }

    const messagesRef = collection(db, 'rooms', currentRoom, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageElement = createMessageElement(doc.id, messageData);
            messagesContainer.appendChild(messageElement);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function createMessageElement(messageId, messageData) {
    const messageDiv = document.createElement('div');
    const isOwnMessage = messageData.userId === currentUser.id;
    
    // スタンプメッセージの場合
    if (messageData.type === 'stamp') {
        messageDiv.className = `message stamp ${isOwnMessage ? 'own' : 'other'}`;
        messageDiv.onclick = () => showReactionMenu(messageId, messageDiv);
        
        const timestamp = messageData.timestamp ? new Date(messageData.timestamp.seconds * 1000) : new Date();
        const displayName = messageData.userName;
        
        messageDiv.innerHTML = `
            <div class="message-header">${displayName}</div>
            <img src="stamp/${messageData.stampFile}" alt="スタンプ" style="width: 240px; height: 240px; object-fit: cover; border-radius: 8px;">
            <div class="message-time">${timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="reactions">${renderReactions(messageData.reactions || {})}</div>
        `;
    } else {
        // 通常のテキストメッセージ
        messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
        messageDiv.onclick = () => showReactionMenu(messageId, messageDiv);
        
        const timestamp = messageData.timestamp ? new Date(messageData.timestamp.seconds * 1000) : new Date();
        const displayName = messageData.userName;
        
        messageDiv.innerHTML = `
            <div class="message-header">${displayName}</div>
            <div class="message-content">${messageData.text}</div>
            <div class="message-time">${timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="reactions">${renderReactions(messageData.reactions || {})}</div>
        `;
    }
    
    return messageDiv;
}

function renderReactions(reactions) {
    return Object.entries(reactions).map(([emoji, users]) => 
        users.length > 0 ? `<span class="reaction">${emoji} ${users.length}</span>` : ''
    ).join('');
}

window.showReactionMenu = function(messageId, messageElement) {
    selectedMessageId = messageId;
    const menu = document.getElementById('reaction-menu');
    const rect = messageElement.getBoundingClientRect();
    
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.classList.add('active');
    
    setTimeout(() => {
        document.addEventListener('click', hideReactionMenu);
    }, 100);
};

function hideReactionMenu() {
    document.getElementById('reaction-menu').classList.remove('active');
    document.removeEventListener('click', hideReactionMenu);
    selectedMessageId = null;
}

window.addReaction = async function(emoji) {
    if (!selectedMessageId || !currentUser || !currentRoom) return;
    
    try {
        const messageRef = doc(db, 'rooms', currentRoom, 'messages', selectedMessageId);
        
        await updateDoc(messageRef, {
            [`reactions.${emoji}`]: arrayUnion(currentUser.id)
        });
        
        hideReactionMenu();
    } catch (error) {
        console.error('リアクション追加エラー:', error);
    }
};

document.getElementById('message-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('username-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setUsername();
    }
});