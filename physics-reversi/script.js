// Matter.js エンジンとモジュール
const { Engine, Render, Runner, World, Bodies, Body, Events, Vector, Constraint } = Matter;

// ゲーム状態
let engine, render, runner, world;
let gameBoard = [];
let currentPlayer = 0; // 0: 黒, 1: 白
let gameOver = false;
let isStable = true;
let settleStartTime = 0;
let fallingPieces = 0;
let turnInProgress = false; // ターン処理中フラグ
let lastDroppedPiece = null; // 最後に落としたコマ
let judgmentStartTime = null; // 判定開始時間

// ゲーム設定
const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;
const PIECE_RADIUS = 50;
const COLUMNS = 8;
const GROUND_HEIGHT = 60;
const WALL_WIDTH = 60;
const DROP_HEIGHT = 50;
const SETTLE_TIME = 3000; // 3秒間安定で判定


// プレイヤー設定
const PLAYERS = [
    { name: '黒プレイヤー', color: '#2c3e50', className: 'black' },
    { name: '白プレイヤー', color: '#ecf0f1', className: 'white' }
];

// DOM要素
const canvas = document.getElementById('physics-canvas');
const currentPiece = document.getElementById('current-piece');
const currentPlayerName = document.getElementById('current-player-name');
const blackScore = document.getElementById('black-score');
const whiteScore = document.getElementById('white-score');
const statusMessage = document.getElementById('status-message');
const settleTimeDisplay = document.getElementById('settle-time');
const fallingPiecesDisplay = document.getElementById('falling-pieces');
const dropSlots = document.querySelectorAll('.drop-slot');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const gameOverModal = document.getElementById('game-over-modal');
const newGameBtn = document.getElementById('new-game-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const finalResult = document.getElementById('final-result');
const finalScores = document.getElementById('final-scores');

// 物理エンジンの初期化
function initPhysics() {
    // エンジン作成
    engine = Engine.create();
    world = engine.world;
    
    // 重力設定（弱くして安定性向上）
    engine.world.gravity.y = 0.4;
    
    // レンダラー作成
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            wireframes: false,
            background: 'transparent',
            showAngleIndicator: false,
            showVelocity: false
        }
    });
    
    // 境界壁を作成
    createBoundaries();
    
    // 初期コマを配置
    createInitialPieces();
    
    // レンダラー開始
    Render.run(render);
    
    // エンジン開始
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // 衝突イベント
    Events.on(engine, 'afterUpdate', handlePhysicsUpdate);
}

// 境界壁作成
function createBoundaries() {
    // 地面
    const ground = Bodies.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT - GROUND_HEIGHT / 2, BOARD_WIDTH, GROUND_HEIGHT, {
        isStatic: true,
        render: { fillStyle: '#8b4513' }
    });
    
    // 左壁
    const leftWall = Bodies.rectangle(WALL_WIDTH / 2, BOARD_HEIGHT / 2, WALL_WIDTH, BOARD_HEIGHT, {
        isStatic: true,
        render: { fillStyle: '#654321' }
    });
    
    // 右壁
    const rightWall = Bodies.rectangle(BOARD_WIDTH - WALL_WIDTH / 2, BOARD_HEIGHT / 2, WALL_WIDTH, BOARD_HEIGHT, {
        isStatic: true,
        render: { fillStyle: '#654321' }
    });
    
    World.add(world, [ground, leftWall, rightWall]);
}

// 初期コマ配置
function createInitialPieces() {
    gameBoard = [];
    
    // 中央に初期コマを配置
    const centerX = BOARD_WIDTH / 2;
    const baseY = BOARD_HEIGHT - GROUND_HEIGHT - PIECE_RADIUS - 10;
    
    // 黒コマ（左上、右下）
    const blackPiece1 = createPiece(centerX - PIECE_RADIUS, baseY - PIECE_RADIUS * 2, 0);
    const blackPiece2 = createPiece(centerX + PIECE_RADIUS, baseY, 0);
    
    // 白コマ（右上、左下）
    const whitePiece1 = createPiece(centerX + PIECE_RADIUS, baseY - PIECE_RADIUS * 2, 1);
    const whitePiece2 = createPiece(centerX - PIECE_RADIUS, baseY, 1);
    
    gameBoard.push(blackPiece1, blackPiece2, whitePiece1, whitePiece2);
}

