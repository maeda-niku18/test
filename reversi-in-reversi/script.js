// ゲーム状態管理
let mainBoard = [];
let blockBoard = [];
let currentPlayer = 0; // 0:黒, 1:白
let gameOver = false;
let blockStatuses = []; // 各ブロックの状態を管理
let lastPlacedInBlock = []; // 各ブロックで最後に置かれたコマの色

// CPU対戦関連
let isVsCpu = false;
let cpuDifficulty = 'beginner'; // 'beginner' または 'intermediate'
let playerIsFirst = true; // プレイヤーが先手かどうか
let cpuPlayer = 1; // CPUのプレイヤー番号（通常は1=白）

const PLAYERS = [
    { name: '黒プレイヤー', color: 'black', className: 'black' },
    { name: '白プレイヤー', color: 'white', className: 'white' }
];

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// DOM要素
const mainBoardElement = document.getElementById('main-board');
const blockBoardElement = document.getElementById('block-board');
const currentPlayerPiece = document.getElementById('current-player-piece');
const currentPlayerName = document.getElementById('current-player-name');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const gameOverModal = document.getElementById('game-over-modal');
const newGameBtn = document.getElementById('new-game-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// モード選択関連のDOM要素
const modeSelection = document.getElementById('mode-selection');
const cpuSettings = document.getElementById('cpu-settings');
const gameHeader = document.querySelector('.game-header');
const gameArea = document.getElementById('game-area');
const scoreArea = document.getElementById('score-area');
const rulesArea = document.getElementById('rules-area');

const vsCpuBtn = document.getElementById('vs-cpu-btn');
const vsPlayerBtn = document.getElementById('vs-player-btn');
const startCpuGameBtn = document.getElementById('start-cpu-game-btn');
const backToModeBtn = document.getElementById('back-to-mode-btn');

// ボードの初期化
function initializeBoard() {
    // メインボード（8x8）の初期化
    mainBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // 初期配置（中央2x2）
    mainBoard[3][3] = 1; // 白
    mainBoard[3][4] = 0; // 黒
    mainBoard[4][3] = 0; // 黒
    mainBoard[4][4] = 1; // 白
    
    // ブロックボード（4x4）の初期化
    blockBoard = Array(4).fill().map(() => Array(4).fill(null));
    
    // ブロック状態の初期化
    blockStatuses = Array(16).fill('incomplete'); // 'incomplete', 'black', 'white'
    lastPlacedInBlock = Array(16).fill(null);
    
    currentPlayer = 0;
    gameOver = false;
    
    renderMainBoard();
    renderBlockBoard();
    updateUI();
}

// メインボードの描画
function renderMainBoard() {
    mainBoardElement.innerHTML = '';
    
    // ブロック境界線を描画
    createBlockBorders();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (mainBoard[row][col] !== null) {
                const piece = document.createElement('div');
                piece.className = `piece ${PLAYERS[mainBoard[row][col]].className}`;
                cell.appendChild(piece);
            }
            
            // 有効な手かどうかチェック
            if (isValidMove(row, col, currentPlayer)) {
                cell.classList.add('valid-move');
                cell.addEventListener('click', () => makeMove(row, col));
            }
            
            mainBoardElement.appendChild(cell);
        }
    }
}

// ブロック境界線を描画
function createBlockBorders() {
    // 各2x2ブロックの境界線を描画
    for (let blockRow = 0; blockRow < 4; blockRow++) {
        for (let blockCol = 0; blockCol < 4; blockCol++) {
            const border = document.createElement('div');
            border.className = 'block-border';
            
            const cellSize = 58; // セルサイズ + gap
            const left = blockCol * 2 * cellSize + 10;
            const top = blockRow * 2 * cellSize + 10;
            
            border.style.left = `${left}px`;
            border.style.top = `${top}px`;
            border.style.width = `${cellSize * 2 - 2}px`;
            border.style.height = `${cellSize * 2 - 2}px`;
            
            mainBoardElement.appendChild(border);
        }
    }
}

