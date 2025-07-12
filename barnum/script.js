// バーナム効果的な診断結果データ
const personalityResults = {
    type1: {
        title: "静寂の中に情熱を秘めた、理想を追い求める人",
        description: "あなたの心は、まるで静かな森の奥深くにある泉のようです。<br>その表面は穏やかで、周りの人々はあなたの落ち着いた佇まいに安心感を覚えるでしょう。<br><br>しかし、その静けさの奥には、物事の本質を見抜く鋭い洞察力と、決して揺らぐことのない熱い情熱が秘められています。<br>あなたは、多くの人が見過ごしてしまうような小さな心の機微を敏感に感じ取ることができます。<br><br>時に、その高い理想ゆえに、現実とのギャップに思い悩んだり、自分自身に厳しくなりすぎたりすることもあるかもしれません。<br>ですが、それこそが、あなたが常に前進し、成長し続けるための原動力となっているのです。",
        traits: [
            "言葉にしなくても、相手が何を求めているのかをふと感じ取ることができる、優れた共感力の持ち主です。<br>だからこそ、あなたの周りには自然と人が集まり、深い信頼を寄せられるのでしょう。",
            "『もっとできるはずだ』という内なる声に後押しされ、常に自分を高めようと努力します。<br>そのストイックな姿勢が、あなたをより魅力的な人間へと成長させています。",
            "ありきたりな考え方にとらわれず、独自の視点から世界を眺めることができます。<br>その独創的な発想は、時に周りの人々を驚かせ、新しい可能性の扉を開きます。",
            "うわべだけの関係よりも、心と心で深く理解し合える、本物の絆を何よりも大切にします。<br>あなたにとって、人間関係は人生を豊かにする宝物なのです。",
            "未来への夢や希望を抱きながらも、決して地に足が着いていないわけではありません。<br>理想と現実のバランスを巧みにとりながら、着実に目標へと歩みを進めることができます。"
        ]
    },
    type2: {
        title: "調和の風を紡ぐ、心優しきバランサー",
        description: "あなたは、異なる意見や価値観を持つ人々を、まるで美しいタペストリーのように織りなすことができる、稀有な才能の持ち主です。<br>あなたの存在そのものが、周りの人々に安心感と安定をもたらします。<br><br>対立が生まれそうな時でも、あなたは感情に流されることなく、それぞれの立場を尊重しながら、最も良い解決策を見つけ出すことができるでしょう。<br>それは、あなたが自分自身の確固たる軸を持ちながらも、他者への深い理解と共感を忘れないからです。<br>あなたのその優れたバランス感覚は、多くの人にとって頼れる羅針盤のような存在となっています。",
        traits: [
            "一人で輝くことよりも、チーム全体が輝くことに喜びを感じます。<br>あなたのその協調性が、グループに一体感を生み出し、大きな成果へと導く原動力となります。",
            "嵐の中でも、あなたは船の舵をしっかりと握る船長のように冷静です。<br>その落ち着いた判断力が、困難な状況を乗り越えるための大きな力となります。",
            "最新のテクノロジーや考え方にワクワクする一方で、古くから受け継がれてきた伝統や知恵にも深い敬意を払います。<br>その柔軟な思考が、あなたの視野を広げています。",
            "道端で困っている人がいれば、自然と手を差し伸べてしまう、温かい心を持っています。<br>その優しさは、見返りを求めることのない、本物の思いやりです。",
            "自分のための静かな時間も、大切な人たちと過ごす賑やかな時間も、どちらもあなたにとってはかけがえのないもの。<br>その絶妙なバランス感覚が、あなたの心を豊かに保っています。"
        ]
    },
    type3: {
        title: "未来を切り拓く、情熱の冒険家",
        description: "あなたの魂は、まだ誰も見たことのない新大陸を目指す冒険家のように、常に情熱の炎を燃やしています。<br>未知なるものへの好奇心と、困難を恐れない勇敢さが、あなたを突き動かす大きなエネルギーとなっています。<br><br>あなたのそのエネルギッシュな姿は、周りの人々の心にも火をつけ、停滞した空気を一変させるほどの力を持っています。<br>あなたは、ただ前へ進むだけでなく、共に歩む仲間への配慮も忘れません。<br>その情熱と優しさが、あなたを真のリーダーへと押し上げるでしょう。",
        traits: [
            "目の前に高い壁が立ちはだかったとしても、『どうすれば乗り越えられるだろう？』と、むしろ心を燃やすことができます。<br>その不屈の精神が、不可能を可能に変えるのです。",
            "あなたの『大丈夫！』という一言には、不思議な力が宿っています。<br>その明るさと力強い励ましが、多くの人の背中を押し、勇気を与えています。",
            "頭で考えるよりも先に、心が『これだ！』と答えを導き出すことがあります。<br>その鋭い直感力は、これまで何度もあなたを正しい道へと導いてきたはずです。",
            "世界は、あなたにとって巨大な遊び場のようなもの。<br>常に新しい発見や学びを求め、その知的好奇心は尽きることがありません。",
            "時には、後先を考えずに行動してしまうこともあるかもしれません。<br>しかし、その大胆な一歩こそが、誰も予想しなかったような素晴らしい未来を創造するきっかけとなるのです。"
        ]
    },
    type4: {
        title: "着実に未来を築く、信頼の建築家",
        description: "あなたは、壮大な建築物を設計する建築家のように、物事を緻密に、そして長期的な視点で捉えることができます。<br>その場の感情や衝動に流されることなく、一つ一つの石を丁寧に積み上げるように、着実に目標へと向かって進んでいきます。<br><br>その誠実で責任感の強い姿勢は、周りの人々に大きな安心感と信頼を与えます。<br>『あなたに任せておけば大丈夫』——そう思わせるだけの説得力が、あなたの言動には備わっています。<br>あなたの築き上げるものは、決して揺らぐことのない、確かな未来なのです。",
        traits: [
            "十年後の自分を想像し、そのために今何をすべきかを考えることができます。<br>その計画性の高さが、あなたの人生に安定と豊かさをもたらします。",
            "一度交わした約束は、どんなに小さなことであっても決して破りません。<br>その誠実さが、何にも代えがたいあなたの信頼の礎となっています。",
            "一見、複雑で解決不可能に思える問題も、あなたにとっては解きがいのあるパズルのようなもの。<br>冷静に分析し、一つずつ着実に解決へと導くことができます。",
            "人の短所ではなく、長所に目を向けることができます。<br>あなたの温かい励ましによって、自分に自信を持つことができた人も少なくないはずです。",
            "安定した日常を大切にしながらも、人生をより良くするための変化であれば、前向きに受け入れることができる柔軟性も持ち合わせています。"
        ]
    },
    type5: {
        title: "常識にとらわれない、自由な精神のアーティスト",
        description: "あなたの心は、何色にも染まっていない真っ白なキャンバスのようです。<br>そこに、あなたは常識という絵の具ではなく、自分だけの色で、自由な発想の絵を描いていきます。<br><br>多くの人が当たり前だと思っていることにも、『本当にそうなのだろうか？』と疑問を投げかけ、独自の視点から新しい価値を見出すことができます。<br>あなたは、誰かの真似をするのではなく、『自分らしさ』を表現することに喜びを感じる、真のアーティストです。<br><br>その独立した精神は、時に孤高に見えるかもしれませんが、あなたの周りには、そのユニークな感性に惹かれる人々が自然と集まってくるでしょう。",
        traits: [
            "行き詰まった状況でも、誰も思いつかなかったような角度から光を当て、驚くような解決策を提示することができます。<br>その発想力は、まさにあなたの才能です。",
            "自分自身の考えや信念をしっかりと持ちながらも、他者の異なる意見に耳を傾け、尊重することができる、懐の深さを持っています。",
            "道端に咲く一輪の花や、日常の何気ない風景の中にも、特別な美しさや面白さを見つけ出すことができます。<br>その豊かな感受性が、あなたの人生を彩ります。",
            "深く自分自身と向き合うための孤独な時間を必要としますが、同時に、信頼できる仲間との語らいの時間もあなたにとっては不可欠なものです。",
            "変化は、あなたにとって恐れるものではなく、新しい自分に出会うためのチャンスです。<br>どんな環境でも、あなたらしくしなやかに適応していくことができます。"
        ]
    }
};

// DOM要素の取得
const quizForm = document.getElementById('quiz-form');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const resultContent = document.getElementById('result-content');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');

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

// メニューに戻るボタンの処理
backBtn.addEventListener('click', function() {
    window.location.href = '../index.html';
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