// コマ作成
function createPiece(x, y, player) {
    const piece = Bodies.circle(x, y, PIECE_RADIUS, {
        restitution: 0.6, // 弾性（固定値）
        friction: 0.1,
        density: 1.0, // 落下中は重い
        render: {
            fillStyle: PLAYERS[player].color,
            strokeStyle: player === 0 ? '#fff' : '#000',
            lineWidth: 2
        }
    });
    
    // プレイヤー情報を追加
    piece.player = player;
    piece.isSettled = false;
    piece.lastPosition = { x: x, y: y };
    piece.isGamePiece = true; // ゲームコマであることを明示
    
    World.add(world, piece);
    return piece;
}

// 物理更新処理
function handlePhysicsUpdate() {
    // 落下中のコマをカウント
    fallingPieces = 0;
    let hasMovingPieces = false;
    
    gameBoard.forEach(piece => {
        if (!piece.body) return;
        
        const velocity = Math.abs(piece.body.velocity.x) + Math.abs(piece.body.velocity.y);
        const positionDelta = Math.abs(piece.body.position.x - piece.lastPosition.x) + 
                             Math.abs(piece.body.position.y - piece.lastPosition.y);
        
        // より厳しい判定条件（速度0.05以下、位置変化0.1以下）
        if (velocity > 0.05 || positionDelta > 0.1) {
            hasMovingPieces = true;
            fallingPieces++;
            piece.isSettled = false;
        } else {
            piece.isSettled = true;
        }
        
        piece.lastPosition = { x: piece.body.position.x, y: piece.body.position.y };
    });
    
    // 安定性チェック（ターン処理中のみ）
    if (turnInProgress) {
        if (hasMovingPieces && isStable) {
            isStable = false;
            settleStartTime = Date.now();
            statusMessage.textContent = 'コマが動いています...';
        }
        // 安定性の判定はcheckWhenStoppedに任せる
    }
    
    // UI更新
    const settleTime = isStable ? 0 : (Date.now() - settleStartTime) / 1000;
    settleTimeDisplay.textContent = settleTime.toFixed(1);
    fallingPiecesDisplay.textContent = fallingPieces;
}

// ドロップスロットクリック
// X座標を指定してコマを落とす（無段階）
function handleDropAtPosition(x) {
    if (gameOver || turnInProgress) return;
    
    // 画面端から少し離れた位置に制限
    const minX = WALL_WIDTH + PIECE_RADIUS;
    const maxX = BOARD_WIDTH - WALL_WIDTH - PIECE_RADIUS;
    const dropX = Math.max(minX, Math.min(maxX, x));
    
    turnInProgress = true;
    isStable = false;
    settleStartTime = Date.now();
    
    const piece = createPiece(dropX, DROP_HEIGHT, currentPlayer);
    
    
    lastDroppedPiece = piece;
    gameBoard.push(piece);
    World.add(world, piece);
    
    statusMessage.textContent = `${PLAYERS[currentPlayer].name}のコマが落下中...`;
    updateUI();
    updateScore();
    
    checkWhenStopped();
}

function handleDrop(column) {
    if (turnInProgress || gameOver || !isStable) return;
    
    // ターン処理開始
    turnInProgress = true;
    isStable = false;
    
    const x = WALL_WIDTH + (column * (BOARD_WIDTH - 2 * WALL_WIDTH) / COLUMNS) + 
              ((BOARD_WIDTH - 2 * WALL_WIDTH) / COLUMNS) / 2;
    const y = DROP_HEIGHT;
    
    const newPiece = createPiece(x, y, currentPlayer);
    gameBoard.push(newPiece);
    lastDroppedPiece = { body: newPiece }; // オブジェクト形式で設定
    
    statusMessage.textContent = `${PLAYERS[currentPlayer].name}のコマが落下中...`;
    
    checkWhenStopped();
}

