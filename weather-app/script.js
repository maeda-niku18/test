const weatherCodes = {
    0: '快晴',
    1: '晴れ',
    2: '薄曇り',
    3: '曇り',
    45: '霧',
    48: '霧氷',
    51: '弱い霧雨',
    53: '霧雨',
    55: '強い霧雨',
    61: '小雨',
    63: '雨',
    65: '大雨',
    71: '小雪',
    73: '雪',
    75: '大雪',
    80: 'にわか雨',
    81: '雨',
    82: '豪雨',
    95: '雷雨'
};

const weatherEmoji = {
    0: '☀️',
    1: '🌤',
    2: '⛅️',
    3: '☁️',
    45: '🌫',
    48: '🌫',
    51: '🌦',
    53: '🌦',
    55: '🌦',
    61: '☔️',
    63: '☔️',
    65: '☔️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    80: '🌧',
    81: '🌧',
    82: '🌧',
    95: '⚡️'
};

const prefixes = ['竜の', '幻の', '雲海の', '星降る', '黒曜の', '月夜の', '霧深き', '黄金の', '虚空の', '翠嵐の'];
const cores = ['首の玉', '子安貝', '風の羽', '涙の雫', '夢の繭', '炎の欠片', '氷の心臓', '時の砂', '雷の爪', '森羅の実'];
const suffixes = ['・火炎', '・刻印', '・加護', '・覚醒', '・永遠', '', '', '', '・祝福', '・歪曲'];

function suggestClothing(temp) {
    if (temp <= 10) return 'コート、マフラー、手袋';
    if (temp <= 17) return 'ニット、ジャケット';
    if (temp <= 24) return '長袖シャツ、羽織';
    return '半袖、帽子、サンダル';
}

function makeLuckyItem() {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    return p + c + s;
}

const adviceRules = [
    {cond: d => d.morning <= 10 && d.noon >= 25, msg: '朝は寒く昼は暑くなりそう。羽織れるものを1枚持って出かけましょう'},
    {cond: d => d.max - d.min >= 15, msg: '昼夜の寒暖差が大きい日。脱ぎ着しやすい服装を'},
    {cond: d => d.max - d.min >= 10, msg: '朝晩と日中の温度差が激しそうです'},
    {cond: d => d.max >= 35, msg: '危険な暑さになりそう。無理せず水分補給を'},
    {cond: d => d.max >= 33, msg: '厳しい暑さです。こまめに水分と塩分を'},
    {cond: d => d.max >= 30, msg: '暑い一日になりそう。日陰を活用しましょう'},
    {cond: d => d.max >= 28, msg: '汗ばむ陽気です。薄手の服装がおすすめ'},
    {cond: d => d.max >= 25 && d.min >= 20, msg: '朝から暑い日。通気性の良い服装で'},
    {cond: d => d.min >= 25, msg: '夜も暑さが残りそう。寝る前も水分を'},
    {cond: d => d.max <= 0, msg: '極寒です。外出は控えましょう'},
    {cond: d => d.max <= 5, msg: '非常に寒い日。防寒必須です'},
    {cond: d => d.min <= 0, msg: '朝は凍える寒さ。手袋を忘れずに'},
    {cond: d => d.min <= 5, msg: '朝晩の冷え込みに注意。コートやマフラーを'},
    {cond: d => d.rain && d.max >= 28, msg: '蒸し暑い雨になりそう。吸湿速乾の服が◎'},
    {cond: d => d.heavyRain, msg: '強い雨が予想されます。レインコートがあると安心'},
    {cond: d => d.rain, msg: '雨が降りそうです。傘を忘れずに'},
    {cond: d => d.thunder, msg: '雷の可能性があります。建物の中に避難を'},
    {cond: d => d.snow && d.max <= 0, msg: '雪と厳しい寒さに注意。滑りにくい靴を'},
    {cond: d => d.snow, msg: '雪が降りそう。足元に気をつけて'},
    {cond: d => d.heavySnow, msg: '大雪の恐れがあります。早めの行動を'},
    {cond: d => d.fog, msg: '霧で視界が悪くなりそう。運転は慎重に'},
    {cond: d => d.codeMorning <= 2 && d.codeNoon >= 3, msg: '午前は晴れますが午後は雲が増えそう'},
    {cond: d => d.codeMorning >= 3 && d.codeNoon <= 2, msg: '午後から晴れ間が期待できます'},
    {cond: d => d.codeMorning <= 2 && d.codeNoon <= 2, msg: '一日穏やかな晴天になりそうです'},
    {cond: d => d.codeMorning >= 3 && d.codeNoon >= 3, msg: '雲が広がる一日になりそうです'},
    {cond: d => d.min <= 15 && d.max >= 25, msg: '朝晩と昼の気温差が大きめ。羽織り物を'},
    {cond: d => d.max <= 15 && d.min <= 5, msg: '一日を通して寒いでしょう。暖かい服装で'},
    {cond: d => d.max <= 20 && d.min >= 15, msg: '過ごしやすい気温ですが、薄手の上着があると安心'},
    {cond: d => d.max >= 23 && d.max <= 26, msg: '爽やかな陽気。外歩きに最適です'},
    {cond: d => d.codeNoon == 95, msg: '午後は雷雨に注意。外出は控えめに'},
    {cond: d => d.codeMorning == 80 || d.codeNoon == 80, msg: 'にわか雨の可能性。折り畳み傘を携帯して'},
];