// ブロックボードの描画
function renderBlockBoard() {
    blockBoardElement.innerHTML = '';
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const blockIndex = row * 4 + col;
            const blockStatus = blockStatuses[blockIndex];
            
            if (blockStatus !== 'incomplete') {
                const piece = document.createElement('div');
                piece.className = `piece ${blockStatus}`;
                cell.appendChild(piece);
            }
            // 未完了の場合は何も表示しない（空のセル）
            
            blockBoardElement.appendChild(cell);
        }
    }
}

// 有効な手かどうか判定
function isValidMove(row, col, player) {
    if (mainBoard[row][col] !== null) return false;
    
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
        if (mainBoard[r][c] === null) return false;
        if (mainBoard[r][c] === player) return hasOpponent;
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
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && mainBoard[r][c] !== player) {
                mainBoard[r][c] = player;
                r += direction[0];
                c += direction[1];
            }
        }
    }
}

// 手を打つ
function makeMove(row, col) {
    if (!isValidMove(row, col, currentPlayer) || gameOver) return;
    
    mainBoard[row][col] = currentPlayer;
    flipPieces(row, col, currentPlayer);
    
    // ブロック状態をチェック
    const blockIndex = getBlockIndex(row, col);
    lastPlacedInBlock[blockIndex] = currentPlayer;
    checkBlockCompletion(blockIndex);
    
    // ボードを再描画してコマの配置を反映
    renderMainBoard();
    renderBlockBoard();
    updateUI();
    
    // ゲーム終了チェック
    if (checkGameEnd()) {
        // 少し待ってからゲーム終了処理（最後のコマが見えるように）
        setTimeout(() => {
            endGame();
        }, 300);
        return;
    }
    
    nextPlayer();
}

// セル位置からブロックインデックスを取得
function getBlockIndex(row, col) {
    const blockRow = Math.floor(row / 2);
    const blockCol = Math.floor(col / 2);
    return blockRow * 4 + blockCol;
}

// ブロック完了チェック
function checkBlockCompletion(blockIndex) {
    const blockRow = Math.floor(blockIndex / 4);
    const blockCol = blockIndex % 4;
    
    let blockFull = true;
    let blackCount = 0;
    let whiteCount = 0;
    
    // 2x2ブロック内のセルをチェック
    for (let r = blockRow * 2; r < blockRow * 2 + 2; r++) {
        for (let c = blockCol * 2; c < blockCol * 2 + 2; c++) {
            if (mainBoard[r][c] === null) {
                blockFull = false;
            } else if (mainBoard[r][c] === 0) {
                blackCount++;
            } else if (mainBoard[r][c] === 1) {
                whiteCount++;
            }
        }
    }
    
    if (blockFull && blockStatuses[blockIndex] === 'incomplete') {
        // ブロック勝者を決定
        let winner;
        if (blackCount > whiteCount) {
            winner = 'black';
        } else if (whiteCount > blackCount) {
            winner = 'white';
        } else {
            // 同数の場合は最後に置いたコマの色
            winner = lastPlacedInBlock[blockIndex] === 0 ? 'black' : 'white';
        }
        
        blockStatuses[blockIndex] = winner;
        
        // ブロックボードを更新
        const boardRow = Math.floor(blockIndex / 4);
        const boardCol = blockIndex % 4;
        blockBoard[boardRow][boardCol] = winner === 'black' ? 0 : 1;
        
        renderBlockBoard();
        
        // ブロックボードでのリバーシ処理
        processBlockReversi(boardRow, boardCol, winner === 'black' ? 0 : 1);
    }
}

// ブロックボードでのリバーシ処理
function processBlockReversi(row, col, player) {
    // ブロックボードでもリバーシのルールを適用
    for (let direction of DIRECTIONS) {
        if (canFlipBlock(row, col, direction[0], direction[1], player)) {
            let r = row + direction[0];
            let c = col + direction[1];
            
            while (r >= 0 && r < 4 && c >= 0 && c < 4 && blockBoard[r][c] !== player) {
                const oldValue = blockBoard[r][c];
                blockBoard[r][c] = player;
                
                // ブロック状態も更新
                const blockIndex = r * 4 + c;
                blockStatuses[blockIndex] = player === 0 ? 'black' : 'white';
                
                r += direction[0];
                c += direction[1];
            }
        }
    }
    
    renderBlockBoard();
}

