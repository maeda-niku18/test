// バーナム効果的な診断結果データ
const personalityResults = {
    type1: {
        title: "思慮深い理想主義者",
        description: "あなたは他人の気持ちを理解し、深く考える能力に長けています。時には完璧主義的な面もありますが、それは高い理想を持っているからこそです。",
        traits: [
            "人の気持ちを察することが得意で、周囲から信頼されています",
            "時々、自分に厳しすぎることがありますが、それが成長の原動力になっています",
            "創造性が豊かで、独特な視点を持っています",
            "人間関係において、表面的な付き合いより深いつながりを求める傾向があります",
            "将来に対して楽観的である一方で、現実的な計画も立てられます"
        ]
    },
    type2: {
        title: "バランス感覚に優れた協調者",
        description: "あなたは周囲との調和を大切にしながらも、自分の意見をしっかりと持っています。困難な状況でも冷静さを保ち、適切な判断ができる人です。",
        traits: [
            "チームワークを重視し、グループの中で重要な役割を果たすことが多いです",
            "感情的になりそうな場面でも、客観的な判断を下すことができます",
            "新しいアイデアを受け入れる柔軟性と、伝統を大切にする心の両方を持っています",
            "困っている人を見過ごせない、優しい心の持ち主です",
            "自分の時間と他人との時間のバランスを上手に取ることができます"
        ]
    },
    type3: {
        title: "積極的な挑戦者",
        description: "あなたは新しいことに挑戦することを恐れず、エネルギッシュに行動します。周囲の人々にとって刺激的な存在でありながら、思いやりも忘れない人です。",
        traits: [
            "困難な状況でも前向きに取り組む強さを持っています",
            "他人を励ますことが得意で、周囲を明るい雰囲気にします",
            "直感力に優れており、重要な決断を迅速に下すことができます",
            "好奇心旺盛で、常に新しい知識や経験を求めています",
            "時には衝動的になることもありますが、それが新しい可能性を生み出します"
        ]
    },
    type4: {
        title: "慎重な計画家",
        description: "あなたは物事を慎重に考え、計画的に行動することができます。周囲の人からは信頼できる存在として頼られることが多く、責任感も強い人です。",
        traits: [
            "長期的な視点で物事を考えることができ、将来への準備を怠りません",
            "約束を守ることを重視し、周囲からの信頼を得ています",
            "複雑な問題でも、段階的に解決していく能力を持っています",
            "他人の良い面を見つけることが得意で、人を励ますことができます",
            "安定を求める一方で、適度な変化も受け入れることができます"
        ]
    },
    type5: {
        title: "創造的な独立者",
        description: "あなたは独自の価値観を持ち、創造的な発想で問題を解決します。他人に流されることなく、自分らしさを大切にしながらも、必要な時には協力することができます。",
        traits: [
            "物事を多角的に見ることができ、ユニークな解決策を提案します",
            "自分の信念を持ちながらも、他人の意見を尊重することができます",
            "芸術的なセンスがあり、美しいものや面白いものを発見するのが得意です",
            "一人の時間を大切にしながらも、人とのつながりも重視します",
            "変化を恐れず、新しい環境にも柔軟に適応することができます"
        ]
    }
};

// DOM要素の取得
const quizForm = document.getElementById('quiz-form');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const resultContent = document.getElementById('result-content');
const restartBtn = document.getElementById('restart-btn');

// 診断結果の計算と表示
function calculateResult(answers) {
    // 各質問の回答を数値に変換
    const scores = answers.map(answer => parseInt(answer));
    
    // 合計スコアを計算
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    
    // スコアに基づいて結果タイプを決定
    let resultType;
    if (totalScore <= 7) {
        resultType = 'type1';
    } else if (totalScore <= 10) {
        resultType = 'type2';
    } else if (totalScore <= 13) {
        resultType = 'type3';
    } else if (totalScore <= 16) {
        resultType = 'type4';
    } else {
        resultType = 'type5';
    }
    
    // ランダム要素を加えて結果をより多様にする
    const randomFactor = Math.random();
    if (randomFactor < 0.2) {
        // 20%の確率で隣接するタイプに変更
        const typeNumbers = ['type1', 'type2', 'type3', 'type4', 'type5'];
        const currentIndex = typeNumbers.indexOf(resultType);
        const adjacentTypes = [];
        
        if (currentIndex > 0) adjacentTypes.push(typeNumbers[currentIndex - 1]);
        if (currentIndex < typeNumbers.length - 1) adjacentTypes.push(typeNumbers[currentIndex + 1]);
        
        if (adjacentTypes.length > 0) {
            resultType = adjacentTypes[Math.floor(Math.random() * adjacentTypes.length)];
        }
    }
    
    return personalityResults[resultType];
}

// 結果の表示
function displayResult(result) {
    const resultHtml = `
        <div class="result-type">${result.title}</div>
        <div class="result-description">${result.description}</div>
        <div class="result-traits">
            <h4>あなたの特徴：</h4>
            <ul>
                ${result.traits.map(trait => `<li>${trait}</li>`).join('')}
            </ul>
        </div>
        <p style="color: #718096; font-size: 0.9rem; margin-top: 20px; font-style: italic;">
            ※この診断結果は、あなたの回答に基づいて作成されています。性格は多面的で複雑なものです。
        </p>
    `;
    
    resultContent.innerHTML = resultHtml;
    
    // 結果表示のアニメーション
    quizContainer.style.display = 'none';
    resultContainer.classList.remove('hidden');
    resultContainer.style.opacity = '0';
    resultContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        resultContainer.style.transition = 'all 0.5s ease';
        resultContainer.style.opacity = '1';
        resultContainer.style.transform = 'translateY(0)';
    }, 100);
}

// フォーム送信の処理
quizForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 全ての質問に回答されているかチェック
    const formData = new FormData(quizForm);
    const answers = [];
    
    for (let i = 1; i <= 5; i++) {
        const answer = formData.get(`q${i}`);
        if (!answer) {
            alert(`Q${i}に回答してください。`);
            return;
        }
        answers.push(answer);
    }
    
    // 診断結果を計算して表示
    const result = calculateResult(answers);
    displayResult(result);
});

// 再診断ボタンの処理
restartBtn.addEventListener('click', function() {
    // フォームをリセット
    quizForm.reset();
    
    // 表示を元に戻す
    resultContainer.classList.add('hidden');
    quizContainer.style.display = 'block';
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期状態では結果コンテナを非表示
    resultContainer.classList.add('hidden');
    
    // フォーム要素にイベントリスナーを追加
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            // 選択されたラベルのスタイルを更新
            const questionGroup = this.closest('.question-group');
            const labels = questionGroup.querySelectorAll('label');
            
            labels.forEach(label => {
                label.style.background = 'white';
                label.style.color = '#333';
                label.style.borderColor = 'transparent';
            });
            
            this.parentElement.style.background = '#667eea';
            this.parentElement.style.color = 'white';
            this.parentElement.style.borderColor = '#667eea';
        });
    });
    
    // 送信ボタンの有効/無効を制御
    const submitBtn = document.querySelector('.submit-btn');
    const updateSubmitButton = () => {
        const formData = new FormData(quizForm);
        let allAnswered = true;
        
        for (let i = 1; i <= 5; i++) {
            if (!formData.get(`q${i}`)) {
                allAnswered = false;
                break;
            }
        }
        
        submitBtn.disabled = !allAnswered;
    };
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateSubmitButton);
    });
    
    // 初期状態で送信ボタンを無効化
    updateSubmitButton();
});