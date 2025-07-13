import { showMessage } from './ui.js';
import { isValidMove, getFlippableDiscs } from './gameLogic.js';

const cardDeck = [
    { name: 'スキップ ⏭️', id: 'skip', description: '相手の手番を1回スキップします。', requiresTarget: false },
    { name: '吹っ飛ばし 💨', id: 'blow-away', description: '選択したマスを左上とする2x2の範囲のコマを消し去ります。', requiresTarget: true },
    { name: '地雷 💣', id: 'mine', description: '自分のコマに地雷を設置。ひっくり返されると爆発し、周囲3x3のコマを自分の色に変えます。', requiresTarget: true },
    { name: '枠外置き 🔲', id: 'out-of-bounds', description: '盤面の外周に隣接する形でコマを置けます。', requiresTarget: true },
    { name: '突然置き ⚡', id: 'sudden-placement', description: '隣接したマスにコマを置きます（ひっくり返せません）。', requiresTarget: true },
    { name: 'コマの貼り付け 🔒', id: 'attach-sticker', description: '相手のコマにステッカーを貼り、ひっくり返らなくします。', requiresTarget: true },
    { name: '台パン 🔥', id: 'table-flip', description: '盤上のコマをランダムに0〜5個ひっくり返します。', requiresTarget: false },
    { name: '賄賂 💰', id: 'bribe', description: '次の相手の番、最も取得枚数が少ないマスに強制的に置かせます。', requiresTarget: false },
    { name: '神の一手 ⚡', id: 'gods-move', description: 'マスの枠線上に無理やりコマを置き、斜めのみ判定が作用してひっくり返します。', requiresTarget: true },
    { name: 'たくさん取らないで！ 🛡️', id: 'no-more-than-two', description: '次の相手の手番では2つ以上ひっくり返す箇所に置くことができません。', requiresTarget: false },
    { name: '魔王の攻撃 👹', id: 'demon-king-attack', description: '角以外の相手のコマを2つ選んで自分の色に変更します。', requiresTarget: true },
    { name: '第三の色召喚 🔴', id: 'third-color-summon', description: '空いているマスにひっくり返せない赤色のコマを置きます。', requiresTarget: true },
    { name: '等価交換 🔄', id: 'equivalent-exchange', description: '盤上にある自分のコマ1つと相手のコマ1つを、場所を入れ替えます。', requiresTarget: true },
    { name: '重力反転 🌀', id: 'gravity-reversal', description: '盤上の全てのコマが、盤の反対側へスライドします。', requiresTarget: false },
    { name: '伝染 🦠', id: 'infection', description: '自分のコマを1つ選び、次の相手のターン終了時に隣接する相手のコマを1つ自分の色に変えます。', requiresTarget: true },
    { name: '聖域 ✨', id: 'sanctuary', description: '2x2の範囲を指定し、次の自分のターンまでその中のコマはひっくり返されなくなります。', requiresTarget: true },
];

let fullDeck = [];

export function getCardDefinition(id) {
    return cardDeck.find(card => card.id === id);
}

export function getCardDeck() {
    return cardDeck;
}

export function createFullDeck() {
    fullDeck = [...cardDeck];
}

export function dealInitialCards(playerHands) {
    createFullDeck();
    let deck = [...fullDeck].sort(() => 0.5 - Math.random());
    // Ensure deck has enough cards for dealing
    while (deck.length < 6) {
        deck.push(...cardDeck);
    }

    for (let i = 0; i < 3; i++) {
        playerHands.black.push(deck.pop());
        playerHands.white.push(deck.pop());
    }
}

export function canUseCard(turn, cardCooldown, player) {
    if (turn < 4) {
        showMessage('カードは4手目以降から使用できます。');
        return false;
    }
    if (cardCooldown[player] > 0) {
        showMessage(`カードはあと ${cardCooldown[player]} ターンは使用できません。`);
        return false;
    }
    return true;
}

export function getFlippableDiscsGodsMove(board, row, col, player) {
    const directions = [
        [-1, -1], [1, 1], [-1, 1], [1, -1] // Only diagonal directions
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

export function getDemonKingAttackPlaceable(board, currentPlayer) {
    const placeable = [];
    const opponent = currentPlayer === 'black' ? 'white' : 'black';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const isCorner = (r === 0 && c === 0) || (r === 0 && c === 7) || (r === 7 && c === 0) || (r === 7 && c === 7);
            if (board[r][c] === opponent && !isCorner) {
                placeable.push({ row: r, col: c });
            }
        }
    }
    return placeable;
}

