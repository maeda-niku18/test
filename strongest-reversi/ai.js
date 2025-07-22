const weights = [
    [120, -20, 20,  5,  5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20,  5,  5, 20, -20, 120],
];

function findBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = null;
    const validMoves = getValidMoves(board, 'white');

    if (validMoves.length === 0) {
        return null;
    }

    for (const move of validMoves) {
        const score = weights[move.row][move.col];
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function getValidMoves(board, player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMoveForAI(board, row, col, player)) {
                moves.push({ row, col });
            }
        }
    }
    return moves;
}

function isValidMoveForAI(board, row, col, player) {
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
