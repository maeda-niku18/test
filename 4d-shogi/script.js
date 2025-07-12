document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 3; // 3x3x3x3 のボード
    const boardElement = document.getElementById('game-board');
    const turnInfoElement = document.getElementById('turn-info');
    const player1CapturedElement = document.querySelector('#player1-captured .pieces');
    const player2CapturedElement = document.querySelector('#player2-captured .pieces');

    let board = []; // w, z, y, x の4次元配列
    let currentPlayer = 1;
    let selectedPiece = null; // {w, z, y, x, piece}
    let capturedPieces = { 1: [], 2: [] };

    // 駒の定義に「王」を追加
    const pieces = {
        '玉': { name: '玉' }, '王': { name: '王' }, '金': { name: '金' }, '銀': { name: '銀' },
        '桂': { name: '桂' }, '香': { name: '香' }, '歩': { name: '歩' },
        '角': { name: '角' }, '飛': { name: '飛' },
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

    // 新しい初期配置ルール
    function placeInitialPieces() {
        // Player 1 (w=0)
        const p1_layout = {
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
                ['香', '桂', '銀'],
                ['', '角', ''],
                ['歩', '歩', '歩']
            ]
        };

        for (let z = 0; z < boardSize; z++) {
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    const pieceName = p1_layout[z][y][x];
                    if (pieceName) {
                        board[0][z][y][x] = { ...pieces[pieceName], owner: 1 };
                    }
                }
            }
        }

        // Player 2 (w=2)
        const p2_layout = {
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
                ['香', '桂', '銀']
            ]
        };

        for (let z = 0; z < boardSize; z++) {
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    const pieceName = p2_layout[z][y][x];
                    if (pieceName) {
                        board[2][z][y][x] = { ...pieces[pieceName], owner: 2 };
                    }
                }
            }
        }
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let w = 0; w < boardSize; w++) {
            const wLevelContainer = document.createElement('div');
            wLevelContainer.className = 'w-level';
            const wTitle = document.createElement('h2');
            wTitle.className = 'w-level-title';
            wTitle.textContent = `次元 ${w + 1}`;
            wLevelContainer.appendChild(wTitle);

            const wLevelContent = document.createElement('div');
            wLevelContent.className = 'w-level-content';

            for (let z = 0; z < boardSize; z++) {
                const zLevelContainer = document.createElement('div');
                zLevelContainer.className = 'z-level';
                const zTitle = document.createElement('h3');
                zTitle.className = 'z-level-title';
                zTitle.textContent = `Z = ${z}`;
                zLevelContainer.appendChild(zTitle);

                const yGridsContainer = document.createElement('div');
                yGridsContainer.className = 'y-grids-container'; // New container for y-grids

                for (let y = 0; y < boardSize; y++) {
                    const grid = document.createElement('div');
                    grid.className = 'board-grid';

                    for (let x = 0; x < boardSize; x++) {
                        const cell = document.createElement('div');
                        cell.className = 'cell';
                        cell.dataset.w = w;
                        cell.dataset.z = z;
                        cell.dataset.y = y;
                        cell.dataset.x = x;

                        const pieceData = board[w][z][y][x];
                        if (pieceData) {
                            const pieceElement = document.createElement('div');
                            pieceElement.className = `piece player${pieceData.owner}`;
                            const pieceNameElement = document.createElement('span');
                            pieceNameElement.className = 'piece-name';
                            pieceNameElement.textContent = pieceData.name;
                            pieceElement.appendChild(pieceNameElement);
                            cell.appendChild(pieceElement);
                        }
                        
                        cell.addEventListener('click', () => handleCellClick(w, z, y, x));
                        grid.appendChild(cell);
                    }
                    yGridsContainer.appendChild(grid);
                }
                zLevelContainer.appendChild(yGridsContainer);
                wLevelContent.appendChild(zLevelContainer);
            }
            wLevelContainer.appendChild(wLevelContent);
            boardElement.appendChild(wLevelContainer);
        }
    }

    function handleCellClick(w, z, y, x) {
        if (selectedPiece) {
            if (isValidMove(selectedPiece.w, selectedPiece.z, selectedPiece.y, selectedPiece.x, w, z, y, x)) {
                movePiece(selectedPiece.w, selectedPiece.z, selectedPiece.y, selectedPiece.x, w, z, y, x);
                selectedPiece = null;
                switchTurn();
                clearHighlights();
            } else {
                selectedPiece = null;
                clearHighlights();
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
    
    function movePiece(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        const pieceToMove = board[fromW][fromZ][fromY][fromX];
        const targetPiece = board[toW][toZ][toY][toX];

        if (targetPiece) {
            const captured = { ...targetPiece, owner: currentPlayer };
            capturedPieces[currentPlayer].push(captured);
        }

        board[toW][toZ][toY][toX] = pieceToMove;
        board[fromW][fromZ][fromY][fromX] = null;

        renderAll();
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
        capturedPieces[1].forEach(p => {
            const pieceEl = document.createElement('div');
            pieceEl.className = `piece player${p.owner}`;
            pieceEl.textContent = p.name;
            player1CapturedElement.appendChild(pieceEl);
        });

        player2CapturedElement.innerHTML = '';
        capturedPieces[2].forEach(p => {
            const pieceEl = document.createElement('div');
            pieceEl.className = `piece player${p.owner}`;
            pieceEl.textContent = p.name;
            player2CapturedElement.appendChild(pieceEl);
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'valid-move');
        });
    }

    function highlightSelected(w, z, y, x) {
        clearHighlights();
        const cell = document.querySelector(`.cell[data-w='${w}'][data-z='${z}'][data-y='${y}'][data-x='${x}']`);
        if (cell) cell.classList.add('selected');
    }
    
    function highlightValidMoves(fromW, fromZ, fromY, fromX) {
        for (let w = 0; w < boardSize; w++) {
            for (let z = 0; z < boardSize; z++) {
                for (let y = 0; y < boardSize; y++) {
                    for (let x = 0; x < boardSize; x++) {
                        if (isValidMove(fromW, fromZ, fromY, fromX, w, z, y, x)) {
                            const cell = document.querySelector(`.cell[data-w='${w}'][data-z='${z}'][data-y='${y}'][data-x='${x}']`);
                            if (cell) cell.classList.add('valid-move');
                        }
                    }
                }
            }
        }
    }

    // 駒の移動ルール
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

        const adw = Math.abs(dw);
        const adz = Math.abs(dz);
        const ady = Math.abs(dy);
        const adx = Math.abs(dx);

        if (adw === 0 && adz === 0 && ady === 0 && adx === 0) {
            return false; // 同じ場所への移動は無効
        }

        const p_dir = currentPlayer === 1 ? 1 : -1; // プレイヤーの前方方向

        switch (piece.name) {
            case '歩':
                // 二次元(y,x)または三次元(w)に対して正または負の方向に1マスのみ
                if (dz !== 0) return false; // z軸方向の移動は不可
                const adw_plus_ady_plus_adx = adw + ady + adx;
                if (adw_plus_ady_plus_adx !== 1) return false;
                // プレイヤーによる方向制限
                if (dw * p_dir < 0 || dy * p_dir < 0) return false;
                return true;

            case '香':
                // 二次元(y,x)または三次元(w)に対して直線で何マスでも
                if (dz !== 0) return false; // z軸方向の移動は不可
                const moveAxisCount = [adw, ady, adx].filter(v => v > 0).length;
                if (moveAxisCount !== 1) return false; // 1つの軸のみ
                // プレイヤーによる方向制限
                if (dw * p_dir < 0 || dy * p_dir < 0) return false;
                return isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);

            case '桂':
                // 次元方向に対して二次元+四次元や三次元+二次元といったトリッキーな移動
                // (w, z) の移動と (y, x) の移動の組み合わせと解釈
                const dimMove = (adw === 2 && adz === 1) || (adw === 1 && adz === 2);
                const planeMove = (ady === 2 && adx === 1) || (ady === 1 && adx === 2);
                if (!dimMove && !planeMove) return false;
                if (dimMove && (ady !== 0 || adx !== 0)) return false; // 次元移動中は平面移動不可
                if (planeMove && (adw !== 0 || adz !== 0)) return false; // 平面移動中は次元移動不可
                return true;

            case '銀':
                // 各次元を1マスとしてみたときに銀の動き or 二次元空間でも銀の動き
                if (fromY === toY && fromX === toX) { // 次元移動
                    const validMoves = [[0, 1*p_dir], [1, 1*p_dir], [-1, 1*p_dir], [1, -1*p_dir], [-1, -1*p_dir]];
                    return validMoves.some(m => m[0] === dz && m[1] === dw * p_dir);
                } else if (fromW === toW && fromZ === toZ) { // 平面移動
                    const validMoves = [[0, 1*p_dir], [1, 1*p_dir], [-1, 1*p_dir], [1, -1*p_dir], [-1, -1*p_dir]];
                    return validMoves.some(m => m[0] === dx && m[1] === dy * p_dir);
                }
                return false;

            case '金':
                 // 各次元を1マスとしてみたときに金の動き or 二次元空間でも金の動き
                if (fromY === toY && fromX === toX) { // 次元移動
                    const validMoves = [[0, 1*p_dir], [1, 0], [-1, 0], [0, -1], [1, 1*p_dir], [-1, 1*p_dir]];
                    return validMoves.some(m => m[0] === dz && m[1] === dw * p_dir);
                } else if (fromW === toW && fromZ === toZ) { // 平面移動
                    const validMoves = [[0, 1*p_dir], [1, 0], [-1, 0], [0, -1], [1, 1*p_dir], [-1, 1*p_dir]];
                    return validMoves.some(m => m[0] === dx && m[1] === dy * p_dir);
                }
                return false;

            case '角':
                // 各次元を1マスとしてみて角の動き or 二次元空間内でも同様に移動
                if (fromY === toY && fromX === toX) { // 次元移動
                    if (adw === adz && adw > 0) {
                        return isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);
                    }
                } else if (fromW === toW && fromZ === toZ) { // 平面移動
                    if (ady === adx && ady > 0) {
                        return isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);
                    }
                }
                return false;

            case '飛':
                // 各次元を1マスとしてみて飛車の動き or 二次元空間内でも同様に移動
                if (fromY === toY && fromX === toX) { // 次元移動
                    if ((adw > 0 && adz === 0) || (adw === 0 && adz > 0)) {
                        return isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);
                    }
                } else if (fromW === toW && fromZ === toZ) { // 平面移動
                    if ((ady > 0 && adx === 0) || (ady === 0 && adx > 0)) {
                        return isPathClear(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX);
                    }
                }
                return false;

            case '王':
            case '玉':
                // 二次元空間で王の動き or 各次元を1マスとしてみて次元を渡る
                if (fromY === toY && fromX === toX) { // 次元移動
                    return adw <= 1 && adz <= 1;
                } else if (fromW === toW && fromZ === toZ) { // 平面移動
                    return ady <= 1 && adx <= 1;
                }
                return false;

            default:
                return false;
        }
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