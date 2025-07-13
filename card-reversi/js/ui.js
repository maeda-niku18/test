export const elements = {
    gameBoard: document.getElementById('game-board'),
    blackScore: document.getElementById('black-score'),
    whiteScore: document.getElementById('white-score'),
    blackCards: document.getElementById('black-cards'),
    whiteCards: document.getElementById('white-cards'),
    turnInfo: document.getElementById('turn-info'),
    messageArea: document.getElementById('message-area'),
    playerBlackInfo: document.getElementById('player-black-info'),
    playerWhiteInfo: document.getElementById('player-white-info'),
    cardList: document.getElementById('card-list'),
    cancelCard: document.getElementById('cancel-card'),
    resetGame: document.getElementById('reset-game'),
    gameResultModal: document.getElementById('game-result-modal'),
    winnerTitle: document.getElementById('winner-title'),
    finalBlackScore: document.getElementById('final-black-score'),
    finalWhiteScore: document.getElementById('final-white-score'),
    playAgainBtn: document.getElementById('play-again-btn'),
    closeModalBtn: document.getElementById('close-modal-btn'),
};

export function renderBoard(board, mines = [], placeable = [], attachedStickers = [], selectedEquivalentExchangeTargets = [], infectedDiscs = [], sanctuaries = [], outOfBoundsBoard = new Map(), showOutOfBounds = false) {
    elements.gameBoard.innerHTML = '';
    const boardSize = 8;
    
    // 枠外表示の有無でCSSクラスを切り替え
    elements.gameBoard.classList.toggle('with-out-of-bounds', showOutOfBounds);

    for (let row = (showOutOfBounds ? -1 : 0); row <= (showOutOfBounds ? boardSize : boardSize - 1); row++) {
        for (let col = (showOutOfBounds ? -1 : 0); col <= (showOutOfBounds ? boardSize : boardSize - 1); col++) {
            const cell = document.createElement('div');
            
            if (showOutOfBounds && (row === -1 || row === boardSize || col === -1 || col === boardSize)) {
                // 枠外エリア（枠外置きカード選択時のみ表示）
                cell.classList.add('out-of-bounds');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const isPlaceable = placeable.some(p => p.row === row && p.col === col);
                if (isPlaceable) {
                    cell.classList.add('placeable');
                }

                // 枠外にあるコマを表示
                const outOfBoundsPiece = outOfBoundsBoard.get(`${row},${col}`);
                if (outOfBoundsPiece) {
                    const disc = document.createElement('div');
                    disc.classList.add('disc', outOfBoundsPiece);
                    cell.appendChild(disc);
                }
            } else if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                // 通常のボードエリア
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                const isMine = mines.some(m => m.row === row && m.col === col);
                if (isMine) {
                    cell.classList.add('mine');
                }

                const isPlaceable = placeable.some(p => p.row === row && p.col === col);
                if (isPlaceable) {
                    cell.classList.add('placeable');
                }

                const isSelected = selectedEquivalentExchangeTargets.some(t => t.row === row && t.col === col);
                if (isSelected) {
                    cell.classList.add('selected');
                }

                const inSanctuary = sanctuaries.some(s => 
                    row >= s.row && row < s.row + 2 &&
                    col >= s.col && col < s.col + 2
                );
                if (inSanctuary) {
                    cell.classList.add('sanctuary');
                }

                const piece = board[row][col];
                if (piece) {
                    const disc = document.createElement('div');
                    disc.classList.add('disc', piece);
                    const isSticker = attachedStickers.some(s => s.row === row && s.col === col);
                    if (isSticker) {
                        disc.classList.add('sticker');
                    }
                    const isInfected = infectedDiscs.some(d => d.row === row && d.col === col);
                    if (isInfected) {
                        disc.classList.add('infected');
                    }
                    cell.appendChild(disc);
                }
            }
            
            elements.gameBoard.appendChild(cell);
        }
    }
}

export function renderHands(playerHands, useCardCallback) {
    renderHand(playerHands.black, elements.blackCards, 'black', useCardCallback);
    renderHand(playerHands.white, elements.whiteCards, 'white', useCardCallback);
}

function renderHand(hand, element, player, useCardCallback) {
    element.innerHTML = '';
    hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.textContent = card.name;
        cardElement.dataset.cardIndex = index;
        
        // ツールチップを作成
        const tooltip = document.createElement('div');
        tooltip.classList.add('card-tooltip');
        tooltip.textContent = card.description;
        cardElement.appendChild(tooltip);
        
        cardElement.addEventListener('click', () => useCardCallback(card, player, index));
        element.appendChild(cardElement);
    });
}

export function updateScores(board, outOfBoundsBoard = new Map()) {
    let blackScore = 0;
    let whiteScore = 0;
    
    // 通常のボードをカウント（赤いコマは除外）
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === 'black') blackScore++;
            if (board[row][col] === 'white') whiteScore++;
            // 'red'はカウントしない
        }
    }
    
    // 枠外のコマもカウント（赤いコマは除外）
    for (const [position, color] of outOfBoundsBoard.entries()) {
        if (color === 'black') blackScore++;
        if (color === 'white') whiteScore++;
        // 'red'はカウントしない
    }
    
    elements.blackScore.textContent = blackScore;
    elements.whiteScore.textContent = whiteScore;
}

