const inputText = document.getElementById('input-text');
const convertButton = document.getElementById('convert-button');
const resultText = document.getElementById('result-text');

// ページ読み込み後に初期化（kuromoji不要）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        convertButton.disabled = false;
        convertButton.textContent = "変換するゾ！";
        inputText.placeholder = "ここに文章を入力してネ(^_-)-☆";
    });
} else {
    convertButton.disabled = false;
    convertButton.textContent = "変換するゾ！";
    inputText.placeholder = "ここに文章を入力してネ(^_-)-☆";
}

// 感情分析用キーワード辞書
const emotionKeywords = {
    happy: ["嬉しい", "楽しい", "幸せ", "良い", "最高", "素晴らしい", "おめでとう", "ありがとう", "喜び"],
    sad: ["悲しい", "辛い", "苦しい", "寂しい", "落ち込む", "泣く", "涙", "困る", "心配"],
    angry: ["怒る", "腹立つ", "ムカつく", "イライラ", "最悪", "ダメ", "嫌", "許せない"],
    excited: ["すごい", "やばい", "興奮", "ワクワク", "テンション", "ヤバい", "マジ"],
    tired: ["疲れた", "眠い", "しんどい", "だるい", "お疲れ様", "休み", "忙しい"],
    love: ["好き", "愛", "恋", "大切", "可愛い", "素敵", "美しい", "魅力的"]
};

// 雰囲気別接頭辞
const contextualPrefixes = {
    happy: [
        "【ワーイ🎉〇〇チャン、見てるカナ⁉️】", "ヤッホー👋✨今日も元気だネ❓", 
        "おっはー！🌞今日も最高にカワイイね💕", "素晴らしい日だネ〜🌈〇〇チャン💖"
    ],
    sad: [
        "【〇〇チャン…大丈夫かい❓😢】", "おじさん、心配になっちゃったよ💦", 
        "辛い時はおじさんがついてるからネ😌", "〇〇チャンの涙を見るのは辛いなぁ😭"
    ],
    excited: [
        "【うおおお〜〜〜🔥〇〇チャン！！】", "テンション上がっちゃうゾ〜😆✨", 
        "ヤバいヤバい！興奮しちゃう〜🤩", "〇〇チャンのパワーもらったゾ💪⚡"
    ],
    tired: [
        "【お疲れ様〜〇〇チャン🍻】", "ゆっくり休んでネ😴💤", 
        "無理は禁物だゾ〜😌", "おじさんがマッサージしてあげたいナ👐"
    ],
    love: [
        "【愛しの〇〇チャン💕】", "君への想いが止まらないよ〜💖", 
        "〇〇チャンは天使だネ👼✨", "おじさんの心を奪った罪深い女の子😘"
    ],
    default: [
        "【〇〇チャン、見てるカナ⁉️】", "ヤッホー👋( ´∀｀)元気かい❓", 
        "おっはー！🌞今日もカワイイね💕", "急にごめんね💦〇〇チャンのこと考えちゃって…(笑)"
    ]
};

// 雰囲気別接尾辞
const contextualSuffixes = {
    happy: [
        "一緒に喜んじゃうゾ〜🎊✨", "幸せのおすそ分けだネ😊💕", 
        "〇〇チャンの笑顔が一番だよ〜😄", "今度お祝いしようネ🥂"
    ],
    sad: [
        "おじさんがそばにいるからネ😌💗", "きっと大丈夫だよ〜🌈", 
        "〇〇チャンは一人じゃないゾ👥💪", "いつでも話を聞くからネ📞💕"
    ],
    excited: [
        "一緒にテンション上げちゃおうゾ〜🚀", "〇〇チャンの興奮が伝染しちゃうナ😆", 
        "この勢いで何でもできそうだネ💪⚡", "最高の気分だゾ〜🔥✨"
    ],
    tired: [
        "ゆっくりしてネ〜😴💤", "明日は元気になりますように🌟", 
        "お疲れさまの気持ちを込めて💐", "たまには甘えてもいいんだゾ😌"
    ],
    love: [
        "愛してるよ、〇〇チャン…❤️", "君の瞳に乾杯🥂✨", 
        "チュッ😘💕", "永遠に〇〇チャンのものだゾ💖∞"
    ],
    default: [
        "なんちゃってネ😜(笑)", "なんてね、冗談だよ〜😂", 
        "またご飯でも行こうネ！😉", "無理しないでネ！おじさんがついてるゾ💪"
    ]
};

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

