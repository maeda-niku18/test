// ゲーム状態管理
let board = [];
let currentPlayer = 0; // 0:黒, 1:白
let gameOver = false;
let nextMoveDirection = null;

const PLAYERS = [
    { name: '黒プレイヤー', color: 'black', className: 'black' },
    { name: '白プレイヤー', color: 'white', className: 'white' }
];

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// 移動方向の定義
const MOVE_DIRECTIONS = {
    'up': { vector: [-1, 0], arrow: '⬆️', name: '上' },
    'down': { vector: [1, 0], arrow: '⬇️', name: '下' },
    'left': { vector: [0, -1], arrow: '⬅️', name: '左' },
    'right': { vector: [0, 1], arrow: '➡️', name: '右' }
};

const MOVE_DIRECTION_KEYS = Object.keys(MOVE_DIRECTIONS);

// DOM要素
const boardElement = document.getElementById('main-board');
const currentPlayerPiece = document.getElementById('current-player-piece');
const currentPlayerName = document.getElementById('current-player-name');
const resetBtn = document.getElementById('reset-btn');
const gameOverModal = document.getElementById('game-over-modal');
const newGameBtn = document.getElementById('new-game-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const arrowIcon = document.getElementById('arrow-icon');

// ボードの初期化
function initializeBoard() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    
    // 初期配置（中央2x2）
    board[3][3] = 1; // 白
    board[3][4] = 0; // 黒
    board[4][3] = 0; // 黒
    board[4][4] = 1; // 白
    
    currentPlayer = 0;
    gameOver = false;
    
    // 最初の移動方向を設定
    generateNextMoveDirection();
    
    renderBoard();
    updateUI();
}

// 次の移動方向をランダムに生成
function generateNextMoveDirection() {
    const randomIndex = Math.floor(Math.random() * MOVE_DIRECTION_KEYS.length);
    nextMoveDirection = MOVE_DIRECTION_KEYS[randomIndex];
    updateDirectionDisplay();
}

// 移動方向表示を更新
function updateDirectionDisplay() {
    if (nextMoveDirection) {
        const direction = MOVE_DIRECTIONS[nextMoveDirection];
        arrowIcon.textContent = direction.arrow;
        arrowIcon.setAttribute('title', `次の移動: ${direction.name}`);
    }
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
    
    // コマを配置してひっくり返す
    board[row][col] = currentPlayer;
    flipPieces(row, col, currentPlayer);
    
    // 移動アニメーション用のクラスを追加
    addMovingAnimation();
    
    // 少し待ってから移動を実行
    setTimeout(() => {
        // 全コマを移動
        moveAllPieces();
        
        // 次の移動方向を生成
        generateNextMoveDirection();
        
        // ボードを再描画
        renderBoard();
        updateUI();
        
        // ゲーム終了チェック
        if (checkGameEnd()) {
            setTimeout(() => {
                endGame();
            }, 300);
            return;
        }
        
        nextPlayer();
    }, 800); // アニメーション時間と合わせる
}

// 移動アニメーションを追加
function addMovingAnimation() {
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(piece => {
        piece.classList.add('moving');
    });
}

// 全コマを指定方向に移動
function moveAllPieces() {
    if (!nextMoveDirection) return;
    
    const direction = MOVE_DIRECTIONS[nextMoveDirection];
    const [deltaRow, deltaCol] = direction.vector;
    
    // 新しいボードを作成
    const newBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    if (deltaRow === -1) {
        // 上に移動
        for (let col = 0; col < 8; col++) {
            const column = [];
            for (let row = 0; row < 8; row++) {
                if (board[row][col] !== null) {
                    column.push(board[row][col]);
                }
            }
            // 上詰めで配置
            for (let i = 0; i < column.length; i++) {
                newBoard[i][col] = column[i];
            }
        }
    } else if (deltaRow === 1) {
        // 下に移動
        for (let col = 0; col < 8; col++) {
            const column = [];
            for (let row = 0; row < 8; row++) {
                if (board[row][col] !== null) {
                    column.push(board[row][col]);
                }
            }
            // 下詰めで配置
            for (let i = 0; i < column.length; i++) {
                newBoard[7 - i][col] = column[column.length - 1 - i];
            }
        }
    } else if (deltaCol === -1) {
        // 左に移動
        for (let row = 0; row < 8; row++) {
            const rowData = [];
            for (let col = 0; col < 8; col++) {
                if (board[row][col] !== null) {
                    rowData.push(board[row][col]);
                }
            }
            // 左詰めで配置
            for (let i = 0; i < rowData.length; i++) {
                newBoard[row][i] = rowData[i];
            }
        }
    } else if (deltaCol === 1) {
        // 右に移動
        for (let row = 0; row < 8; row++) {
            const rowData = [];
            for (let col = 0; col < 8; col++) {
                if (board[row][col] !== null) {
                    rowData.push(board[row][col]);
                }
            }
            // 右詰めで配置
            for (let i = 0; i < rowData.length; i++) {
                newBoard[row][7 - i] = rowData[rowData.length - 1 - i];
            }
        }
    }
    
    // ボードを更新
    board = newBoard;
}

