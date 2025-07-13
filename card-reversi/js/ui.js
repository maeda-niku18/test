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
};

export function renderBoard(board, mines = [], placeable = [], attachedStickers = [], selectedEquivalentExchangeTargets = [], infectedDiscs = [], sanctuaries = []) {
    elements.gameBoard.innerHTML = '';
    const boardSize = 8;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
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

export function updateScores(board) {
    let blackScore = 0;
    let whiteScore = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === 'black') blackScore++;
            if (board[row][col] === 'white') whiteScore++;
        }
    }
    elements.blackScore.textContent = blackScore;
    elements.whiteScore.textContent = whiteScore;
}

export function updateTurnInfo(turn, currentPlayer) {
    elements.turnInfo.textContent = `${currentPlayer === 'black' ? '黒' : '白'}のターン (ターン ${turn + 1})`;
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
    } else {
        elements.gameBoard.style.cursor = 'default';
    }
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
