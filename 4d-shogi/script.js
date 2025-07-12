document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 3; // 3x3x3x3 のボード
    const boardElement = document.getElementById('game-board');
    const turnInfoElement = document.getElementById('turn-info');
    const player1CapturedElement = document.querySelector('#player1-captured .pieces');
    const player2CapturedElement = document.querySelector('#player2-captured .pieces');

    let board = []; // w, z, y, x の4次元配列
    let currentPlayer = 1;
    let selectedPiece = null; // {w, z, y, x, piece} or {type: 'captured', piece, player}
    let capturedPieces = { 1: [], 2: [] };
    let gameOver = false;

    // 駒の定義（成り駒も含む）
    const pieces = {
        '玉': { name: '玉', promoted: false }, '王': { name: '王', promoted: false }, 
        '金': { name: '金', promoted: false }, '銀': { name: '銀', promoted: false },
        '桂': { name: '桂', promoted: false }, '香': { name: '香', promoted: false }, 
        '歩': { name: '歩', promoted: false }, '角': { name: '角', promoted: false }, 
        '飛': { name: '飛', promoted: false },
        // 成り駒
        '成': { name: '成', promoted: true, originalName: '銀' },
        '圭': { name: '圭', promoted: true, originalName: '桂' },
        '杏': { name: '杏', promoted: true, originalName: '香' },
        'と': { name: 'と', promoted: true, originalName: '歩' },
        '馬': { name: '馬', promoted: true, originalName: '角' },
        '龍': { name: '龍', promoted: true, originalName: '飛' }
    };

    // 成り可能な駒の変換テーブル
    const promotionMap = {
        '銀': '成', '桂': '圭', '香': '杏', 
        '歩': 'と', '角': '馬', '飛': '龍'
    };

    function initializeGame() {
        createBoard();
        placeInitialPieces();
        renderBoard();
        updateTurnInfo();
    }

    function createBoard() {
        board = Array(boardSize).fill(null).map(() =>
            Array(boardSize).fill(null).map(() =>
                Array(boardSize).fill(null).map(() =>
                    Array(boardSize).fill(null)
                )
            )
        );
    }

    // 新しい初期配置ルール（9次元レイアウト）
    function placeInitialPieces() {
        // Player 1 (青チーム) - 次元1,2,3
        const p1_layouts = {
            0: { // w=0 (次元1,2,3)
                0: [ // z=0 (次元1)
                    ['香', '桂', '銀'],
                    ['', '飛', ''],
                    ['歩', '歩', '歩']
                ],
                1: [ // z=1 (次元2)
                    ['金', '玉', '金'],
                    ['', '', ''],
                    ['歩', '歩', '歩']
                ],
                2: [ // z=2 (次元3)
                    ['銀', '桂', '香'],
                    ['', '角', ''],
                    ['歩', '歩', '歩']
                ]
            }
        };

        // Player 1の駒を配置
        for (let z = 0; z < boardSize; z++) {
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    const pieceName = p1_layouts[0][z][y][x];
                    if (pieceName) {
                        board[0][z][y][x] = { ...pieces[pieceName], owner: 1 };
                    }
                }
            }
        }

        // Player 2 (赤チーム) - 次元7,8,9
        const p2_layouts = {
            2: { // w=2 (次元7,8,9)
                0: [ // z=0 (次元7)
                    ['歩', '歩', '歩'],
                    ['', '角', ''],
                    ['香', '桂', '銀']
                ],
                1: [ // z=1 (次元8)
                    ['歩', '歩', '歩'],
                    ['', '', ''],
                    ['金', '王', '金']
                ],
                2: [ // z=2 (次元9)
                    ['歩', '歩', '歩'],
                    ['', '飛', ''],
                    ['銀', '桂', '香']
                ]
            }
        };

        // Player 2の駒を配置
        for (let z = 0; z < boardSize; z++) {
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    const pieceName = p2_layouts[2][z][y][x];
                    if (pieceName) {
                        board[2][z][y][x] = { ...pieces[pieceName], owner: 2 };
                    }
                }
            }
        }
    }

    // 4次元座標から9x9座標へのマッピング関数
    function get4DFrom9x9(row, col) {
        const blockRow = Math.floor(row / 3);
        const blockCol = Math.floor(col / 3);
        const innerRow = row % 3;
        const innerCol = col % 3;
        
        // 9x9を3x3のブロックに分割し、各ブロックを4次元座標にマッピング
        const w = blockRow;
        const z = blockCol;
        const y = innerRow;
        const x = innerCol;
        
        return { w, z, y, x };
    }

    // 4次元座標から9x9座標へのマッピング関数
    function get9x9From4D(w, z, y, x) {
        const row = w * 3 + y;
        const col = z * 3 + x;
        return { row, col };
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        
        // 9x9グリッドを作成
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 4次元座標を取得
                const { w, z, y, x } = get4DFrom9x9(row, col);
                const pieceData = board[w][z][y][x];
                
                if (pieceData) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece player${pieceData.owner}${pieceData.promoted ? ' promoted' : ''}`;
                    const pieceNameElement = document.createElement('span');
                    pieceNameElement.className = 'piece-name';
                    pieceNameElement.textContent = pieceData.name;
                    pieceElement.appendChild(pieceNameElement);
                    cell.appendChild(pieceElement);
                }
                
                cell.addEventListener('click', () => handle9x9CellClick(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    function handle9x9CellClick(row, col) {
        const { w, z, y, x } = get4DFrom9x9(row, col);
        handleCellClick(w, z, y, x);
    }

    function handleCellClick(w, z, y, x) {
        if (gameOver) return;
        
        if (selectedPiece) {
            if (selectedPiece.type === 'captured') {
                // 持ち駒を配置する場合
                if (placeCapturedPiece(selectedPiece.index, w, z, y, x)) {
                    selectedPiece = null;
                    switchTurn();
                    clearHighlights();
                } else {
                    selectedPiece = null;
                    clearHighlights();
                }
            } else {
                // 通常の駒移動
                if (isValidMove(selectedPiece.w, selectedPiece.z, selectedPiece.y, selectedPiece.x, w, z, y, x)) {
                    movePiece(selectedPiece.w, selectedPiece.z, selectedPiece.y, selectedPiece.x, w, z, y, x);
                    selectedPiece = null;
                    switchTurn();
                    clearHighlights();
                } else {
                    selectedPiece = null;
                    clearHighlights();
                }
            }
        } else {
            const clickedPiece = board[w][z][y][x];
            if (clickedPiece && clickedPiece.owner === currentPlayer) {
                selectedPiece = { w, z, y, x, piece: clickedPiece };
                highlightSelected(w, z, y, x);
                highlightValidMoves(w, z, y, x);
            }
        }
    }

    function handleCapturedPieceClick(pieceIndex, player) {
        if (gameOver) return;
        if (player !== currentPlayer) return;
        
        selectedPiece = { type: 'captured', index: pieceIndex, player: player, piece: capturedPieces[player][pieceIndex] };
        clearHighlights();
        highlightEmptyCells();
    }

    function highlightEmptyCells() {
        for (let w = 0; w < boardSize; w++) {
            for (let z = 0; z < boardSize; z++) {
                for (let y = 0; y < boardSize; y++) {
                    for (let x = 0; x < boardSize; x++) {
                        if (!board[w][z][y][x]) {
                            const { row, col } = get9x9From4D(w, z, y, x);
                            const cell = document.querySelector(`.game-cell[data-row='${row}'][data-col='${col}']`);
                            if (cell) cell.classList.add('valid-move');
                        }
                    }
                }
            }
        }
    }
    
    function movePiece(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const pieceToMove = board[fromW][fromZ][fromY][fromX];
        const targetPiece = board[toW][toZ][toY][toX];

        if (targetPiece) {
            // 王/玉を取った場合は勝敗判定
            if (targetPiece.name === '王' || targetPiece.name === '玉') {
                showGameOverScreen(currentPlayer);
                return;
            }
            
            // 取った駒は成りを解除して持ち駒にする
            let capturedPiece = { ...targetPiece, owner: currentPlayer };
            if (targetPiece.promoted) {
                capturedPiece.name = pieces[targetPiece.name].originalName;
                capturedPiece.promoted = false;
            }
            capturedPieces[currentPlayer].push(capturedPiece);
        }

        // 移動先に駒を配置
        board[toW][toZ][toY][toX] = pieceToMove;
        board[fromW][fromZ][fromY][fromX] = null;

        // 成り判定
        checkPromotion(toW, toZ, toY, toX);

        renderAll();
    }

    function checkPromotion(w, z, y, x) {
        const piece = board[w][z][y][x];
        if (!piece || piece.promoted) return;

        // 成り可能な駒かチェック
        if (!promotionMap[piece.name]) return;

        // 成りゾーン判定（相手陣地）
        const { row } = get9x9From4D(w, z, y, x);
        const isPromotionZone = (piece.owner === 1 && row >= 6) || (piece.owner === 2 && row <= 2);

        if (isPromotionZone) {
            if (confirm(`${piece.name}を${promotionMap[piece.name]}に成りますか？`)) {
                promoteaPiece(w, z, y, x);
            }
        }
    }

    function promoteaPiece(w, z, y, x) {
        const piece = board[w][z][y][x];
        if (piece && promotionMap[piece.name]) {
            piece.name = promotionMap[piece.name];
            piece.promoted = true;
        }
    }

    function placeCapturedPiece(pieceIndex, toW, toZ, toY, toX) {
        // 空いているマスかチェック
        if (board[toW][toZ][toY][toX]) return false;

        // 持ち駒から駒を取得して配置
        const piece = capturedPieces[currentPlayer][pieceIndex];
        board[toW][toZ][toY][toX] = { ...piece, owner: currentPlayer };
        
        // 持ち駒から削除
        capturedPieces[currentPlayer].splice(pieceIndex, 1);
        
        renderAll();
        return true;
    }

    function showGameOverScreen(winner) {
        gameOver = true;
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const message = document.createElement('div');
        message.style.cssText = `
            background-color: var(--board-bg);
            color: var(--text-color);
            padding: 40px;
            border-radius: 20px;
            border: 3px solid var(--glow-color);
            text-align: center;
            box-shadow: 0 0 30px var(--glow-color);
        `;
        
        message.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px; text-shadow: 0 0 20px var(--glow-color);">
                Player ${winner} の勝利！
            </h1>
            <p style="font-size: 1.5rem; margin-bottom: 30px;">
                相手の王を討ち取りました！
            </p>
            <button onclick="location.reload()" style="
                font-size: 1.2rem;
                padding: 15px 30px;
                background-color: var(--glow-color);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
            ">
                もう一度プレイ
            </button>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
    }

    function switchTurn() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnInfo();
    }
    
    function renderAll() {
        renderBoard();
        renderCapturedPieces();
    }

    function updateTurnInfo() {
        turnInfoElement.textContent = `Player ${currentPlayer}のターン`;
        turnInfoElement.className = `player${currentPlayer}`;
    }
    
    function renderCapturedPieces() {
        player1CapturedElement.innerHTML = '';
        capturedPieces[1].forEach((p, index) => {
            const pieceEl = document.createElement('div');
            pieceEl.className = `piece player${p.owner} captured-piece`;
            pieceEl.textContent = p.name;
            pieceEl.style.cursor = 'pointer';
            pieceEl.addEventListener('click', () => handleCapturedPieceClick(index, 1));
            player1CapturedElement.appendChild(pieceEl);
        });

        player2CapturedElement.innerHTML = '';
        capturedPieces[2].forEach((p, index) => {
            const pieceEl = document.createElement('div');
            pieceEl.className = `piece player${p.owner} captured-piece`;
            pieceEl.textContent = p.name;
            pieceEl.style.cursor = 'pointer';
            pieceEl.addEventListener('click', () => handleCapturedPieceClick(index, 2));
            player2CapturedElement.appendChild(pieceEl);
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.game-cell').forEach(c => {
            c.classList.remove('selected', 'valid-move');
        });
    }

    function highlightSelected(w, z, y, x) {
        clearHighlights();
        const { row, col } = get9x9From4D(w, z, y, x);
        const cell = document.querySelector(`.game-cell[data-row='${row}'][data-col='${col}']`);
        if (cell) cell.classList.add('selected');
    }
    
    function highlightValidMoves(fromW, fromZ, fromY, fromX) {
        for (let w = 0; w < boardSize; w++) {
            for (let z = 0; z < boardSize; z++) {
                for (let y = 0; y < boardSize; y++) {
                    for (let x = 0; x < boardSize; x++) {
                        if (isValidMove(fromW, fromZ, fromY, fromX, w, z, y, x)) {
                            const { row, col } = get9x9From4D(w, z, y, x);
                            const cell = document.querySelector(`.game-cell[data-row='${row}'][data-col='${col}']`);
                            if (cell) cell.classList.add('valid-move');
                        }
                    }
                }
            }
        }
    }

    // 駒の移動ルール（4次元移動と9x9移動の両方を統合サポート）
    function isValidMove(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const piece = board[fromW][fromZ][fromY][fromX];
        if (!piece) return false;

        const targetPiece = board[toW][toZ][toY][toX];
        if (targetPiece && targetPiece.owner === currentPlayer) {
            return false; // 自分の駒がいる場所へは移動できない
        }

        const dw = toW - fromW;
        const dz = toZ - fromZ;
        const dy = toY - fromY;
        const dx = toX - fromX;

        if (dw === 0 && dz === 0 && dy === 0 && dx === 0) {
            return false; // 同じ場所への移動は無効
        }

        // 統合された移動ルール：4次元移動も9x9移動も両方可能
        return isValidUnifiedMove(piece, fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);
    }

    // 統合移動ルール（4次元移動と9x9移動を同時にサポート）
    function isValidUnifiedMove(piece, fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const dw = toW - fromW;
        const dz = toZ - fromZ;
        const dy = toY - fromY;
        const dx = toX - fromX;

        const adw = Math.abs(dw);
        const adz = Math.abs(dz);
        const ady = Math.abs(dy);
        const adx = Math.abs(dx);

        // 9x9座標での移動も計算
        const { row: fromRow, col: fromCol } = get9x9From4D(fromW, fromZ, fromY, fromX);
        const { row: toRow, col: toCol } = get9x9From4D(toW, toZ, toY, toX);
        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;
        const absRow = Math.abs(deltaRow);
        const absCol = Math.abs(deltaCol);

        const p_dir = currentPlayer === 1 ? 1 : -1;
        const forward = currentPlayer === 1 ? 1 : -1;

        switch (piece.name) {
            case '歩':
                // 9x9での前進 OR 4次元での次元移動（前進のみ）
                return (deltaRow === forward && deltaCol === 0) || 
                       (fromY === toY && fromX === toX && adw + adz === 1 && 
                        ((dw > 0 && currentPlayer === 1) || (dw < 0 && currentPlayer === 2) || dz !== 0));

            case '香':
                // 9x9での前方直線 OR 4次元での次元直線（前進のみ）
                return (deltaCol === 0 && deltaRow * forward > 0 && is9x9PathClear(fromRow, fromCol, toRow, toCol)) ||
                       (fromY === toY && fromX === toX && 
                        [adw, adz].filter(v => v > 0).length === 1 &&
                        ((dw > 0 && currentPlayer === 1) || (dw < 0 && currentPlayer === 2) || (dw === 0 && dz !== 0)) &&
                        is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX));

            case '桂':
                // 9x9での桂馬飛び OR 4次元でのL字移動
                return (deltaRow === 2 * forward && absCol === 1) ||
                       (fromY === toY && fromX === toX && 
                        ((adw === 2 && adz === 1) || (adw === 1 && adz === 2)));

            case '銀':
                // 9x9での銀の動き OR 4次元での斜め移動
                return ((absRow === 1 && absCol === 1) || (deltaRow === forward && deltaCol === 0)) ||
                       (fromY === toY && fromX === toX && 
                        [[0, p_dir], [1, p_dir], [-1, p_dir], [1, -p_dir], [-1, -p_dir]].some(m => m[0] === dz && m[1] === dw));

            case '金':
            case '成':
            case '圭':
            case '杏':
            case 'と':
                // 金と同じ動き
                return ((deltaRow === forward && absCol <= 1) || 
                        (deltaRow === 0 && absCol === 1) || 
                        (deltaRow === -forward && deltaCol === 0)) ||
                       (fromY === toY && fromX === toX && 
                        [[0, p_dir], [1, 0], [-1, 0], [0, -p_dir], [1, p_dir], [-1, p_dir]].some(m => m[0] === dz && m[1] === dw));

            case '角':
                // 9x9での斜め直線 OR 4次元での次元斜め直線
                return (absRow === absCol && absRow > 0 && is9x9PathClear(fromRow, fromCol, toRow, toCol)) ||
                       (fromY === toY && fromX === toX && adw === adz && adw > 0 &&
                        is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX));

            case '馬':
                // 角の動き + 王の動き
                const bishopMove = (absRow === absCol && absRow > 0 && is9x9PathClear(fromRow, fromCol, toRow, toCol)) ||
                                   (fromY === toY && fromX === toX && adw === adz && adw > 0 &&
                                    is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX));
                const kingMove = (absRow <= 1 && absCol <= 1 && (absRow > 0 || absCol > 0)) ||
                                 (fromY === toY && fromX === toX && adw <= 1 && adz <= 1 && (adw > 0 || adz > 0));
                return bishopMove || kingMove;

            case '飛':
                // 9x9での直線移動 OR 4次元での次元直線移動
                return ((deltaRow === 0 || deltaCol === 0) && (deltaRow !== 0 || deltaCol !== 0) &&
                        is9x9PathClear(fromRow, fromCol, toRow, toCol)) ||
                       (fromY === toY && fromX === toX && 
                        ((adw > 0 && adz === 0) || (adw === 0 && adz > 0)) &&
                        is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX));

            case '龍':
                // 飛車の動き + 王の動き
                const rookMove = ((deltaRow === 0 || deltaCol === 0) && (deltaRow !== 0 || deltaCol !== 0) &&
                                 is9x9PathClear(fromRow, fromCol, toRow, toCol)) ||
                                (fromY === toY && fromX === toX && 
                                 ((adw > 0 && adz === 0) || (adw === 0 && adz > 0)) &&
                                 is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX));
                const kingMove2 = (absRow <= 1 && absCol <= 1 && (absRow > 0 || absCol > 0)) ||
                                  (fromY === toY && fromX === toX && adw <= 1 && adz <= 1 && (adw > 0 || adz > 0));
                return rookMove || kingMove2;

            case '王':
            case '玉':
                // 9x9での8方向1マス OR 4次元での次元1マス移動
                return (absRow <= 1 && absCol <= 1 && (absRow > 0 || absCol > 0)) ||
                       (fromY === toY && fromX === toX && adw <= 1 && adz <= 1 && (adw > 0 || adz > 0));

            default:
                return false;
        }
    }

    // 4次元での経路クリアチェック
    function is4DPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const stepW = Math.sign(toW - fromW);
        const stepZ = Math.sign(toZ - fromZ);

        let w = fromW + stepW;
        let z = fromZ + stepZ;

        while (w !== toW || z !== toZ) {
            if (board[w][z][fromY][fromX]) {
                return false;
            }
            w += stepW;
            z += stepZ;
        }
        return true;
    }

    // 9x9盤面での経路クリアチェック
    function is9x9PathClear(fromRow, fromCol, toRow, toCol) {
        const stepRow = Math.sign(toRow - fromRow);
        const stepCol = Math.sign(toCol - fromCol);

        let row = fromRow + stepRow;
        let col = fromCol + stepCol;

        while (row !== toRow || col !== toCol) {
            const { w, z, y, x } = get4DFrom9x9(row, col);
            if (board[w][z][y][x]) {
                return false; // 経路がブロックされている
            }
            row += stepRow;
            col += stepCol;
        }
        return true; // 経路はクリア
    }

    // 経路に駒がないかチェックするヘルパー関数
    function isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const stepW = Math.sign(toW - fromW);
        const stepZ = Math.sign(toZ - fromZ);
        const stepY = Math.sign(toY - fromY);
        const stepX = Math.sign(toX - fromX);

        let w = fromW + stepW;
        let z = fromZ + stepZ;
        let y = fromY + stepY;
        let x = fromX + stepX;

        while (w !== toW || z !== toZ || y !== toY || x !== toX) {
            if (board[w][z][y][x]) {
                return false; // 経路がブロックされている
            }
            w += stepW;
            z += stepZ;
            y += stepY;
            x += stepX;
        }
        return true; // 経路はクリア
    }

    initializeGame();
});