// 次のプレイヤーに交代
function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % 2;
    
    // 現在のプレイヤーが置けるかチェック
    if (!hasValidMoves(currentPlayer)) {
        // 置けない場合は相手のターンに戻す
        currentPlayer = (currentPlayer + 1) % 2;
        
        // 相手も置けない場合はゲーム終了
        if (!hasValidMoves(currentPlayer)) {
            setTimeout(() => {
                endGame();
            }, 300);
            return;
        }
    }
    
    renderBoard();
    updateUI();
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

// ゲーム終了チェック
function checkGameEnd() {
    // ボードが満杯かチェック
    let boardFull = true;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === null) {
                boardFull = false;
                break;
            }
        }
        if (!boardFull) break;
    }
    
    // 両プレイヤーともに有効な手がない場合もゲーム終了
    const player0CanMove = hasValidMoves(0);
    const player1CanMove = hasValidMoves(1);
    
    if (boardFull || (!player0CanMove && !player1CanMove)) {
        return true;
    }
    
    return false;
}

// スコア計算
function calculateScores() {
    const scores = [0, 0];
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
    // 現在のプレイヤー表示を更新
    currentPlayerPiece.className = `piece ${PLAYERS[currentPlayer].className}`;
    currentPlayerName.textContent = `${PLAYERS[currentPlayer].name}のターン`;
    
    // 現在のプレイヤー情報エリアのクラスを更新
    const currentPlayerInfo = document.querySelector('.current-player-info');
    currentPlayerInfo.className = `current-player-info ${PLAYERS[currentPlayer].className}-turn`;
    
    // スコアパネルの現在のプレイヤーを強調
    const allPlayerScores = document.querySelectorAll('.player-score');
    allPlayerScores.forEach((scorePanel, index) => {
        scorePanel.classList.remove('current-turn');
        if (index === currentPlayer) {
            scorePanel.classList.add('current-turn');
        }
    });
    
    const scores = calculateScores();
    document.getElementById('black-score').textContent = scores[0];
    document.getElementById('white-score').textContent = scores[1];
}

// ゲーム終了
function endGame() {
    gameOver = true;
    const scores = calculateScores();
    
    // 勝者判定
    let winner = null;
    if (scores[0] > scores[1]) {
        winner = 0; // 黒の勝利
    } else if (scores[1] > scores[0]) {
        winner = 1; // 白の勝利
    }
    // winner = null の場合は引き分け
    
    showGameOverModal(scores, winner);
}

// ゲーム終了モーダル表示
function showGameOverModal(scores, winner) {
    const finalScores = document.getElementById('final-scores');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    
    // 最終スコア表示
    finalScores.innerHTML = `
        <div class="final-score-display">
            <h3>🔥 最終スコア 🔥</h3>
            <div class="score-comparison">
                <div class="player-final-score ${winner === 0 ? 'winner' : ''}">
                    <div class="piece black"></div>
                    <span>黒: ${scores[0]}個</span>
                </div>
                <div class="vs-text">VS</div>
                <div class="player-final-score ${winner === 1 ? 'winner' : ''}">
                    <div class="piece white"></div>
                    <span>白: ${scores[1]}個</span>
                </div>
            </div>
        </div>
    `;
    
    // 勝者発表
    if (winner !== null) {
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                🏆 ${PLAYERS[winner].name}の勝利！ 🏆<br>
                <span class="score-victory">${scores[winner]}個のコマで勝利！</span>
            </div>
        `;
    } else {
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                🤝 引き分け！ 🤝<br>
                <span class="score-victory">両者${scores[0]}個で同点！</span>
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
newGameBtn.addEventListener('click', () => {
    closeModal();
    initializeBoard();
});
closeModalBtn.addEventListener('click', closeModal);

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
});