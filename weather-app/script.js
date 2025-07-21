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

function getAdvice(min, max, morning, noon) {
    const diff = max - min;
    if (morning !== undefined && noon !== undefined) {
        if (morning <= 15 && noon >= 25) {
            return '朝は肌寒く昼は暑くなりそう。羽織れる一枚を持って出かけよう';
        }
    }
    if (diff >= 8 && min < 15 && max >= 25) {
        return '朝晩は肌寒く昼は暑くなりそう。羽織れる一枚があると◎';
    }
    if (diff >= 8) {
        return '寒暖差が大きい一日。調節しやすい服装を心掛けて';
    }
    if (max >= 28) {
        return '日中はかなり暑くなりそう。こまめな水分補給を';
    }
    if (max <= 10) {
        return '終日冷え込みます。暖かい服装で出かけましょう';
    }
    return '比較的穏やかな気候になりそうです';
}

function showWeather(temp, code, max, min, morning, noon) {
    const emoji = weatherEmoji[code] || '';
    document.getElementById('weather').textContent = `${emoji} 気温：${temp}℃　天気：${weatherCodes[code] || '不明'} (最高${max}℃ / 最低${min}℃)`;
    document.getElementById('clothing').textContent = `おすすめ服装：${suggestClothing(temp)}`;
    document.getElementById('advice').textContent = `アドバイス：${getAdvice(min, max, morning, noon)}`;
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
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m&timezone=Asia%2FTokyo`)
            .then(res => res.json())
            .then(data => {
                const w = data.current_weather;
                const max = data.daily.temperature_2m_max[0];
                const min = data.daily.temperature_2m_min[0];
                const temps = data.hourly.temperature_2m.slice(0, 24);
                const morning = (temps[6] + temps[7] + temps[8]) / 3;
                const noon = (temps[12] + temps[13] + temps[14]) / 3;
                showWeather(w.temperature, w.weathercode, max, min, morning, noon);
            })
            .catch(() => alert('天気情報の取得に失敗しました'));
    }, () => {
        alert('位置情報を取得できませんでした');
    });
});
