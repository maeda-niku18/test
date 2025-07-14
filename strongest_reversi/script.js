document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const playerTurnElement = document.getElementById('player-turn');
    const blackScoreElement = document.getElementById('black-score');
    const whiteScoreElement = document.getElementById('white-score');
    const specialAbilityButton = document.getElementById('special-ability-button');
    const specialAbilityCountElement = document.getElementById('special-ability-count');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const winnerMessageElement = document.getElementById('winner-message');
    const resetButton = document.getElementById('reset-button');
    const rouletteContainer = document.getElementById('roulette-container');
    const rouletteInner = rouletteContainer.querySelector('.roulette-inner');
    const rouletteStopButton = document.getElementById('roulette-stop-button');

    let board = [];
    let currentPlayer = 'black'; // Player is always black (first)
    let specialAbilityCount = 5;
    let selectedCellForRoulette = null;
    let isAbilityActive = false;

    function initializeBoard() {
        board = Array(8).fill(null).map(() => Array(8).fill(null));
        board[3][3] = 'white';
        board[3][4] = 'black';
        board[4][3] = 'black';
        board[4][4] = 'white';
        specialAbilityCount = 5;
        currentPlayer = 'black';
        renderBoard();
        updateScore();
        updatePlayerTurn();
        gameOverMessageElement.classList.add('hidden');
        specialAbilityButton.disabled = false;
        specialAbilityCountElement.textContent = specialAbilityCount;
        rouletteStopButton.disabled = true;
        rouletteInner.classList.remove('animate');
        isAbilityActive = false;
        specialAbilityButton.classList.remove('active');
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                if (board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${board[row][col]}`;
                    cell.appendChild(piece);
                }
                cell.addEventListener('click', () => handleCellClick(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    function handleCellClick(row, col) {
        if (board[row][col] === 'red') return; // Red pieces are immutable

        if (isAbilityActive) {
            if (board[row][col]) { // Can only use on existing pieces
                selectedCellForRoulette = { row, col };
                rouletteInner.classList.add('animate');
                rouletteStopButton.disabled = false;
                isAbilityActive = false; // Deactivate after selection
                specialAbilityButton.classList.remove('active');
            } else {
                alert('石が置かれているマスを選択してください。');
            }
            return;
        }

        if (currentPlayer === 'black' && isValidMove(row, col, 'black')) {
            placePiece(row, col, 'black');
            switchPlayer();
            setTimeout(aiMove, 500);
        } else if (currentPlayer === 'black') {
            alert('無効な手です');
        }
    }

    function isValidMove(row, col, player) {
        if (board[row][col] !== null) {
            return false;
        }

        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let hasOpponentPiece = false;

            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
                r += dr;
                c += dc;
                hasOpponentPiece = true;
            }

            if (hasOpponentPiece && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
                return true;
            }
        }
        return false;
    }

    function placePiece(row, col, player) {
        board[row][col] = player;
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            const piecesToFlip = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
                piecesToFlip.push({ r, c });
                r += dr;
                c += dc;
            }

            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
                for (const { r: flipR, c: flipC } of piecesToFlip) {
                    if(board[flipR][flipC] !== 'red'){
                        board[flipR][flipC] = player;
                    }
                }
            }
        }
        renderBoard();
        updateScore();
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        updatePlayerTurn();
        if (!hasValidMoves(currentPlayer)) {
            if (!hasValidMoves(currentPlayer === 'black' ? 'white' : 'black')) {
                endGame();
            } else {
                alert(`${currentPlayer === 'black' ? 'あなた' : 'CPU'}には有効な手がありません。パスします。`);
                switchPlayer();
                if(currentPlayer === 'white'){
                    setTimeout(aiMove, 500);
                }
            }
        }
    }

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

    function updatePlayerTurn() {
        playerTurnElement.textContent = `${currentPlayer === 'black' ? 'あなたの' : 'CPUの'}ターン`;
    }

    function updateScore() {
        let blackScore = 0;
        let whiteScore = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === 'black') blackScore++;
                if (board[row][col] === 'white') whiteScore++;
            }
        }
        blackScoreElement.textContent = blackScore;
        whiteScoreElement.textContent = whiteScore;
    }

    function aiMove() {
        if (currentPlayer !== 'white') return;
        const move = findBestMove(board);
        if (move) {
            placePiece(move.row, move.col, 'white');
        } 
        switchPlayer();
    }

    function endGame() {
        let blackScore = 0;
        let whiteScore = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === 'black') blackScore++;
                if (board[row][col] === 'white') whiteScore++;
            }
        }

        let winner;
        if (blackScore > whiteScore) {
            winner = 'あなたの勝ち！';
        } else if (whiteScore > blackScore) {
            winner = 'CPUの勝ち！';
        } else {
            winner = '引き分け！';
        }
        winnerMessageElement.textContent = `最終スコア: あなた ${blackScore} - CPU ${whiteScore}. ${winner}`;
        gameOverMessageElement.classList.remove('hidden');
    }

    specialAbilityButton.addEventListener('click', () => {
        if (specialAbilityCount > 0) {
            isAbilityActive = !isAbilityActive;
            specialAbilityButton.classList.toggle('active');
            if (isAbilityActive) {
                alert('変換したい石を選択してください。');
            } else {
                selectedCellForRoulette = null;
            }
        } else {
            alert('特殊能力はもう使えません。');
        }
    });

    rouletteStopButton.addEventListener('click', () => {
        rouletteInner.classList.remove('animate');
        rouletteStopButton.disabled = true;

        const style = window.getComputedStyle(rouletteInner);
        const transform = style.getPropertyValue('transform');
        const matrix = new DOMMatrix(transform);
        const translateY = matrix.m42;
        const pieceHeight = 50; // height of one piece in the roulette
        const totalHeight = pieceHeight * 5;
        const currentPos = (translateY % totalHeight + totalHeight) % totalHeight;
        const pieceIndex = Math.floor(currentPos / pieceHeight);

        const pieces = ['black', 'white', 'red', 'white', 'white'];
        const newPiece = pieces[pieceIndex];

        const { row, col } = selectedCellForRoulette;
        const originalPiece = board[row][col];

        if (originalPiece !== newPiece) {
            board[row][col] = newPiece;
            renderBoard();
            updateScore();
        }
        
        specialAbilityCount--;
        specialAbilityCountElement.textContent = specialAbilityCount;
        if (specialAbilityCount <= 0) {
            specialAbilityButton.disabled = true;
        }
        selectedCellForRoulette = null;
    });

    resetButton.addEventListener('click', initializeBoard);

    initializeBoard();
});
