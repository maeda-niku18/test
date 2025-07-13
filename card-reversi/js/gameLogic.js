export function isValidMove(board, row, col, player, noMoreThanTwoActive = false) {
    if (board[row][col] !== null) {
        return false;
    }
    const flippable = getFlippableDiscs(board, row, col, player);
    if (noMoreThanTwoActive && flippable.length > 2) {
        return false;
    }
    return flippable.length > 0;
}

export function getFlippableDiscs(board, row, col, player) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    const opponent = player === 'black' ? 'white' : 'black';
    let flippableDiscs = [];

    for (const [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let discsToFlip = [];

        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
            discsToFlip.push({ x, y });
            x += dx;
            y += dy;
        }

        if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
            flippableDiscs = flippableDiscs.concat(discsToFlip);
        }
    }
    return flippableDiscs;
}

export function flipDiscs(gameState, discsToFlip) {
    let triggeredMine = null;
    for (const disc of discsToFlip) {
        const isSticker = gameState.attachedStickers.some(s => s.row === disc.x && s.col === disc.y);
        if (isSticker) continue;

        const inSanctuary = gameState.sanctuaries.some(s => 
            disc.x >= s.row && disc.x < s.row + 2 &&
            disc.y >= s.col && disc.y < s.col + 2
        );
        if (inSanctuary) continue;

        // Check for mines on the regular board
        if (disc.x >= 0 && disc.x < 8 && disc.y >= 0 && disc.y < 8) {
            const mineIndex = gameState.mines.findIndex(m => m.row === disc.x && m.col === disc.y);
            if (mineIndex !== -1) {
                triggeredMine = gameState.mines.splice(mineIndex, 1)[0];
                break; 
            }
            gameState.board[disc.x][disc.y] = gameState.currentPlayer;
        }
    }

    if (triggeredMine) {
        detonateMine(gameState, triggeredMine);
    }
}

function detonateMine(gameState, mine) {
    console.log(`Mine detonated at (${mine.row}, ${mine.col}) for ${mine.owner}!`);
    for (let r = mine.row - 1; r <= mine.row + 1; r++) {
        for (let c = mine.col - 1; c <= mine.col + 1; c++) {
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                gameState.board[r][c] = mine.owner;
            }
        }
    }
}