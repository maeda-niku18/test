// ソリティアプラスゲームクラス
class SolitairePlus {
    constructor() {
        this.deck = [];
        this.foundation = { hearts: [], diamonds: [], clubs: [], spades: [] };
        this.table = [[], [], [], [], [], [], []];
        this.stock = [];
        this.waste = [];
        this.selectedCard = null;
        this.score = 0;
        this.moves = 0;
        this.skillPoints = 3;
        this.gameHistory = [];
        this.startTime = Date.now();
        this.isTimeStopped = false;
        this.timeStopEnd = 0;
        
        this.initializeGame();
        this.bindEvents();
        this.startTimer();
    }

    // ゲーム初期化
    initializeGame() {
        this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.updateDisplay();
        this.updateSkillButtons();
    }

    // デッキ作成
    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        suits.forEach(suit => {
            ranks.forEach(rank => {
                this.deck.push({
                    suit: suit,
                    rank: rank,
                    value: this.getCardValue(rank),
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
                });
            });
        });
    }

    // カードの数値を取得
    getCardValue(rank) {
        const values = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
        };
        return values[rank];
    }

    // デッキをシャッフル
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // カードを配る
    dealCards() {
        // テーブルにカードを配る
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                if (i === j) {
                    card.faceUp = true;
                } else {
                    card.faceUp = false;
                }
                this.table[j].push(card);
            }
        }
        
        // 残りをストックに
        this.stock = this.deck;
        this.deck = [];
    }

    // カードをクリック
    handleCardClick(card, location, index) {
        if (this.selectedCard) {
            // 移動を試行
            if (this.canMoveCard(this.selectedCard.card, location, index)) {
                this.moveCard(this.selectedCard.card, this.selectedCard.location, this.selectedCard.index, location, index);
                this.selectedCard = null;
                this.clearSelection();
            } else {
                // 選択を変更
                this.selectedCard = { card, location, index };
                this.updateSelection();
            }
        } else {
            // カードを選択
            this.selectedCard = { card, location, index };
            this.updateSelection();
        }
        
        this.updateDisplay();
    }

    // カードが移動可能かチェック
    canMoveCard(card, toLocation, toIndex) {
        if (toLocation === 'foundation') {
            return this.canMoveToFoundation(card, toIndex);
        } else if (toLocation === 'table') {
            return this.canMoveToTable(card, toIndex);
        }
        return false;
    }

    // ファウンデーションへの移動チェック
    canMoveToFoundation(card, suitIndex) {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const suit = suits[suitIndex];
        const foundation = this.foundation[suit];
        
        if (card.rank === 'A') {
            return foundation.length === 0;
        } else {
            return foundation.length > 0 && 
                   foundation[foundation.length - 1].value === card.value - 1;
        }
    }

    // テーブルへの移動チェック
    canMoveToTable(card, pileIndex) {
        const pile = this.table[pileIndex];
        
        if (pile.length === 0) {
            return card.rank === 'K';
        } else {
            const topCard = pile[pile.length - 1];
            return topCard.faceUp && 
                   topCard.color !== card.color && 
                   topCard.value === card.value + 1;
        }
    }

    // カードを移動
    moveCard(card, fromLocation, fromIndex, toLocation, toIndex) {
        // 履歴に記録
        this.gameHistory.push({
            card: { ...card },
            fromLocation,
            fromIndex,
            toLocation,
            toIndex,
            timestamp: Date.now()
        });

        // カードを移動
        if (toLocation === 'foundation') {
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const suit = suits[toIndex];
            this.foundation[suit].push(card);
            
            // 元の場所から削除
            this.removeCardFromLocation(card, fromLocation, fromIndex);
            
            this.score += 100;
        } else if (toLocation === 'table') {
            this.table[toIndex].push(card);
            
            // 元の場所から削除
            this.removeCardFromLocation(card, fromLocation, fromIndex);
            
            this.score += 10;
        }
        
        this.moves++;
        this.updateScore();
    }

    // 場所からカードを削除
    removeCardFromLocation(card, location, index) {
        if (location === 'foundation') {
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const suit = suits[index];
            this.foundation[suit].pop();
        } else if (location === 'table') {
            this.table[index].pop();
            // 下のカードを表にする
            if (this.table[index].length > 0) {
                this.table[index][this.table[index].length - 1].faceUp = true;
            }
        } else if (location === 'waste') {
            this.waste.pop();
        }
    }

    // ストックからカードを引く
    drawFromStock() {
        if (this.stock.length === 0) {
            // ウェイストをストックに戻す
            this.stock = [...this.waste].reverse();
            this.waste = [];
            this.stock.forEach(card => card.faceUp = false);
        } else {
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
        }
        
        this.moves++;
        this.updateDisplay();
    }

    // スキル：カード変換
    useTransformSkill() {
        if (this.skillPoints < 1) return;
        
        this.showSkillModal('カード変換', `
            <p>変換したいカードを選択してください：</p>
            <div class="suit-selection">
                <button class="suit-btn" data-suit="hearts">♥ ハート</button>
                <button class="suit-btn" data-suit="diamonds">♦ ダイヤ</button>
                <button class="suit-btn" data-suit="clubs">♣ クラブ</button>
                <button class="suit-btn" data-suit="spades">♠ スペード</button>
            </div>
        `, (selectedSuit) => {
            if (this.selectedCard) {
                this.selectedCard.card.suit = selectedSuit;
                this.selectedCard.card.color = (selectedSuit === 'hearts' || selectedSuit === 'diamonds') ? 'red' : 'black';
                this.skillPoints--;
                this.updateSkillButtons();
                this.updateDisplay();
            }
        });
    }

    // スキル：移動スキル
    useMoveSkill() {
        if (this.skillPoints < 2) return;
        
        if (this.selectedCard) {
            // 一時的に移動可能にする
            this.skillPoints -= 2;
            this.updateSkillButtons();
            
            // 移動可能な場所をハイライト
            this.highlightPossibleMoves();
        }
    }

    // スキル：時間停止
    useTimeStopSkill() {
        if (this.skillPoints < 3) return;
        
        this.skillPoints -= 3;
        this.isTimeStopped = true;
        this.timeStopEnd = Date.now() + 30000; // 30秒間
        this.updateSkillButtons();
        
        // 時間停止エフェクト
        document.body.classList.add('time-stopped');
        setTimeout(() => {
            this.isTimeStopped = false;
            document.body.classList.remove('time-stopped');
        }, 30000);
    }

    // スキル：一手戻す
    useReverseSkill() {
        if (this.skillPoints < 1 || this.gameHistory.length === 0) return;
        
        const lastMove = this.gameHistory.pop();
        this.undoMove(lastMove);
        this.skillPoints--;
        this.updateSkillButtons();
        this.updateDisplay();
    }

    // スキル：シャッフル
    useShuffleSkill() {
        if (this.skillPoints < 2) return;
        
        // 残りのカードをシャッフル
        const remainingCards = [...this.stock, ...this.waste];
        for (let i = remainingCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingCards[i], remainingCards[j]] = [remainingCards[j], remainingCards[i]];
        }
        
        this.stock = remainingCards.slice(0, Math.ceil(remainingCards.length / 2));
        this.waste = remainingCards.slice(Math.ceil(remainingCards.length / 2));
        
        this.skillPoints -= 2;
        this.updateSkillButtons();
        this.updateDisplay();
    }

    // 移動を戻す
    undoMove(move) {
        // カードを元の場所に戻す
        if (move.toLocation === 'foundation') {
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const suit = suits[move.toIndex];
            this.foundation[suit].pop();
        } else if (move.toLocation === 'table') {
            this.table[move.toIndex].pop();
        }
        
        // 元の場所に戻す
        if (move.fromLocation === 'foundation') {
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const suit = suits[move.fromIndex];
            this.foundation[suit].push(move.card);
        } else if (move.fromLocation === 'table') {
            this.table[move.fromIndex].push(move.card);
        }
    }

    // 可能な移動をハイライト
    highlightPossibleMoves() {
        // 実装省略（移動可能な場所を視覚的に表示）
    }

    // スキルモーダルを表示
    showSkillModal(title, content, onConfirm) {
        document.getElementById('skill-modal-title').textContent = title;
        document.getElementById('skill-modal-body').innerHTML = content;
        document.getElementById('skill-modal').classList.remove('hidden');
        
        // イベントリスナーを設定
        document.getElementById('skill-confirm').onclick = () => {
            document.getElementById('skill-modal').classList.add('hidden');
            if (onConfirm) onConfirm();
        };
        
        document.getElementById('skill-cancel').onclick = () => {
            document.getElementById('skill-modal').classList.add('hidden');
        };
    }

    // 選択をクリア
    clearSelection() {
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
    }

    // 選択を更新
    updateSelection() {
        this.clearSelection();
        if (this.selectedCard) {
            // 選択されたカードをハイライト
            const cardElement = this.getCardElement(this.selectedCard.card, this.selectedCard.location, this.selectedCard.index);
            if (cardElement) {
                cardElement.classList.add('selected');
            }
        }
    }

    // カード要素を取得
    getCardElement(card, location, index) {
        // 実装省略（DOMからカード要素を取得）
        return null;
    }

    // 表示を更新
    updateDisplay() {
        this.updateFoundation();
        this.updateTable();
        this.updateStockWaste();
    }

    // ファウンデーションを更新
    updateFoundation() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        suits.forEach((suit, index) => {
            const pile = document.querySelector(`[data-suit="${suit}"] .card-slot`);
            pile.innerHTML = '';
            
            if (this.foundation[suit].length > 0) {
                const topCard = this.foundation[suit][this.foundation[suit].length - 1];
                const cardElement = this.createCardElement(topCard);
                pile.appendChild(cardElement);
            }
        });
    }

    // テーブルを更新
    updateTable() {
        this.table.forEach((pile, index) => {
            const pileElement = document.querySelector(`[data-pile="${index}"]`);
            pileElement.innerHTML = '';
            
            pile.forEach((card, cardIndex) => {
                const cardElement = this.createCardElement(card);
                cardElement.style.top = `${cardIndex * 20}px`;
                cardElement.style.zIndex = cardIndex;
                pileElement.appendChild(cardElement);
            });
        });
    }

    // ストック・ウェイストを更新
    updateStockWaste() {
        const stockSlot = document.querySelector('.stock-slot');
        const wasteSlot = document.querySelector('.waste-slot');
        
        stockSlot.innerHTML = '';
        wasteSlot.innerHTML = '';
        
        if (this.stock.length > 0) {
            const cardElement = this.createCardElement({ faceUp: false });
            stockSlot.appendChild(cardElement);
        }
        
        if (this.waste.length > 0) {
            const topCard = this.waste[this.waste.length - 1];
            const cardElement = this.createCardElement(topCard);
            wasteSlot.appendChild(cardElement);
        }
    }

    // カード要素を作成
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        if (card.faceUp === false) {
            cardElement.classList.add('face-down');
        } else {
            cardElement.classList.add(card.color);
            cardElement.textContent = card.rank;
        }
        
        // ドラッグ&ドロップ機能を追加
        cardElement.draggable = true;
        cardElement.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
        cardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        return cardElement;
    }

    // スコアを更新
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }

    // スキルボタンを更新
    updateSkillButtons() {
        document.getElementById('skill-points').textContent = this.skillPoints;
        
        const skillButtons = document.querySelectorAll('.skill-btn');
        skillButtons.forEach(btn => {
            const cost = parseInt(btn.querySelector('.skill-cost').textContent);
            btn.disabled = this.skillPoints < cost;
        });
    }

    // タイマーを開始
    startTimer() {
        setInterval(() => {
            if (!this.isTimeStopped) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('time').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // イベントをバインド
    bindEvents() {
        // ストッククリック
        document.querySelector('.stock-slot').addEventListener('click', () => {
            this.drawFromStock();
        });
        
        // スキルボタン
        document.getElementById('transform-skill').addEventListener('click', () => {
            this.useTransformSkill();
        });
        
        document.getElementById('move-skill').addEventListener('click', () => {
            this.useMoveSkill();
        });
        
        document.getElementById('time-stop-skill').addEventListener('click', () => {
            this.useTimeStopSkill();
        });
        
        document.getElementById('reverse-skill').addEventListener('click', () => {
            this.useReverseSkill();
        });
        
        document.getElementById('shuffle-skill').addEventListener('click', () => {
            this.useShuffleSkill();
        });
        
        // ゲームコントロール
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('rules-btn').addEventListener('click', () => {
            document.getElementById('rules-modal').classList.remove('hidden');
        });
        
        document.getElementById('close-rules').addEventListener('click', () => {
            document.getElementById('rules-modal').classList.add('hidden');
        });
    }

    // ゲームをリセット
    resetGame() {
        this.deck = [];
        this.foundation = { hearts: [], diamonds: [], clubs: [], spades: [] };
        this.table = [[], [], [], [], [], [], []];
        this.stock = [];
        this.waste = [];
        this.selectedCard = null;
        this.score = 0;
        this.moves = 0;
        this.skillPoints = 3;
        this.gameHistory = [];
        this.startTime = Date.now();
        this.isTimeStopped = false;
        
        this.initializeGame();
    }
}

// ゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new SolitairePlus();
}); 