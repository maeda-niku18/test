// ゲーム状態管理
let board = [];
let currentPlayer = 0; // 0:黒, 1:白, 2:赤, 3:青
let gameOver = false;
let passCount = 0;

const PLAYERS = [
    { name: '黒プレイヤー', color: 'black', className: 'black' },
    { name: '白プレイヤー', color: 'white', className: 'white' },
    { name: '赤プレイヤー', color: 'red', className: 'red' },
    { name: '青プレイヤー', color: 'blue', className: 'blue' }
];

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// DOM要素
const boardElement = document.getElementById('board');
const currentPlayerPiece = document.getElementById('current-player-piece');
const currentPlayerName = document.getElementById('current-player-name');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const gameOverModal = document.getElementById('game-over-modal');
const newGameBtn = document.getElementById('new-game-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// ボードの初期化
function initializeBoard() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    
    // 初期配置（中央4x4に各プレイヤーの駒を2つずつ配置）
    board[3][3] = 0; // 黒
    board[4][4] = 0; // 黒
    board[3][4] = 1; // 白
    board[4][3] = 1; // 白
    board[2][2] = 2; // 赤
    board[5][5] = 2; // 赤
    board[2][5] = 3; // 青
    board[5][2] = 3; // 青
    
    currentPlayer = 0;
    gameOver = false;
    passCount = 0;
    
    renderBoard();
    updateUI();
}

// ボードの描画
function renderBoard() {
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col] !== null) {
                const piece = document.createElement('div');
                piece.className = `piece ${PLAYERS[board[row][col]].className}`;
                cell.appendChild(piece);
            }
            
            // 有効な手かどうかチェック
            if (isValidMove(row, col, currentPlayer)) {
                cell.classList.add('valid-move');
                cell.addEventListener('click', () => makeMove(row, col));
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// 有効な手かどうか判定
function isValidMove(row, col, player) {
    if (board[row][col] !== null) return false;
    
    for (let direction of DIRECTIONS) {
        if (canFlip(row, col, direction[0], direction[1], player)) {
            return true;
        }
    }
    return false;
}

// 指定方向に駒をひっくり返せるかチェック
function canFlip(row, col, deltaRow, deltaCol, player) {
    let r = row + deltaRow;
    let c = col + deltaCol;
    let hasOpponent = false;
    
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (board[r][c] === null) return false;
        if (board[r][c] === player) return hasOpponent;
        hasOpponent = true;
        r += deltaRow;
        c += deltaCol;
    }
    
    return false;
}

// 駒をひっくり返す
function flipPieces(row, col, player) {
    for (let direction of DIRECTIONS) {
        if (canFlip(row, col, direction[0], direction[1], player)) {
            let r = row + direction[0];
            let c = col + direction[1];
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] !== player) {
                board[r][c] = player;
                r += direction[0];
                c += direction[1];
            }
        }
    }
}

// 手を打つ
function makeMove(row, col) {
    if (!isValidMove(row, col, currentPlayer) || gameOver) return;
    
    board[row][col] = currentPlayer;
    flipPieces(row, col, currentPlayer);
    
    passCount = 0;
    nextPlayer();
}

// 次のプレイヤーに交代
function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % 4;
    
    // 有効な手があるかチェック
    if (!hasValidMoves(currentPlayer)) {
        passCount++;
        // 全プレイヤーがパスした場合、ゲーム終了
        if (passCount >= 4) {
            endGame();
            return;
        }
        
        // 次のプレイヤーに
        setTimeout(() => {
            showPassMessage();
            nextPlayer();
        }, 1000);
        return;
    }
    
    passCount = 0;
    renderBoard();
    updateUI();
}

// パスメッセージを表示
function showPassMessage() {
    const message = document.createElement('div');
    message.className = 'pass-message';
    message.textContent = `${PLAYERS[currentPlayer].name}はパスです`;
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 1500);
}

// 有効な手があるかチェック
function hasValidMoves(player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(row, col, player)) {
                return true;
            }
        }
    }
    return false;
}

// スコア計算
function calculateScores() {
    const scores = [0, 0, 0, 0];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] !== null) {
                scores[board[row][col]]++;
            }
        }
    }
    
    return scores;
}

// UI更新
function updateUI() {
    currentPlayerPiece.className = `piece ${PLAYERS[currentPlayer].className}`;
    currentPlayerName.textContent = PLAYERS[currentPlayer].name;
    
    const scores = calculateScores();
    document.getElementById('black-score').textContent = scores[0];
    document.getElementById('white-score').textContent = scores[1];
    document.getElementById('red-score').textContent = scores[2];
    document.getElementById('blue-score').textContent = scores[3];
}

// ゲーム終了
function endGame() {
    gameOver = true;
    const scores = calculateScores();
    const maxScore = Math.max(...scores);
    const winners = [];
    
    for (let i = 0; i < 4; i++) {
        if (scores[i] === maxScore) {
            winners.push(i);
        }
    }
    
    showGameOverModal(scores, winners);
}

// ゲーム終了モーダル表示
function showGameOverModal(scores, winners) {
    const finalScores = document.getElementById('final-scores');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    
    // 最終スコア表示
    let scoresHTML = '<div class="final-score-grid">';
    for (let i = 0; i < 4; i++) {
        scoresHTML += `
            <div class="final-score-item ${winners.includes(i) ? 'winner' : ''}">
                <div class="piece ${PLAYERS[i].className}"></div>
                <span>${PLAYERS[i].name}</span>
                <span class="score-number">${scores[i]}</span>
            </div>
        `;
    }
    scoresHTML += '</div>';
    finalScores.innerHTML = scoresHTML;
    
    // 勝者発表
    if (winners.length === 1) {
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                🏆 ${PLAYERS[winners[0]].name}の勝利！ 🏆
            </div>
        `;
    } else {
        const winnerNames = winners.map(i => PLAYERS[i].name).join('、');
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                🤝 引き分け！ 🤝<br>
                ${winnerNames}
            </div>
        `;
    }
    
    gameOverModal.classList.remove('hidden');
}

// モーダルを閉じる
function closeModal() {
    gameOverModal.classList.add('hidden');
}

// イベントリスナー
resetBtn.addEventListener('click', initializeBoard);
backBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});
newGameBtn.addEventListener('click', () => {
    closeModal();
    initializeBoard();
});
closeModalBtn.addEventListener('click', closeModal);

// ゲーム開始
document.addEventListener('DOMContentLoaded', initializeBoard);