// コマ停止判定とフリップ処理
function checkWhenStopped() {
    setTimeout(() => {
        const allPieces = world.bodies.filter(body => body.isGamePiece);
        const lastPiece = allPieces[allPieces.length - 1];
        
        if (!lastPiece) return;
        
        const velocity = Math.abs(lastPiece.velocity.x) + Math.abs(lastPiece.velocity.y);
        
        // 安定時間チェック（3秒経ったら強制判定）
        const stableTime = Date.now() - settleStartTime;
        const isStableTimeout = stableTime >= 3000;
        
        if (velocity <= 0.5 || isStableTimeout) {
            if (isStableTimeout) {
                console.log('⏰ 安定時間タイムアウト - 強制判定実行');
                // コマを強制停止
                Body.setVelocity(lastPiece, { x: 0, y: 0 });
            }
            // 初回のみ判定開始時間を設定
            if (!judgmentStartTime) {
                judgmentStartTime = Date.now();
                statusMessage.textContent = 'コマが安定しました。判定中...';
                console.log('=== コマ停止後の判定実行 ===');
                console.log(`停止したコマ: プレイヤー${lastPiece.player}, 位置(${lastPiece.position.x.toFixed(1)}, ${lastPiece.position.y.toFixed(1)}), 速度${velocity.toFixed(3)}`);
                
                // 判定開始時に全ての既存コマを軽くする
                allPieces.forEach(piece => {
                    Body.set(piece, 'density', 0.1);
                    Body.setMass(piece, piece.area * 0.1);
                });
                console.log('全コマを軽量化しました');
            }
            
            // 判定時間チェック（3秒でタイムアウト）
            const judgmentTime = Date.now() - judgmentStartTime;
            if (judgmentTime > 3000) {
                console.log('⏰ 判定タイムアウト - 判定不能で次のターンへ');
                judgmentStartTime = null; // リセット
                finishTurn([]); // フリップなしで次のターンへ
                return;
            }
            
            // 最初の隣接コマ取得（落としたコマから半径130）
            const INITIAL_SEARCH_RADIUS = 150;
            const nearbyPieces = allPieces.filter(piece => {
                if (piece === lastPiece) return false;
                
                const distance = Math.sqrt(
                    Math.pow(piece.position.x - lastPiece.position.x, 2) + 
                    Math.pow(piece.position.y - lastPiece.position.y, 2)
                );
                
                return distance <= INITIAL_SEARCH_RADIUS;
            });
            
            console.log(`周囲のコマ数: ${nearbyPieces.length}`);
            
            // 各コマから直線判定
            let allFlips = [];
            nearbyPieces.forEach((startPiece, index) => {
                console.log(`\n--- 探索${index + 1} ---`);
                const lineFlips = debugLineSearch(lastPiece, startPiece, allPieces);
                allFlips.push(...lineFlips);
            });
            
            // 重複削除
            const uniqueFlips = [...new Set(allFlips)];
            console.log(`\n💫 総フリップ数: ${uniqueFlips.length}`);
            
            // フリップ対象を特定（実際のフリップはfinishTurnで実行）
            if (uniqueFlips.length > 0) {
                console.log('🔄 フリップ対象特定完了');
                uniqueFlips.forEach(piece => {
                    console.log(`   ${piece.player === 0 ? '黒→白' : '白→黒'} 予定`);
                });
                console.log('🎉 フリップ対象確定！');
            } else {
                console.log('😐 フリップなし');
            }
            
            // 実際のゲーム判定も実行
            setTimeout(() => {
                judgmentStartTime = null; // 判定完了時にリセット
                if (uniqueFlips.length > 0) {
                    finishTurn(uniqueFlips);
                } else {
                    finishTurn([]);
                }
            }, 1000);
            console.log('===========================');
        } else {
            // まだ動いている場合は再チェック
            checkWhenStopped();
        }
    }, 500); // 0.5秒ごとにチェック
}

// 直線チェックとフリップ（停止後に実行される）
function checkForFlips() {
    // この関数は現在使われていない（停止検知機能が代替）
    // 停止後の判定はhandleDrop内のcheckWhenStopped()で実行
    finishTurn([]);
}