function getAdvice(data) {
    for (const rule of adviceRules) {
        if (rule.cond(data)) {
            return rule.msg;
        }
    }
    return '天候に合わせて快適に過ごしましょう';
}

function showHourlyWeather(times, temps, codes, probs) {
    const hourly = document.getElementById('hourly');
    hourly.innerHTML = '';
    const now = new Date();

    function makeContainer(start, end) {
        const container = document.createElement('div');
        container.className = 'hourly-scroll';
        for (let i = start; i < end; i++) {
            const item = document.createElement('div');
            item.className = 'hour-item';
            const t = new Date(times[i]);
            item.innerHTML = `
                <div class="hour-time">${t.getHours()}時</div>
                <div class="hour-icon">${weatherEmoji[codes[i]] || ''}</div>
                <div class="hour-temp">${temps[i]}℃</div>
                <div class="hour-prob">${probs[i] !== undefined ? probs[i] + '%' : ''}</div>
            `;
            if (t < now) item.classList.add('past');
            container.appendChild(item);
        }
        return container;
    }

    hourly.appendChild(makeContainer(0, 24));
    hourly.appendChild(makeContainer(24, 48));
}

function showTomorrowWeather(codeMorning, codeNoon, max, min) {
    const mEmoji = weatherEmoji[codeMorning] || '';
    const nEmoji = weatherEmoji[codeNoon] || '';
    document.getElementById('tomorrow-morning').innerHTML = `<span class="emoji">${mEmoji}</span>午前：${weatherCodes[codeMorning] || '不明'}`;
    document.getElementById('tomorrow-afternoon').innerHTML = `<span class="emoji">${nEmoji}</span>午後：${weatherCodes[codeNoon] || '不明'}`;
    document.getElementById('tomorrow-highlow').textContent = `最高${max}℃ / 最低${min}℃`;
}

function showWeather(location, codeMorning, codeNoon, max, min, morning, noon) {
    document.getElementById('location').textContent = location ? `${location}の天気` : '今日の天気';
    const mEmoji = weatherEmoji[codeMorning] || '';
    const nEmoji = weatherEmoji[codeNoon] || '';
    document.getElementById('weather-morning').innerHTML = `<span class="emoji">${mEmoji}</span>午前：${weatherCodes[codeMorning] || '不明'}`;
    document.getElementById('weather-afternoon').innerHTML = `<span class="emoji">${nEmoji}</span>午後：${weatherCodes[codeNoon] || '不明'}`;
    document.getElementById('highlow').textContent = `最高${max}℃ / 最低${min}℃`;
    const avg = (max + min) / 2;
    const adviceData = {morning, noon, min, max, codeMorning, codeNoon,
        rain: [51,53,55,61,63,65,80,81,82].includes(codeMorning) || [51,53,55,61,63,65,80,81,82].includes(codeNoon),
        heavyRain: [65,82].includes(codeMorning) || [65,82].includes(codeNoon),
        snow: [71,73,75].includes(codeMorning) || [71,73,75].includes(codeNoon),
        heavySnow: codeMorning === 75 || codeNoon === 75,
        thunder: codeMorning === 95 || codeNoon === 95,
        fog: [45,48].includes(codeMorning) || [45,48].includes(codeNoon)
    };
    document.getElementById('clothing').textContent = `おすすめ服装：${suggestClothing(avg)}`;
    document.getElementById('advice').textContent = `アドバイス：${getAdvice(adviceData)}`;
    document.getElementById('lucky').textContent = `今日のラッキーアイテム：${makeLuckyItem()}`;
}

document.getElementById('locateBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation APIに対応していません');
        return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weathercode,precipitation_probability&timezone=Asia%2FTokyo`).then(res => res.json()),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`).then(res => res.json())
        ])
        .then(([weather, place]) => {
            const hourlyTemps = weather.hourly.temperature_2m.slice(0, 48);
            const codes = weather.hourly.weathercode.slice(0, 48);
            const precs = (weather.hourly.precipitation_probability || []).slice(0, 48);
            const times = weather.hourly.time.slice(0, 48);

            const tempsToday = hourlyTemps.slice(0, 24);
            const max = weather.daily.temperature_2m_max[0];
            const min = weather.daily.temperature_2m_min[0];
            const maxT = weather.daily.temperature_2m_max[1];
            const minT = weather.daily.temperature_2m_min[1];

            const morning = (tempsToday[6] + tempsToday[7] + tempsToday[8]) / 3;
            const noon = (tempsToday[12] + tempsToday[13] + tempsToday[14]) / 3;
            const codeMorning = codes[9];
            const codeNoon = codes[15];

            const codeMorningT = codes[24 + 9];
            const codeNoonT = codes[24 + 15];

            const location = (place.address.state || '') + (place.address.city || place.address.town || place.address.village || '');
            showWeather(location, codeMorning, codeNoon, max, min, morning, noon);
            showTomorrowWeather(codeMorningT, codeNoonT, maxT, minT);
            showHourlyWeather(times, hourlyTemps, codes, precs);
        })
        .catch(() => alert('天気情報の取得に失敗しました'));
    }, () => {
        alert('位置情報を取得できませんでした');
    });
});
