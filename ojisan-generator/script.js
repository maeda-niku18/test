const inputText = document.getElementById('input-text');
const convertButton = document.getElementById('convert-button');
const resultText = document.getElementById('result-text');
const backButton = document.getElementById('back-button');

let tokenizer = null;

// Kuromoji.jsの初期化
kuromoji.builder({
    dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
}).build(function(err, t) {
    if (err) {
        console.error("Kuromoji.js initialization failed:", err);
        inputText.placeholder = "辞書の読み込みに失敗しました。ページをリロードしてください。";
        convertButton.textContent = "エラー";
        return;
    }
    tokenizer = t;
    convertButton.disabled = false;
    convertButton.textContent = "変換するゾ！";
    inputText.placeholder = "ここに文章を入力してネ(^_-)-☆";
    console.log("Kuromoji.js loaded.");
});

// 究極の接頭辞
const prefixes = [
    "【〇〇チャン、見てるカナ⁉️】", "ヤッホー👋( ´∀｀)元気かい❓", "おっはー！🌞今日もカワイイね💕",
    "お仕事、お疲れ様〜🍻✨", "急にごめんね💦〇〇チャンのこと考えちゃって…(笑)", "久しぶり❗元気にしてるかな❓"
];

// 地獄の接尾辞
const suffixes = [
    "なんちゃってネ😜(笑)", "なんてね、冗談だよ〜😂", "またご飯でも行こうネ！😉",
    "無理しないでネ！おじさんがついてるゾ💪", "チュッ😘💕", "君の瞳に乾杯🥂✨",
    "愛してるよ、〇〇チャン…❤️"
];

// ギラギラ絵文字セット
const emojis = [
    "😊", "😄", "😁", "😆", "😅", "😂", "🤣", "😉", "😜", "😝", "🤗", "🤔", "💦", "汗", "❗", "‼️", "⁉️",
    "✨", "💖", "💕", "💓", "💞", "✌️", "👍", "💪", "👀", "👋", "（笑）", "🎉", "🎊", "㊗️", "キラキラ",
    "✨", "🌟", "🤩", "🥳", "💯", "🙌", "🍻", "🥂", "🚀", "🌈", "💖", "💞", "💓", "💕", "❣️", "❤️",
    "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "😘", "😚", "🥰", "😍", "🥺", "😢", "😭"
];

// 脈絡なき自分語り＆質問
const interruptions = [
    "おじさん、〇〇チャンに会いたくて震えちゃった(笑)🤣",
    "今日は何してるのかな〜❓気になっちゃうな〜😍",
    "おじさん、最近寂しいんだ…😢",
    "困ったことがあったら、いつでもおじさんに言うんだゾ！👍",
    "〇〇チャンのこと、いつも見てるよ（ストーカーじゃないよ！笑）"
];

// カタカナ変換
const toKatakana = (str) => {
    return str.replace(/[ぁ-ん]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0x60);
    });
};

// 変換処理
const convertToOjisan = (text) => {
    if (!tokenizer) {
        return "まだ辞書を読み込んでるから、ちょっと待っててネ！";
    }

    const tokens = tokenizer.tokenize(text);
    let result = "";

    tokens.forEach(token => {
        const surface = token.surface_form;
        const pos = token.pos;
        const pos_detail = token.pos_detail_1;

        // 読点を地獄の絵文字コンボに変換
        if (pos === '記号' && (surface === '、' || surface === '。')) {
            const emojiCount = Math.floor(Math.random() * 3) + 1; // 1〜3個の絵文字
            for (let i = 0; i < emojiCount; i++) {
                result += emojis[Math.floor(Math.random() * emojis.length)];
            }
            return;
        }

        let convertedSurface = surface;

        // 名詞・動詞・形容詞を確率でカタカナ化
        if (['名詞', '動詞', '形容詞'].includes(pos) && Math.random() < 0.4) {
            convertedSurface = toKatakana(surface);
        }
        // 助詞・助動詞は高確率でカタカナ化
        if (['助詞', '助動詞'].includes(pos) && Math.random() < 0.7) {
            convertedSurface = toKatakana(surface);
        }

        // 単語の途中に絵文字をねじ込む
        if (convertedSurface.length > 2 && Math.random() < 0.2) {
            const insertPos = Math.floor(Math.random() * (convertedSurface.length - 1)) + 1;
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            convertedSurface = convertedSurface.slice(0, insertPos) + emoji + convertedSurface.slice(insertPos);
        }

        result += convertedSurface;

        // 単語の後ろに絵文字をスパム（超高確率）
        if (Math.random() < 0.6) {
            result += emojis[Math.floor(Math.random() * emojis.length)];
        }
    });

    // 脈絡のない自分語りをランダムに挿入
    if (Math.random() < 0.5) {
        const interruption = interruptions[Math.floor(Math.random() * interruptions.length)];
        const insertPos = Math.floor(Math.random() * result.length);
        result = result.slice(0, insertPos) + `【${interruption}】` + result.slice(insertPos);
    }


    // 文頭と文末に装飾を追加
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${result} ${suffix}`;
};


convertButton.addEventListener('click', () => {
    const text = inputText.value;
    if (!text) {
        resultText.textContent = "何か文章を入力してくれないと、おじさん構文にできないヨ！💦";
        return;
    }
    resultText.textContent = convertToOjisan(text);
});

backButton.addEventListener('click', () => {
    window.location.href = '../index.html';
});