export function handleCardEffect(card, row, col, gameState) {
    let cardUsed = false;
    let regularTurnFollows = true;
    let opponentColor; // Declare opponentColor once here

    switch (card.id) {
        case 'skip':
            showMessage(`「${card.name}」の効果発動！ 相手のターンをスキップします。`);
            gameState.turn++;
            opponentColor = gameState.currentPlayer === 'black' ? 'white' : 'black';
            if (gameState.cardCooldown[opponentColor] > 0) {
                gameState.cardCooldown[opponentColor]--;
            }
            cardUsed = true;
            regularTurnFollows = false;
            break;

        case 'blow-away':
            if (row === null || col === null) return { cardUsed: false };
            showMessage(`「${card.name}」の効果発動！`);
            for (let r = row; r < row + 2; r++) {
                for (let c = col; c < col + 2; c++) {
                    if (r < 8 && c < 8) {
                        gameState.board[r][c] = null;
                    }
                }
            }
            cardUsed = true;
            break;
        
        case 'mine':
            if (row === null || col === null || gameState.board[row][col] !== gameState.currentPlayer) {
                showMessage('自分のコマの上に設置してください。');
                return { cardUsed: false };
            }
            showMessage(`「${card.name}」を設置しました。`);
            gameState.mines.push({ row, col, owner: gameState.currentPlayer });
            cardUsed = true;
            break;

        case 'out-of-bounds':
            if (row === null || col === null) return { cardUsed: false };
            const outOfBoundsPlaceable = getOutOfBoundsPlaceable(gameState.board);
            if (!outOfBoundsPlaceable.some(p => p.row === row && p.col === col)) {
                showMessage('その場所には置けません。');
                return { cardUsed: false };
            }
            gameState.board[row][col] = gameState.currentPlayer;
            cardUsed = true;
            break;

        case 'sudden-placement':
            if (row === null || col === null) return { cardUsed: false };
            const suddenPlaceable = getSuddenPlacementPlaceable(gameState.board);
            if (!suddenPlaceable.some(p => p.row === row && p.col === col)) {
                showMessage('その場所には置けません。');
                return { cardUsed: false };
            }
            gameState.board[row][col] = gameState.currentPlayer;
            cardUsed = true;
            break;

        case 'attach-sticker':
            if (row === null || col === null || gameState.board[row][col] === null || gameState.board[row][col] === gameState.currentPlayer) {
                showMessage('相手のコマにのみ貼り付けできます。');
                return { cardUsed: false };
            }
            showMessage(`「${card.name}」を使用しました。`);
            gameState.attachedStickers.push({ row, col, owner: gameState.board[row][col] });
            cardUsed = true;
            break;

        case 'table-flip':
            showMessage(`「${card.name}」の効果発動！`);
            const allDiscs = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (gameState.board[r][c] !== null) {
                        allDiscs.push({ r, c });
                    }
                }
            }
            const numToFlip = Math.floor(Math.random() * 6);
            for (let i = 0; i < numToFlip; i++) {
                if (allDiscs.length === 0) break;
                const randIndex = Math.floor(Math.random() * allDiscs.length);
                const disc = allDiscs.splice(randIndex, 1)[0];
                const currentPiece = gameState.board[disc.r][disc.c];
                gameState.board[disc.r][disc.c] = currentPiece === 'black' ? 'white' : 'black';
            }
            cardUsed = true;
            break;

        case 'bribe':
            showMessage(`「${card.name}」の効果発動！ 次の相手のターンを操作します。`);
            gameState.bribeActive = true;
            cardUsed = true;
            break;

        case 'gods-move':
            if (row === null || col === null) return { cardUsed: false };
            const flippable = getFlippableDiscsGodsMove(gameState.board, row, col, gameState.currentPlayer);
            if (flippable.length === 0) {
                showMessage('斜めにひっくり返せるコマがありません。');
                return { cardUsed: false };
            }
            gameState.board[row][col] = gameState.currentPlayer;
            for (const disc of flippable) {
                gameState.board[disc.x][disc.y] = gameState.currentPlayer;
            }
            cardUsed = true;
            break;

        case 'no-more-than-two':
            showMessage(`「${card.name}」の効果発動！ 次の相手のターンは2つ以上ひっくり返せません。`);
            gameState.noMoreThanTwoActive = true;
            cardUsed = true;
            break;

        case 'demon-king-attack':
            if (row === null || col === null) return { cardUsed: false };
            const targetPiece = gameState.board[row][col];
            opponentColor = gameState.currentPlayer === 'black' ? 'white' : 'black';
            const isCorner = (row === 0 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 0) || (row === 7 && col === 7);

            if (targetPiece !== opponentColor || isCorner) {
                showMessage('角以外の相手のコマを選択してください。');
                return { cardUsed: false };
            }

            if (!gameState.selectedDemonKingTargets) {
                gameState.selectedDemonKingTargets = [];
            }
            gameState.selectedDemonKingTargets.push({ row, col });
            gameState.board[row][col] = gameState.currentPlayer; // 仮で色を変える
            showMessage(`(${row}, ${col})を選択しました。あと${2 - gameState.selectedDemonKingTargets.length}つ選択してください。`);

            if (gameState.selectedDemonKingTargets.length === 2) {
                showMessage(`「${card.name}」の効果発動！`);
                cardUsed = true;
                delete gameState.selectedDemonKingTargets;
            } else {
                regularTurnFollows = false; // 続けて選択させる
            }
            break;

        case 'third-color-summon':
            if (row === null || col === null || gameState.board[row][col] !== null) {
                showMessage('空いているマスにのみ置けます。');
                return { cardUsed: false };
            }
            showMessage(`「${card.name}」の効果発動！`);
            gameState.board[row][col] = 'red';
            cardUsed = true;
            break;

        case 'equivalent-exchange':
            if (row === null || col === null) return { cardUsed: false };

            if (!gameState.selectedEquivalentExchangeTargets) {
                gameState.selectedEquivalentExchangeTargets = [];
            }

            const targetPlayer = gameState.board[row][col];
            opponentColor = gameState.currentPlayer === 'black' ? 'white' : 'black';

            if (gameState.selectedEquivalentExchangeTargets.length === 0) {
                if (targetPlayer !== gameState.currentPlayer) {
                    showMessage('自分のコマを選択してください。');
                    return { cardUsed: false };
                }
                gameState.selectedEquivalentExchangeTargets.push({ row, col, originalColor: targetPlayer });
                showMessage(`自分のコマ(${row}, ${col})を選択しました。次に相手のコマを選択してください。`);
                regularTurnFollows = false;
            } else if (gameState.selectedEquivalentExchangeTargets.length === 1) {
                if (targetPlayer !== opponentColor) {
                    showMessage('相手のコマを選択してください。');
                    return { cardUsed: false };
                }
                gameState.selectedEquivalentExchangeTargets.push({ row, col, originalColor: targetPlayer });

                const [myPiece, opponentPiece] = gameState.selectedEquivalentExchangeTargets;
                const tempColor = gameState.board[myPiece.row][myPiece.col];
                gameState.board[myPiece.row][myPiece.col] = gameState.board[opponentPiece.row][opponentPiece.col];
                gameState.board[opponentPiece.row][opponentPiece.col] = tempColor;

                showMessage(`「${card.name}」の効果発動！コマを入れ替えました。`);
                cardUsed = true;
                delete gameState.selectedEquivalentExchangeTargets;
            }
            break;

        case 'gravity-reversal':
            showMessage(`「${card.name}」の効果発動！盤上のコマがスライドします。`);
            const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
            const directions = [
                { dr: 7, dc: 0, name: '上下反転' }, // Up-down
                { dr: 0, dc: 7, name: '左右反転' }, // Left-right
                { dr: 7, dc: 7, name: '斜め反転 (左上-右下)' }, // Diagonal (top-left to bottom-right)
                { dr: 7, dc: -7, name: '斜め反転 (右上-左下)' }  // Diagonal (top-right to bottom-left)
            ];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (gameState.board[r][c] !== null) {
                        let newR = r;
                        let newC = c;

                        if (randomDirection.dr !== 0) {
                            newR = 7 - r; // Invert row
                        }
                        if (randomDirection.dc !== 0) {
                            newC = 7 - c; // Invert column
                        }
                        // For diagonal, if dr and dc are both non-zero, it's already handled by inverting both
                        // For specific diagonal (top-right to bottom-left), need to adjust
                        if (randomDirection.name === '斜め反転 (右上-左下)') {
                            newR = c;
                            newC = r;
                        }

                        newBoard[newR][newC] = gameState.board[r][c];
                    }
                }
            }
            gameState.board = newBoard;
            cardUsed = true;
            break;

        case 'infection':
            if (row === null || col === null || gameState.board[row][col] !== gameState.currentPlayer) {
                showMessage('自分のコマを選択してください。');
                return { cardUsed: false };
            }
            showMessage(`「${card.name}」を設置しました。`);
            gameState.infectedDiscs.push({ row, col, owner: gameState.currentPlayer });
            cardUsed = true;
            break;

        case 'sanctuary':
            if (row === null || col === null || row > 6 || col > 6) {
                showMessage('2x2の範囲の左上隅を選択してください。');
                return { cardUsed: false };
            }
            showMessage(`「${card.name}」を設置しました。`);
            gameState.sanctuaries.push({ row, col, owner: gameState.currentPlayer, turnsLeft: 2 }); // 自分のターンを含めて2ターン
            cardUsed = true;
            break;
    }

    return { cardUsed, regularTurnFollows };
}

export function getSuddenPlacementPlaceable(board) {
    const placeable = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === null) { // Must be an empty cell
                // Check for any adjacent piece
                let hasAdjacent = false;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] !== null) {
                            hasAdjacent = true;
                            break;
                        }
                    }
                    if (hasAdjacent) break;
                }
                if (hasAdjacent) {
                    placeable.push({ row: r, col: c });
                }
            }
        }
    }
    return placeable;
}

export function getOutOfBoundsPlaceable(board) {
    const placeable = [];
    for (let i = -1; i < 9; i++) {
        placeable.push({ row: -1, col: i });
        placeable.push({ row: 8, col: i });
        placeable.push({ row: i, col: -1 });
        placeable.push({ row: i, col: 8 });
    }
    return placeable.filter(p => {
        // Check if adjacent to any piece
        for (let r = p.row - 1; r <= p.row + 1; r++) {
            for (let c = p.col - 1; c <= p.col + 1; c++) {
                if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] !== null) {
                    return true;
                }
            }
        }
        return false;
    });
}