// ブロックボードでひっくり返せるかチェック
function canFlipBlock(row, col, deltaRow, deltaCol, player) {
    let r = row + deltaRow;
    let c = col + deltaCol;
    let hasOpponent = false;
    
    while (r >= 0 && r < 4 && c >= 0 && c < 4) {
        if (blockBoard[r][c] === null) return false;
        if (blockBoard[r][c] === player) return hasOpponent;
        hasOpponent = true;
        r += deltaRow;
        c += deltaCol;
    }
    
    return false;
}

// 次のプレイヤーに交代
function nextPlayer() {
    // 次のプレイヤーに
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
    
    renderMainBoard();
    updateUI();
    
    // CPU対戦の場合、CPUのターンなら自動で手を打つ
    if (isVsCpu && currentPlayer === cpuPlayer) {
        setTimeout(() => {
            makeCpuMove();
        }, 1000); // 1秒待ってからCPUが手を打つ
    }
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
    // メインボードが満杯かチェック
    let boardFull = true;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (mainBoard[row][col] === null) {
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

// ブロックボードでの勝利チェック
function checkBlockBoardWin() {
    // 4つ並び（縦、横、斜め）をチェック
    
    // 横のライン
    for (let row = 0; row < 4; row++) {
        if (blockBoard[row][0] !== null && 
            blockBoard[row][0] === blockBoard[row][1] &&
            blockBoard[row][1] === blockBoard[row][2] &&
            blockBoard[row][2] === blockBoard[row][3]) {
            return blockBoard[row][0]; // 勝者を返す
        }
    }
    
    // 縦のライン
    for (let col = 0; col < 4; col++) {
        if (blockBoard[0][col] !== null && 
            blockBoard[0][col] === blockBoard[1][col] &&
            blockBoard[1][col] === blockBoard[2][col] &&
            blockBoard[2][col] === blockBoard[3][col]) {
            return blockBoard[0][col]; // 勝者を返す
        }
    }
    
    // 斜め（左上から右下）
    if (blockBoard[0][0] !== null && 
        blockBoard[0][0] === blockBoard[1][1] &&
        blockBoard[1][1] === blockBoard[2][2] &&
        blockBoard[2][2] === blockBoard[3][3]) {
        return blockBoard[0][0]; // 勝者を返す
    }
    
    // 斜め（右上から左下）
    if (blockBoard[0][3] !== null && 
        blockBoard[0][3] === blockBoard[1][2] &&
        blockBoard[1][2] === blockBoard[2][1] &&
        blockBoard[2][1] === blockBoard[3][0]) {
        return blockBoard[0][3]; // 勝者を返す
    }
    
    return null; // 勝者なし
}

// スコア計算
function calculateScores() {
    // メインボードのスコア
    const mainScores = [0, 0];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (mainBoard[row][col] !== null) {
                mainScores[mainBoard[row][col]]++;
            }
        }
    }
    
    // ブロックボードのスコア
    const blockScores = [0, 0];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (blockBoard[row][col] !== null) {
                blockScores[blockBoard[row][col]]++;
            }
        }
    }
    
    return { main: mainScores, block: blockScores };
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
    document.getElementById('black-main-score').textContent = scores.main[0];
    document.getElementById('white-main-score').textContent = scores.main[1];
    document.getElementById('black-block-score').textContent = scores.block[0];
    document.getElementById('white-block-score').textContent = scores.block[1];
}