// ターン終了処理
function finishTurn(flippedPieces) {
    // フリップ実行
    if (flippedPieces.length > 0) {
        flippedPieces.forEach(piece => {
            flipPieceBody(piece);
        });
        statusMessage.textContent = `${flippedPieces.length}個のコマをひっくり返しました！`;
    } else {
        statusMessage.textContent = 'ひっくり返せるコマはありませんでした';
    }
    
    updateScore();
    
    // ゲーム終了チェック（判定後さらに2秒待機）
    setTimeout(() => {
        if (checkGameEnd()) {
            endGame();
        } else {
            nextTurn();
            // ターン処理終了
            turnInProgress = false;
            isStable = true;
        }
    }, 2000);
}

// シンプル直線探索
function debugLineSearch(droppedPiece, startPiece, allPieces) {
    const flips = [];
    const NEXT_PIECE_RADIUS = 180;
    const ANGLE_TOLERANCE = 15;
    
    // 基準方向計算
    const droppedPos = droppedPiece.position;
    const startPos = startPiece.position;
    const baseDirection = {
        x: startPos.x - droppedPos.x,
        y: startPos.y - droppedPos.y
    };
    const baseLength = Math.sqrt(baseDirection.x * baseDirection.x + baseDirection.y * baseDirection.y);
    if (baseLength === 0) return [];
    
    baseDirection.x /= baseLength;
    baseDirection.y /= baseLength;
    
    // 色名変換
    const getColorName = (player) => player === 0 ? '黒' : '白';
    
    let currentPiece = startPiece;
    let currentPos = startPos;
    let pathColors = [getColorName(droppedPiece.player), getColorName(startPiece.player)];
    
    // startPieceが同色の場合は即座に終了（フリップなし）
    if (startPiece.player === droppedPiece.player) {
        console.log(`🔍 直線探索開始: ${pathColors.join('→')}`);
        console.log(`❌ 最初から同色なのでフリップなし`);
        return [];
    }
    
    // startPieceは異色なのでフリップ対象
    flips.push(startPiece);
    
    console.log(`🔍 直線探索開始: ${pathColors.join('→')}`);
    
    // 直線上のコマを探索
    for (let step = 1; step <= 10; step++) {
        // 角度条件を満たす候補を探す
        const candidates = allPieces.filter(piece => {
            if (piece === currentPiece) return false;
            
            const distance = Math.sqrt(
                Math.pow(piece.position.x - currentPos.x, 2) + 
                Math.pow(piece.position.y - currentPos.y, 2)
            );
            if (distance > NEXT_PIECE_RADIUS) return false;
            
            const direction = {
                x: piece.position.x - currentPos.x,
                y: piece.position.y - currentPos.y
            };
            const dirLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            if (dirLength === 0) return false;
            
            direction.x /= dirLength;
            direction.y /= dirLength;
            
            const dotProduct = baseDirection.x * direction.x + baseDirection.y * direction.y;
            const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct))) * 180 / Math.PI;
            
            return angle <= ANGLE_TOLERANCE;
        });
        
        if (candidates.length === 0) break;
        
        // 最も近いコマを選択
        const nextPiece = candidates.reduce((closest, piece) => {
            const closestDist = Math.sqrt(
                Math.pow(closest.position.x - currentPos.x, 2) + 
                Math.pow(closest.position.y - currentPos.y, 2)
            );
            const pieceDist = Math.sqrt(
                Math.pow(piece.position.x - currentPos.x, 2) + 
                Math.pow(piece.position.y - currentPos.y, 2)
            );
            return pieceDist < closestDist ? piece : closest;
        });
        
        pathColors.push(getColorName(nextPiece.player));
        console.log(`   ${pathColors.join('→')}`);
        
        if (nextPiece.player === droppedPiece.player) {
            console.log(`✅ パターン完成！フリップ実行: ${flips.length}個`);
            console.log(`   フリップ対象: ${flips.map(f => getColorName(f.player)).join(', ')}`);
            return flips;
        } else {
            flips.push(nextPiece);
            console.log(`   → フリップ候補追加: ${getColorName(nextPiece.player)}コマ (計${flips.length}個)`);
        }
        
        currentPiece = nextPiece;
        currentPos = nextPiece.position;
    }
    
    console.log(`❌ 同色到達なし`);
    return [];
}

