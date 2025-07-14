// NGワードフィルタリング機能
class NGWordFilter {
    constructor() {
        this.ngWords = null;
        this.isInitialized = false;
    }

    // 初期化
    async initialize() {
        try {
            // NGワード設定を読み込み
            const response = await fetch('ng-words.json');
            if (response.ok) {
                this.ngWords = await response.json();
            } else {
                console.warn('NGワード設定ファイルが見つかりません');
                this.ngWords = this.getDefaultNGWords();
            }

            this.isInitialized = true;
            console.log('NGワードフィルター初期化完了');
        } catch (error) {
            console.error('NGワードフィルター初期化エラー:', error);
            this.ngWords = this.getDefaultNGWords();
            this.isInitialized = true;
        }
    }

    // デフォルトのNGワード設定
    getDefaultNGWords() {
        return {
            exact_match: [
                "バカ", "ばか", "馬鹿",
                "アホ", "あほ", "阿呆",
                "死ね", "しね",
                "殺す", "ころす",
                "消えろ", "きえろ",
                "うざい", "ウザい", "ウザイ",
                "むかつく", "ムカつく", "ムカツク",
                "ブス", "ぶす",
                "ブサイク", "ぶさいく", "不細工",
                "キモい", "きもい", "気持ち悪い",
                "デブ", "でぶ",
                "チビ", "ちび",
                "ハゲ", "はげ", "禿げ",
                "頭悪い", "あたまわるい",
                "要領悪い", "ようりょうわるい",
                "いなくなれ", "居なくなれ",
                "いないほうがマシ", "いない方がマシ", "居ない方がマシ",
                "価値がない", "価値ない",
                "無価値", "むかち",
                "役立たず", "やくたたず",
                "使えない", "つかえない",
                "邪魔", "じゃま", "ジャマ",
                "迷惑", "めいわく",
                "最低", "さいてい",
                "最悪", "さいあく",
                "クズ", "くず", "屑"
            ],
            partial_match: [
                "クソ", "くそ", "糞",
                "ゴミ", "ごみ",
                "カス", "かす",
                "きしょ", "キショ",
                "だせー", "ダサい", "だサい",
                "しょーもな", "ショーモナ",
                "つまらん", "つまんな"
            ]
        };
    }

    // メッセージをチェック
    checkMessage(message) {
        if (!this.isInitialized || !message || !this.ngWords) {
            return { isClean: true, detectedWords: [] };
        }

        const detectedWords = [];
        const normalizedMessage = this.normalizeText(message);

        // 1. 完全一致チェック
        for (const ngWord of this.ngWords.exact_match || []) {
            const normalizedNG = this.normalizeText(ngWord);
            if (normalizedMessage.includes(normalizedNG)) {
                detectedWords.push(ngWord);
            }
        }

        // 2. 部分一致チェック
        for (const ngWord of this.ngWords.partial_match || []) {
            const normalizedNG = this.normalizeText(ngWord);
            if (normalizedMessage.includes(normalizedNG)) {
                detectedWords.push(ngWord);
            }
        }

        // 3. 能力否定系チェック
        for (const ngWord of this.ngWords.ability_denial || []) {
            const normalizedNG = this.normalizeText(ngWord);
            if (normalizedMessage.includes(normalizedNG)) {
                detectedWords.push(ngWord);
            }
        }

        // 4. 存在否定系チェック
        for (const ngWord of this.ngWords.existence_denial || []) {
            const normalizedNG = this.normalizeText(ngWord);
            if (normalizedMessage.includes(normalizedNG)) {
                detectedWords.push(ngWord);
            }
        }

        // 5. パターンマッチング（簡易版）
        detectedWords.push(...this.checkPatterns(normalizedMessage));

        const isClean = detectedWords.length === 0;
        return { isClean, detectedWords };
    }

    // テキストの正規化
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[ァ-ヶ]/g, (match) => {
                // カタカナをひらがなに変換
                const code = match.charCodeAt(0) - 0x60;
                return String.fromCharCode(code);
            })
            .replace(/\s+/g, '') // 空白を除去
            .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字を半角に
            .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); // 全角英字を半角に
    }

    // パターンマッチング（簡易版形態素解析の代替）
    checkPatterns(normalizedMessage) {
        const detectedWords = [];
        
        // 「死」関連の検出
        const deathPattern = /死(ね|んで|のう|ぬ|な|にたい|にそう)/;
        if (deathPattern.test(normalizedMessage)) {
            detectedWords.push('死ね系の表現');
        }

        // 「殺」関連の検出
        const killPattern = /(殺|ころ)(す|せ|し|した|そう)/;
        if (killPattern.test(normalizedMessage)) {
            detectedWords.push('殺害系の表現');
        }

        // 「消え」関連の検出
        const disappearPattern = /(消え|きえ)(ろ|て|な)/;
        if (disappearPattern.test(normalizedMessage)) {
            detectedWords.push('排除系の表現');
        }

        // その他の暴言パターン
        const violentPatterns = [
            { pattern: /う(ざ|ザ)(い|イ|すぎ)/, name: '不快表現' },
            { pattern: /(むか|ムカ)(つく|ツク)/, name: '不快表現' },
            { pattern: /(きも|キモ)(い|イ)/, name: '不快表現' },
            { pattern: /ぶっ?殺/, name: '暴力表現' },
            { pattern: /死ねばいい/, name: '死ね系の表現' },
            { pattern: /生きる価値/, name: '人格否定' },
            { pattern: /(ブス|ぶす|不細工)/, name: '外見誹謗' },
            { pattern: /(デブ|でぶ|チビ|ちび|ハゲ|はげ)/, name: '外見誹謗' },
            { pattern: /(頭|あたま).{0,3}(悪|わる)/, name: '能力否定' },
            { pattern: /(要領|ようりょう).{0,3}(悪|わる)/, name: '能力否定' },
            { pattern: /(価値|かち).{0,5}(ない|無い)/, name: '存在否定' },
            { pattern: /(役立|やくだ).{0,3}(たず)/, name: '能力否定' },
            { pattern: /(使え|つかえ).{0,3}(ない|無い)/, name: '能力否定' },
            { pattern: /いな(い|くな).{0,5}(方|ほう|マシ|まし)/, name: '存在否定' }
        ];

        for (const item of violentPatterns) {
            if (item.pattern.test(normalizedMessage)) {
                detectedWords.push(item.name);
                break;
            }
        }

        return detectedWords;
    }

    // NGワードをマスクする
    maskNGWords(message) {
        if (!this.isInitialized || !this.ngWords) {
            return message;
        }

        let maskedMessage = message;
        
        // 完全一致のマスク
        for (const ngWord of this.ngWords.exact_match || []) {
            const regex = new RegExp(ngWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            maskedMessage = maskedMessage.replace(regex, '*'.repeat(ngWord.length));
        }

        // 部分一致のマスク
        for (const ngWord of this.ngWords.partial_match || []) {
            const regex = new RegExp(ngWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            maskedMessage = maskedMessage.replace(regex, '*'.repeat(ngWord.length));
        }

        return maskedMessage;
    }
}

// グローバルインスタンス
window.ngFilter = new NGWordFilter();

// 初期化関数
window.initializeNGFilter = async function() {
    await window.ngFilter.initialize();
};