class LimitedGomoku {
    constructor() {
        this.board = [];
        this.currentPlayer = 'black';
        this.stoneLimit = 7;
        this.gameActive = false;
        this.moveHistory = [];
        this.boardSize = 12;
        
        // DOM要素を初期化
        this.initializeElements();
        this.setupEventListeners();
        
        // 初期状態を設定（設定画面を表示、ゲーム画面とモーダルを非表示）
        this.showSettingsScreen();
    }
    
    initializeElements() {
        this.settingsScreen = document.getElementById('settingsScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.stoneLimitSlider = document.getElementById('stoneLimit');
        this.stoneLimitValue = document.getElementById('stoneLimitValue');
        this.startGameBtn = document.getElementById('startGame');
        this.backToSettingsBtn = document.getElementById('backToSettings');
        this.currentPlayerSpan = document.getElementById('currentPlayer');
        this.playerIndicator = document.getElementById('playerIndicator');
        this.remainingStonesSpan = document.getElementById('remainingStones');
        this.gameBoard = document.getElementById('gameBoard');
        this.winnerDisplay = document.getElementById('winnerDisplay');
        this.winnerText = document.getElementById('winnerText');
        this.playAgainBtn = document.getElementById('playAgain');
    }
    
    setupEventListeners() {
        this.stoneLimitSlider.addEventListener('input', () => {
            this.stoneLimitValue.textContent = this.stoneLimitSlider.value;
        });
        
        this.startGameBtn.addEventListener('click', () => {
            this.stoneLimit = parseInt(this.stoneLimitSlider.value);
            this.startGame();
        });
        
        this.backToSettingsBtn.addEventListener('click', () => {
            this.showSettingsScreen();
        });
        
        this.playAgainBtn.addEventListener('click', () => {
            this.winnerDisplay.classList.add('hidden');
            this.resetGame();
        });
    }
    
    showSettingsScreen() {
        this.settingsScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.winnerDisplay.classList.add('hidden');
    }
    
    startGame() {
        // 設定画面を非表示、ゲーム画面を表示
        this.settingsScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // 勝敗表示を非表示
        this.winnerDisplay.classList.add('hidden');
        
        // ゲームをリセットして開始
        this.resetGame();
    }
    
    resetGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameActive = true;
        this.moveHistory = [];
        
        // 勝敗表示を非表示にする
        this.winnerDisplay.classList.add('hidden');
        
        this.createBoard();
        this.updateUI();
    }
    
    createBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 交点の位置に配置（48pxずつの間隔で、24pxのオフセット）
                const x = 24 + col * 48;
                const y = 24 + row * 48;
                cell.style.left = x + 'px';
                cell.style.top = y + 'px';
                
                cell.addEventListener('click', () => {
                    this.makeMove(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
        
        // ホバー効果を設定
        this.updateHoverEffects();
    }
    
    makeMove(row, col) {
        if (!this.gameActive || this.board[row][col] !== null) {
            return;
        }
        
        // 石を置く
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        // 石数制限の処理
        this.enforceStoneLimit();
        
        // ボードを更新
        this.updateBoard();
        
        // 勝利判定
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        // プレイヤー交代
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateUI();
    }
    
    enforceStoneLimit() {
        const currentPlayerMoves = this.moveHistory.filter(move => move.player === this.currentPlayer);
        
        if (currentPlayerMoves.length > this.stoneLimit) {
            // 古い石を削除
            const moveToRemove = currentPlayerMoves[0];
            this.board[moveToRemove.row][moveToRemove.col] = null;
            
            // 削除する石にアニメーションを適用
            const cellToRemove = document.querySelector(`[data-row="${moveToRemove.row}"][data-col="${moveToRemove.col}"]`);
            if (cellToRemove) {
                cellToRemove.classList.add('fading');
                setTimeout(() => {
                    cellToRemove.classList.remove('fading', 'black', 'white');
                }, 500);
            }
            
            // 履歴から削除
            const indexToRemove = this.moveHistory.indexOf(moveToRemove);
            this.moveHistory.splice(indexToRemove, 1);
        }
    }
    
    updateBoard() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const stone = this.board[row][col];
                
                cell.classList.remove('black', 'white');
                if (stone) {
                    cell.classList.add(stone);
                }
            }
        }
    }
    
    updateUI() {
        this.currentPlayerSpan.textContent = this.currentPlayer === 'black' ? '黒' : '白';
        
        // プレイヤーインジケーターの更新
        this.playerIndicator.classList.remove('black', 'white');
        this.playerIndicator.classList.add(this.currentPlayer);
        
        const currentPlayerMoves = this.moveHistory.filter(move => move.player === this.currentPlayer);
        const remainingStones = Math.max(0, this.stoneLimit - currentPlayerMoves.length);
        this.remainingStonesSpan.textContent = remainingStones;
        
        // ホバー効果を更新
        this.updateHoverEffects();
    }
    
    updateHoverEffects() {
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('hover-black', 'hover-white');
            if (!cell.classList.contains('black') && !cell.classList.contains('white')) {
                cell.classList.add(`hover-${this.currentPlayer}`);
            }
        });
    }
    
    checkWin(row, col) {
        const directions = [
            [0, 1],   // 横
            [1, 0],   // 縦
            [1, 1],   // 右下斜め
            [1, -1]   // 左下斜め
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正方向にチェック
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize ||
                    this.board[newRow][newCol] !== this.currentPlayer) {
                    break;
                }
                count++;
            }
            
            // 負方向にチェック
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (newRow < 0 || newRow >= this.boardSize || 
                    newCol < 0 || newCol >= this.boardSize ||
                    this.board[newRow][newCol] !== this.currentPlayer) {
                    break;
                }
                count++;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    endGame(winner) {
        this.gameActive = false;
        const winnerName = winner === 'black' ? '黒' : '白';
        this.winnerText.textContent = `${winnerName}の勝利！`;
        this.winnerDisplay.classList.remove('hidden');
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new LimitedGomoku();
});