// ゲーム終了
function endGame() {
    gameOver = true;
    const scores = calculateScores();
    
    // 勝者判定：ブロック獲得数のみで判定
    let winner = null;
    if (scores.block[0] > scores.block[1]) {
        winner = 0; // 黒の勝利
    } else if (scores.block[1] > scores.block[0]) {
        winner = 1; // 白の勝利
    }
    // winner = null の場合は引き分け
    
    showGameOverModal(scores, winner);
}

// ゲーム終了モーダル表示
function showGameOverModal(scores, winner) {
    const finalScores = document.getElementById('final-scores');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    
    // 最終スコア表示（ブロック中心）
    finalScores.innerHTML = `
        <div class="final-score-display">
            <h3>🏰 陣地支配状況 🏰</h3>
            <div class="territory-display">
                <div class="territory-count">
                    <div class="territory-item ${winner === 0 ? 'winner' : ''}">
                        <div class="piece black"></div>
                        <div class="territory-info">
                            <div class="territory-number">${scores.block[0]}</div>
                            <div class="territory-label">陣地</div>
                        </div>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="territory-item ${winner === 1 ? 'winner' : ''}">
                        <div class="piece white"></div>
                        <div class="territory-info">
                            <div class="territory-number">${scores.block[1]}</div>
                            <div class="territory-label">陣地</div>
                        </div>
                    </div>
                </div>
                <div class="detail-scores">
                    <small>参考: メインボード 黒${scores.main[0]} - 白${scores.main[1]}</small>
                </div>
            </div>
        </div>
    `;
    
    // 勝者発表（ブロック支配中心）
    if (winner !== null) {
        const territoryCount = scores.block[winner];
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                🔥 ${PLAYERS[winner].name}が陣地を制圧！ 🔥<br>
                <span class="territory-victory">${territoryCount}陣地支配による勝利！</span>
            </div>
        `;
    } else {
        winnerAnnouncement.innerHTML = `
            <div class="winner-text">
                ⚔️ 陣地支配が同数！ ⚔️<br>
                <span class="territory-victory">熾烈な陣地争いの末、引き分け！</span>
            </div>
        `;
    }
    
    gameOverModal.classList.remove('hidden');
}

// モーダルを閉じる
function closeModal() {
    gameOverModal.classList.add('hidden');
}

// CPUの手を決める関数
function makeCpuMove() {
    if (gameOver) return;
    
    const validMoves = [];
    
    // 有効な手をすべて取得
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(row, col, cpuPlayer)) {
                validMoves.push({ row, col });
            }
        }
    }
    
    if (validMoves.length === 0) return;
    
    let selectedMove;
    
    if (cpuDifficulty === 'beginner') {
        // 初級：ランダムに選択
        selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else if (cpuDifficulty === 'intermediate') {
        // 中級：ブロック戦略を考慮
        selectedMove = getStrategicMove(validMoves);
    }
    
    if (selectedMove) {
        makeMove(selectedMove.row, selectedMove.col);
    }
}

// 中級CPU用の戦略的な手を選択
function getStrategicMove(validMoves) {
    let bestMoves = [];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
        const score = evaluateMove(move.row, move.col);
        
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }
    
    // 同じスコアの手からランダムに選択
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// 手の価値を評価
function evaluateMove(row, col) {
    let score = 0;
    const blockIndex = getBlockIndex(row, col);
    const blockRow = Math.floor(blockIndex / 4);
    const blockCol = blockIndex % 4;
    
    // ブロック完成に近いかどうかを評価
    let blockEmptyCount = 0;
    let cpuCountInBlock = 0;
    let playerCountInBlock = 0;
    
    for (let r = blockRow * 2; r < blockRow * 2 + 2; r++) {
        for (let c = blockCol * 2; c < blockCol * 2 + 2; c++) {
            if (mainBoard[r][c] === null) {
                blockEmptyCount++;
            } else if (mainBoard[r][c] === cpuPlayer) {
                cpuCountInBlock++;
            } else {
                playerCountInBlock++;
            }
        }
    }
    
    // ブロックが完成間近なら高評価
    if (blockEmptyCount === 1) {
        if (cpuCountInBlock > playerCountInBlock) {
            score += 50; // ブロック獲得確定
        } else if (cpuCountInBlock === playerCountInBlock) {
            score += 30; // 最後の一手で決まる
        } else {
            score -= 20; // 相手にブロックを渡してしまう
        }
    }
    
    // 角の位置は高評価
    if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
        score += 20;
    }
    
    // 辺の位置は中程度評価
    if (row === 0 || row === 7 || col === 0 || col === 7) {
        score += 10;
    }
    
    // ひっくり返せるコマ数も考慮
    const flippedCount = countFlippedPieces(row, col, cpuPlayer);
    score += flippedCount * 2;
    
    return score;
}

// ひっくり返せるコマ数をカウント
function countFlippedPieces(row, col, player) {
    let count = 0;
    
    for (let direction of DIRECTIONS) {
        if (canFlip(row, col, direction[0], direction[1], player)) {
            let r = row + direction[0];
            let c = col + direction[1];
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && mainBoard[r][c] !== player) {
                count++;
                r += direction[0];
                c += direction[1];
            }
        }
    }
    
    return count;
}

// モード選択とゲーム開始の処理
function showModeSelection() {
    modeSelection.classList.remove('hidden');
    cpuSettings.classList.add('hidden');
    gameHeader.classList.add('hidden');
    gameArea.classList.add('hidden');
    scoreArea.classList.add('hidden');
    rulesArea.classList.add('hidden');
}

function showCpuSettings() {
    modeSelection.classList.add('hidden');
    cpuSettings.classList.remove('hidden');
}

function startGame() {
    modeSelection.classList.add('hidden');
    cpuSettings.classList.add('hidden');
    gameHeader.classList.remove('hidden');
    gameArea.classList.remove('hidden');
    scoreArea.classList.remove('hidden');
    rulesArea.classList.remove('hidden');
    
    initializeBoard();
}

function startCpuGame() {
    // CPU設定を適用
    const selectedDifficulty = document.querySelector('.difficulty-btn.selected');
    const selectedFirst = document.querySelector('.first-player-btn.selected');
    
    if (!selectedDifficulty || !selectedFirst) {
        alert('CPU強度と先手を選択してください');
        return;
    }
    
    isVsCpu = true;
    cpuDifficulty = selectedDifficulty.dataset.difficulty;
    playerIsFirst = selectedFirst.dataset.first === 'player';
    
    // CPUが後手の場合は白（1）、先手の場合は黒（0）
    cpuPlayer = playerIsFirst ? 1 : 0;
    
    // プレイヤー名を更新
    if (isVsCpu) {
        PLAYERS[cpuPlayer].name = `CPU(${cpuDifficulty === 'beginner' ? '初級' : '中級'})`;
    }
    
    startGame();
    
    // CPUが先手の場合、最初の手を打つ
    if (!playerIsFirst) {
        setTimeout(() => {
            makeCpuMove();
        }, 1000);
    }
}

// イベントリスナー
resetBtn.addEventListener('click', initializeBoard);
backBtn.addEventListener('click', showModeSelection);
newGameBtn.addEventListener('click', () => {
    closeModal();
    showModeSelection();
});
closeModalBtn.addEventListener('click', closeModal);

// モード選択のイベントリスナー
vsCpuBtn.addEventListener('click', showCpuSettings);
vsPlayerBtn.addEventListener('click', () => {
    isVsCpu = false;
    PLAYERS[0].name = '黒プレイヤー';
    PLAYERS[1].name = '白プレイヤー';
    startGame();
});

startCpuGameBtn.addEventListener('click', startCpuGame);
backToModeBtn.addEventListener('click', showModeSelection);

// CPU設定の選択処理
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('difficulty-btn')) {
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
    }
    
    if (e.target.classList.contains('first-player-btn')) {
        document.querySelectorAll('.first-player-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    showModeSelection();
    
    // デフォルト選択を設定
    document.querySelector('[data-difficulty="beginner"]').classList.add('selected');
    document.querySelector('[data-first="player"]').classList.add('selected');
});