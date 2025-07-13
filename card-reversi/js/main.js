import * as UI from './ui.js';
import * as GameLogic from './gameLogic.js';
import * as CardLogic from './cardLogic.js';

document.addEventListener('DOMContentLoaded', () => {
    const gameState = {
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        outOfBoundsBoard: new Map(), // 枠外エリアのコマを管理 key: "row,col", value: color
        currentPlayer: 'black',
        turn: 0,
        activeCard: null,
        cardCooldown: { black: 0, white: 0 },
        playerHands: { black: [], white: [] },
        mines: [], // {row, col, owner}
        attachedStickers: [], // {row, col, owner}
        bribeActive: false,
        noMoreThanTwoActive: null, // 制限を受けるプレイヤーを指定
        selectedEquivalentExchangeTargets: [],
        infectedDiscs: [], // {row, col, owner}
        sanctuaries: [], // {row, col, owner, turnsLeft}
        skipNextTurn: false,
    };

    function initializeGame() {
        console.log('Initializing game...');
        gameState.board[3][3] = 'white';
        gameState.board[3][4] = 'black';
        gameState.board[4][3] = 'black';
        gameState.board[4][4] = 'white';
        CardLogic.dealInitialCards(gameState.playerHands);
        UI.renderCardReference(CardLogic.getCardDeck());
        updateAllUI();
        console.log('Game initialized.');
    }

    function updateAllUI() {
        let placeable = [];
        if (gameState.activeCard) {
            const cardId = gameState.activeCard.card.id;
            if (cardId === 'out-of-bounds') {
                placeable = CardLogic.getOutOfBoundsPlaceable(gameState.board, gameState.outOfBoundsBoard);
            } else if (cardId === 'sudden-placement') {
                placeable = CardLogic.getSuddenPlacementPlaceable(gameState.board);
            } else if (cardId === 'demon-king-attack') {
                placeable = CardLogic.getDemonKingAttackPlaceable(gameState.board, gameState.currentPlayer);
            } else if (cardId === 'equivalent-exchange') {
                placeable = CardLogic.getEquivalentExchangePlaceable(gameState.board, gameState.currentPlayer, gameState.selectedEquivalentExchangeTargets || []);
            }
        } else {
            // 通常のリバーシの置ける箇所を表示
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (GameLogic.isValidMove(gameState.board, r, c, gameState.currentPlayer, gameState.noMoreThanTwoActive === gameState.currentPlayer)) {
                        placeable.push({ row: r, col: c });
                    }
                }
            }
        }
        const showOutOfBounds = gameState.activeCard && gameState.activeCard.card.id === 'out-of-bounds';
        UI.renderBoard(gameState.board, gameState.mines, placeable, gameState.attachedStickers, gameState.selectedEquivalentExchangeTargets, gameState.infectedDiscs, gameState.sanctuaries, gameState.outOfBoundsBoard, showOutOfBounds);
        UI.renderHands(gameState.playerHands, useCard);
        UI.updateScores(gameState.board, gameState.outOfBoundsBoard);
        UI.updateTurnInfo(gameState.turn, gameState.currentPlayer);
        UI.highlightActivePlayer(gameState.currentPlayer);
        UI.updateCursor(gameState.activeCard);
    }

    function nextTurn() {
        const previousPlayer = gameState.currentPlayer; // ターンを終えたプレイヤー

        // スキップフラグをチェック
        if (gameState.skipNextTurn) {
            gameState.skipNextTurn = false;
            UI.showMessage(`${gameState.currentPlayer === 'black' ? 'White' : 'Black'}のターンがスキップされました。`);
            gameState.turn++;
            // プレイヤーを切り替えずに、同じプレイヤーのターンを続ける
        } else {
            // 通常のターン切り替え
            gameState.currentPlayer = (previousPlayer === 'black' ? 'white' : 'black');
            gameState.turn++;
        }

        // 現在のプレイヤーのカードクールダウンを減らす
        if (gameState.cardCooldown[gameState.currentPlayer] > 0) {
            gameState.cardCooldown[gameState.currentPlayer]--;
        }

        // --- 新しい現在のプレイヤーのターン開始時に発動する効果 --- 
        if (gameState.bribeActive) {
            // 賄賂は前のプレイヤーが使い、現在のプレイヤーに影響を与える
            handleBribeTurn();
            gameState.bribeActive = false; // 効果を適用したらリセット
            // 賄賂効果適用後、自分（賄賂を使ったプレイヤー）のターンに戻る
            gameState.currentPlayer = previousPlayer;
            UI.showMessage(`賄賂効果適用後、${gameState.currentPlayer === 'black' ? 'Black' : 'White'}のターンに戻ります。`);
        }

        // --- 前のプレイヤーのターン終了時に発動する効果 ---
        // 伝染: 感染させたプレイヤーの相手のターン終了時に発動
        if (gameState.infectedDiscs.length > 0) {
            gameState.infectedDiscs = gameState.infectedDiscs.filter(disc => {
                // disc.owner は感染させたプレイヤー
                // 現在のプレイヤーが disc.owner の相手であれば、効果を発動
                if (disc.owner !== gameState.currentPlayer) { 
                    const directions = [
                        [-1, -1], [-1, 0], [-1, 1],
                        [0, -1],           [0, 1],
                        [1, -1], [1, 0], [1, 1]
                    ];
                    let converted = false;
                    for (const [dr, dc] of directions) {
                        const nr = disc.row + dr;
                        const nc = disc.col + dc;
                        // 隣接するコマが現在のプレイヤー（ターンを終えた相手）のコマであればひっくり返す
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && gameState.board[nr][nc] === gameState.currentPlayer) {
                            gameState.board[nr][nc] = disc.owner; // 感染させたプレイヤーの色にひっくり返す
                            converted = true;
                            break;
                        }
                    }
                    if (converted) {
                        UI.showMessage(`伝染効果発動！ (${disc.row}, ${disc.col})の隣のコマがひっくり返りました。`);
                    }
                    return false; // 処理したら削除
                }
                return true; // まだ処理していなければ残す
            });
        }

        // 聖域の残りターンを減らす
        gameState.sanctuaries = gameState.sanctuaries.filter(s => {
            s.turnsLeft--;
            return s.turnsLeft > 0;
        });

        // 「いっぱい取らないで」効果をリセット（1ターンのみ有効）
        if (gameState.noMoreThanTwoActive === previousPlayer) {
            gameState.noMoreThanTwoActive = null;
        }

        // --- 新しい現在のプレイヤーの有効な手を確認 ---
        const hasValidMove = checkForValidMoves(gameState.currentPlayer);
        if (!hasValidMove) {
            UI.showMessage(`${gameState.currentPlayer === 'black' ? 'Black' : 'White'}は置ける場所がないためパスします。`, 0);
            // 置ける場所がなければ、もう一度プレイヤーを切り替える（相手のターンへ）
            gameState.currentPlayer = (gameState.currentPlayer === 'black' ? 'white' : 'black');
            const opponentHasValidMove = checkForValidMoves(gameState.currentPlayer);
            if (!opponentHasValidMove) {
                endGame();
                return;
            } else {
                UI.showMessage(`${gameState.currentPlayer === 'black' ? 'Black' : 'White'}のターンです。`, 0);
            }
        }

        updateAllUI();
    }

    function checkForValidMoves(player) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (GameLogic.isValidMove(gameState.board, r, c, player, gameState.noMoreThanTwoActive === player)) {
                    return true;
                }
            }
        }
        return false;
    }

    function endGame() {
        // 最後の手を反映させるため、UI更新を先に行う
        updateAllUI();
        
        // 最終スコアを再計算（枠外のコマも含む）
        let blackScore = 0;
        let whiteScore = 0;
        
        // 通常のボードをカウント（赤いコマは除外）
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (gameState.board[row][col] === 'black') blackScore++;
                if (gameState.board[row][col] === 'white') whiteScore++;
                // 'red'はカウントしない
            }
        }
        
        // 枠外のコマもカウント（赤いコマは除外）
        for (const [position, color] of gameState.outOfBoundsBoard.entries()) {
            if (color === 'black') blackScore++;
            if (color === 'white') whiteScore++;
            // 'red'はカウントしない
        }

        // 少し遅延してモーダルを表示（UI更新が完了してから）
        setTimeout(() => {
            UI.showGameResultModal(blackScore, whiteScore);
        }, 100);
        
        // Disable further interaction
        UI.elements.gameBoard.style.pointerEvents = 'none';
    }

    function handleBribeTurn() {
        const possibleMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (GameLogic.isValidMove(gameState.board, r, c, gameState.currentPlayer, gameState.noMoreThanTwoActive === gameState.currentPlayer)) { // noMoreThanTwoActiveも考慮
                    const flippable = GameLogic.getFlippableDiscs(gameState.board, r, c, gameState.currentPlayer);
                    possibleMoves.push({ row: r, col: c, flippableCount: flippable.length });
                }
            }
        }

        if (possibleMoves.length > 0) {
            possibleMoves.sort((a, b) => a.flippableCount - b.flippableCount);
            const bestMove = possibleMoves[0];
            const flippableDiscs = GameLogic.getFlippableDiscs(gameState.board, bestMove.row, bestMove.col, gameState.currentPlayer);
            gameState.board[bestMove.row][bestMove.col] = gameState.currentPlayer;
            GameLogic.flipDiscs(gameState, flippableDiscs);
            UI.showMessage(`${gameState.currentPlayer === 'black' ? 'Black' : 'White'}は賄賂により、(${bestMove.row}, ${bestMove.col})に強制的に置かれました。`);
        } else {
            UI.showMessage(`${gameState.currentPlayer === 'black' ? 'Black' : 'White'}は置ける場所がないためパスしました。`);
        }
    }

    function useCard(card, player, cardIndex) {
        if (player !== gameState.currentPlayer || !CardLogic.canUseCard(gameState.turn, gameState.cardCooldown, player)) return;

        gameState.activeCard = { card, player, cardIndex };
        const cardDef = CardLogic.getCardDefinition(card.id);

        if (!cardDef.requiresTarget) {
            const { cardUsed, regularTurnFollows } = CardLogic.handleCardEffect(card, null, null, gameState);
            if (cardUsed) {
                finalizeCardUsage(regularTurnFollows);
            }
        } else {
            UI.showMessage(`「${card.name}」を選択しました。効果を発動する場所をクリックしてください。`, 0);
            updateAllUI();
        }
    }

    function finalizeCardUsage(regularTurnFollows) {
        gameState.playerHands[gameState.currentPlayer].splice(gameState.activeCard.cardIndex, 1);
        gameState.cardCooldown[gameState.currentPlayer] = 2;
        gameState.activeCard = null;

        if (regularTurnFollows) {
            nextTurn();
        } else {
            updateAllUI();
        }
    }

    function cancelCardSelection() {
        gameState.activeCard = null;
        UI.showMessage('カード選択をキャンセルしました。');
        updateAllUI();
    }

    function resetGame() {
        // ゲーム状態をリセット
        gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
        gameState.outOfBoundsBoard.clear();
        gameState.currentPlayer = 'black';
        gameState.turn = 0;
        gameState.activeCard = null;
        gameState.cardCooldown = { black: 0, white: 0 };
        gameState.playerHands = { black: [], white: [] };
        gameState.mines = [];
        gameState.attachedStickers = [];
        gameState.bribeActive = false;
        gameState.noMoreThanTwoActive = null;
        gameState.selectedEquivalentExchangeTargets = [];
        gameState.infectedDiscs = [];
        gameState.sanctuaries = [];
        gameState.skipNextTurn = false;
        
        // ゲームを再初期化
        initializeGame();
        
        // モーダルを閉じる
        UI.hideGameResultModal();
        
        // ボード操作を再有効化
        UI.elements.gameBoard.style.pointerEvents = 'auto';
    }

    UI.elements.cancelCard.addEventListener('click', cancelCardSelection);
    UI.elements.resetGame.addEventListener('click', resetGame);
    UI.elements.playAgainBtn.addEventListener('click', resetGame);
    UI.elements.closeModalBtn.addEventListener('click', () => {
        UI.hideGameResultModal();
    });

    UI.elements.gameBoard.addEventListener('click', (event) => {
        console.log('Board clicked!', event.target);
        const cell = event.target.closest('.cell, .out-of-bounds');
        if (!cell) {
            console.log('Clicked outside a cell.');
            return;
        }

        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        console.log(`Clicked cell: (${row}, ${col})`);

        if (gameState.activeCard) {
            const cardDef = CardLogic.getCardDefinition(gameState.activeCard.card.id);
            if (cardDef.requiresTarget) {
                const { cardUsed, regularTurnFollows } = CardLogic.handleCardEffect(gameState.activeCard.card, row, col, gameState);
                if (cardUsed) {
                    finalizeCardUsage(regularTurnFollows);
                }
            } else {
                // ターゲットを必要としないカードはuseCardで既に処理されているはず
                // ここに来ることはないが、念のためactiveCardをリセット
                gameState.activeCard = null;
            }
            return;
        }

        if (GameLogic.isValidMove(gameState.board, row, col, gameState.currentPlayer, gameState.noMoreThanTwoActive === gameState.currentPlayer)) {
            const flippableDiscs = GameLogic.getFlippableDiscs(gameState.board, row, col, gameState.currentPlayer);
            gameState.board[row][col] = gameState.currentPlayer;
            GameLogic.flipDiscs(gameState, flippableDiscs);
            nextTurn();
        } else {
            UI.showMessage('そこには置けません。');
        }
    });

    initializeGame();
});