// 直線判定（物理ボディベース、半径130px、±15度）
function checkDirectLineFlips(droppedPiece, startPiece, allPieces) {
    return debugLineSearch(droppedPiece, startPiece, allPieces);
}

// 近くのコマを探す
function findNearbyPiece(x, y, tolerance) {
    return gameBoard.find(piece => {
        if (!piece.body) return false;
        const distance = Math.sqrt(
            Math.pow(piece.body.position.x - x, 2) + 
            Math.pow(piece.body.position.y - y, 2)
        );
        return distance <= tolerance;
    });
}

// コマをひっくり返す（物理ボディベース）
function flipPieceBody(body) {
    body.player = 1 - body.player;
    body.render.fillStyle = PLAYERS[body.player].color;
    body.render.strokeStyle = body.player === 0 ? '#fff' : '#000';
    
    // ひっくり返しアニメーション
    const originalScale = body.render.scale || 1;
    body.render.scale = 0.5;
    
    setTimeout(() => {
        body.render.scale = originalScale;
    }, 200);
}

// ターン交代
function nextTurn() {
    currentPlayer = 1 - currentPlayer;
    updateUI();
    statusMessage.textContent = `${PLAYERS[currentPlayer].name}のターンです`;
}

// UI更新
function updateUI() {
    currentPiece.className = `player-piece ${PLAYERS[currentPlayer].className}`;
    currentPlayerName.textContent = PLAYERS[currentPlayer].name;
}

// スコア更新（停止したコマのみカウント）
function updateScore() {
    const scores = [0, 0];
    
    // gameBoard配列から停止したコマをカウント
    gameBoard.forEach(piece => {
        if (piece && piece.player !== undefined) {
            scores[piece.player]++;
        }
    });
    
    blackScore.textContent = scores[0];
    whiteScore.textContent = scores[1];
}

// ゲーム終了チェック
function checkGameEnd() {
    // 停止したコマが44個になったら終了
    const validPieces = gameBoard.filter(piece => piece && piece.player !== undefined);
    return validPieces.length >= 44;
}

// ゲーム終了
function endGame() {
    gameOver = true;
    const scores = [0, 0];
    
    // gameBoard配列から停止したコマをカウント
    gameBoard.forEach(piece => {
        if (piece && piece.player !== undefined) {
            scores[piece.player]++;
        }
    });
    
    const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
    
    if (winner === -1) {
        finalResult.textContent = '引き分け！';
    } else {
        finalResult.textContent = `${PLAYERS[winner].name}の勝利！`;
    }
    
    finalScores.innerHTML = `
        <div class="final-score-item">
            <div class="piece black"></div>
            <span>黒: ${scores[0]}</span>
        </div>
        <div class="final-score-item">
            <div class="piece white"></div>
            <span>白: ${scores[1]}</span>
        </div>
    `;
    
    gameOverModal.classList.add('show');
}

// ゲームリセット
function resetGame() {
    // 物理エンジンを完全にリセット
    if (engine) {
        Engine.clear(engine);
        Render.stop(render);
        Runner.stop(runner);
    }
    
    // 変数をリセット
    gameBoard = [];
    currentPlayer = 0;
    gameOver = false;
    isStable = true;
    settleStartTime = 0;
    fallingPieces = 0;
    turnInProgress = false;
    lastDroppedPiece = null;
    
    // 物理エンジンを再初期化
    initPhysics();
    updateUI();
    updateScore();
    
    statusMessage.textContent = '上のスロットをクリックしてコマを落としてください';
    gameOverModal.classList.remove('show');
}

// イベントリスナー - drop-zone全体をクリック可能に
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('click', (e) => {
    const rect = dropZone.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const dropX = (clickX / rect.width) * BOARD_WIDTH;
    handleDropAtPosition(dropX);
});

resetBtn.addEventListener('click', resetGame);
backBtn.addEventListener('click', () => window.location.href = '../index.html');
newGameBtn.addEventListener('click', resetGame);
closeModalBtn.addEventListener('click', () => gameOverModal.classList.remove('show'));



// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initPhysics();
    updateUI();
    updateScore();
});