export function updateTurnInfo(turn, currentPlayer) {
    elements.turnInfo.textContent = `${currentPlayer === 'black' ? '黒' : '白'}のターン (ターン ${turn + 1})`;
    
    // ターン表示の文字色を変更
    if (currentPlayer === 'black') {
        elements.turnInfo.style.color = '#000';
        elements.turnInfo.style.fontSize = '1.5rem';
        elements.turnInfo.style.fontWeight = 'bold';
    } else {
        elements.turnInfo.style.color = '#fff';
        elements.turnInfo.style.fontSize = '1.5rem';
        elements.turnInfo.style.fontWeight = 'bold';
    }
}

export function highlightActivePlayer(currentPlayer) {
    elements.playerBlackInfo.classList.toggle('active', currentPlayer === 'black');
    elements.playerWhiteInfo.classList.toggle('active', currentPlayer === 'white');
}

export function showMessage(message, duration = 3000) {
    elements.messageArea.textContent = message;
    if (duration > 0) {
        setTimeout(() => elements.messageArea.textContent = '', duration);
    }
}

export function updateCursor(activeCard) {
    if (activeCard && activeCard.card.id === 'blow-away') {
        elements.gameBoard.style.cursor = 'crosshair';
        addBlowAwayHoverEffect();
        removeSanctuaryHoverEffect();
    } else if (activeCard && activeCard.card.id === 'sanctuary') {
        elements.gameBoard.style.cursor = 'crosshair';
        addSanctuaryHoverEffect();
        removeBlowAwayHoverEffect();
    } else {
        elements.gameBoard.style.cursor = 'default';
        removeBlowAwayHoverEffect();
        removeSanctuaryHoverEffect();
    }
    
    // カード選択時にキャンセルボタンを表示
    const shouldShowCancel = activeCard && activeCard.card.requiresTarget;
    elements.cancelCard.style.display = shouldShowCancel ? 'block' : 'none';
}

function addBlowAwayHoverEffect() {
    const cells = elements.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', showBlowAwayPreview);
        cell.addEventListener('mouseleave', hideBlowAwayPreview);
    });
}

function removeBlowAwayHoverEffect() {
    const cells = elements.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.removeEventListener('mouseenter', showBlowAwayPreview);
        cell.removeEventListener('mouseleave', hideBlowAwayPreview);
    });
    hideBlowAwayPreview();
}

function showBlowAwayPreview(event) {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // 2x2の範囲をハイライト
    for (let r = row; r < row + 2; r++) {
        for (let c = col; c < col + 2; c++) {
            if (r < 8 && c < 8) {
                const targetCell = elements.gameBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (targetCell) {
                    targetCell.classList.add('blow-away-preview');
                }
            }
        }
    }
}

function hideBlowAwayPreview() {
    const previewCells = elements.gameBoard.querySelectorAll('.blow-away-preview');
    previewCells.forEach(cell => {
        cell.classList.remove('blow-away-preview');
    });
}

function addSanctuaryHoverEffect() {
    const cells = elements.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', showSanctuaryPreview);
        cell.addEventListener('mouseleave', hideSanctuaryPreview);
    });
}

function removeSanctuaryHoverEffect() {
    const cells = elements.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.removeEventListener('mouseenter', showSanctuaryPreview);
        cell.removeEventListener('mouseleave', hideSanctuaryPreview);
    });
    hideSanctuaryPreview();
}

function showSanctuaryPreview(event) {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // 2x2の範囲をハイライト（聖域は左上隅を指定）
    for (let r = row; r < row + 2; r++) {
        for (let c = col; c < col + 2; c++) {
            if (r < 8 && c < 8) {
                const targetCell = elements.gameBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (targetCell) {
                    targetCell.classList.add('sanctuary-preview');
                }
            }
        }
    }
}

function hideSanctuaryPreview() {
    const previewCells = elements.gameBoard.querySelectorAll('.sanctuary-preview');
    previewCells.forEach(cell => {
        cell.classList.remove('sanctuary-preview');
    });
}

export function renderCardReference(cardDeck) {
    elements.cardList.innerHTML = '';
    cardDeck.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'reference-card';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'reference-card-name';
        nameElement.textContent = card.name;
        
        const descElement = document.createElement('div');
        descElement.className = 'reference-card-desc';
        descElement.textContent = card.description;
        
        cardElement.appendChild(nameElement);
        cardElement.appendChild(descElement);
        elements.cardList.appendChild(cardElement);
    });
}

export function showGameResultModal(blackScore, whiteScore) {
    let winnerText = '';
    if (blackScore > whiteScore) {
        winnerText = '黒の勝利！';
    } else if (whiteScore > blackScore) {
        winnerText = '白の勝利！';
    } else {
        winnerText = '引き分け！';
    }
    
    elements.winnerTitle.textContent = winnerText;
    elements.finalBlackScore.textContent = blackScore;
    elements.finalWhiteScore.textContent = whiteScore;
    elements.gameResultModal.style.display = 'flex';
}

export function hideGameResultModal() {
    elements.gameResultModal.style.display = 'none';
}