// 感情分析機能
const analyzeEmotion = (text) => {
    const emotionScores = {
        happy: 0, sad: 0, angry: 0, excited: 0, tired: 0, love: 0
    };
    
    // 各感情のキーワードが含まれているかチェック
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                emotionScores[emotion] += 1;
            }
        }
    }
    
    // 最も高いスコアの感情を返す
    let maxEmotion = 'default';
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(emotionScores)) {
        if (score > maxScore) {
            maxScore = score;
            maxEmotion = emotion;
        }
    }
    
    return maxScore > 0 ? maxEmotion : 'default';
};

// 文章の長さと複雑さを分析
const analyzeTextComplexity = (text) => {
    const length = text.length;
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0).length;
    
    return {
        isShort: length < 20,
        isLong: length > 100,
        isMultipleSentences: sentences > 1
    };
};

// 変換処理（kuromoji不要の簡易版）
const convertToOjisan = (text) => {
    // 文章の感情と複雑さを分析
    const emotion = analyzeEmotion(text);
    const complexity = analyzeTextComplexity(text);
    
    console.log(`分析結果: 感情=${emotion}, 複雑さ=${JSON.stringify(complexity)}`);

    // 感情に応じた変換強度を調整
    const intensityConfig = {
        happy: { katakana: 0.5, emoji: 0.8, interruption: 0.3 },
        excited: { katakana: 0.7, emoji: 0.9, interruption: 0.6 },
        sad: { katakana: 0.2, emoji: 0.4, interruption: 0.1 },
        tired: { katakana: 0.1, emoji: 0.3, interruption: 0.05 },
        love: { katakana: 0.6, emoji: 0.7, interruption: 0.4 },
        angry: { katakana: 0.8, emoji: 0.6, interruption: 0.2 },
        default: { katakana: 0.4, emoji: 0.6, interruption: 0.5 }
    };

    const config = intensityConfig[emotion];
    let result = text;

    // 簡易的なカタカナ変換（特定の単語）
    const katakanaTargets = [
        'だよ', 'です', 'ます', 'した', 'して', 'ある', 'いる', 'なる', 'する',
        'きた', 'いた', 'った', 'みた', 'った', 'よね', 'かな', 'でも', 'から'
    ];
    
    katakanaTargets.forEach(target => {
        if (Math.random() < config.katakana) {
            const katakanaTarget = toKatakana(target);
            result = result.replace(new RegExp(target, 'g'), katakanaTarget);
        }
    });

    // 句読点を絵文字に変換
    result = result.replace(/[、。]/g, () => {
        const emojiCount = emotion === 'excited' ? 
            Math.floor(Math.random() * 4) + 2 : 
            emotion === 'sad' || emotion === 'tired' ? 
            Math.floor(Math.random() * 2) + 1 : 
            Math.floor(Math.random() * 3) + 1;
        
        let emojiStr = '';
        for (let i = 0; i < emojiCount; i++) {
            emojiStr += emojis[Math.floor(Math.random() * emojis.length)];
        }
        return emojiStr;
    });

    // ランダムに絵文字を挿入
    const words = result.split(/(\s+)/);
    result = words.map(word => {
        if (word.trim() && Math.random() < config.emoji * 0.3) {
            return word + emojis[Math.floor(Math.random() * emojis.length)];
        }
        return word;
    }).join('');

    // 感情と文章の長さに応じた自分語り挿入
    if (Math.random() < config.interruption && !complexity.isShort) {
        const interruption = interruptions[Math.floor(Math.random() * interruptions.length)];
        const insertPos = Math.floor(Math.random() * result.length);
        result = result.slice(0, insertPos) + `【${interruption}】` + result.slice(insertPos);
    }

    // 感情に応じた接頭辞・接尾辞の選択
    const selectedPrefixes = contextualPrefixes[emotion] || contextualPrefixes.default;
    const selectedSuffixes = contextualSuffixes[emotion] || contextualSuffixes.default;
    
    const prefix = selectedPrefixes[Math.floor(Math.random() * selectedPrefixes.length)];
    const suffix = selectedSuffixes[Math.floor(Math.random() * selectedSuffixes.length)];

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

