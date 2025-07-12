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
            wTitle.textContent = `W = ${w}`;
            wLevelContainer.appendChild(wTitle);

            for (let z = 0; z < boardSize; z++) {
                const zLevelContainer = document.createElement('div');
                zLevelContainer.className = 'z-level';
                const zTitle = document.createElement('h3');
                zTitle.className = 'z-level-title';
                zTitle.textContent = `Z = ${z}`;
                zLevelContainer.appendChild(zTitle);

                const grid = document.createElement('div');
                grid.className = 'board-grid';

                for (let y = 0; y < boardSize; y++) {
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
                            pieceElement.textContent = pieceData.name;
                            cell.appendChild(pieceElement);
                        }
                        
                        cell.addEventListener('click', () => handleCellClick(w, z, y, x));
                        grid.appendChild(cell);
                    }
                }
                zLevelContainer.appendChild(grid);
                wLevelContainer.appendChild(zLevelContainer);
            }
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

    // 駒の移動ルール (ステップ1では無効化)
    function isValidMove(fromW, fromZ, fromY, fromX, toW, toZ, toY, toX) {
        // ステップ1では配置のみを実装するため、駒はまだ動かせません。
        // 次のステップで駒の動きを実装します。
        return false;
    }

    initializeGame();
});