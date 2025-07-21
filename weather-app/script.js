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

const prefixes = ['竜の', '幻の', '雲海の', '星降る', '黒曜の'];
const cores = ['首の玉', '子安貝', '風の羽', '涙の雫', '夢の繭'];
const suffixes = ['・火炎', '・刻印', '・加護', '', ''];

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

function showWeather(temp, code) {
    document.getElementById('weather').textContent = `気温：${temp}℃　天気：${weatherCodes[code] || '不明'}`;
    document.getElementById('clothing').textContent = `おすすめ服装：${suggestClothing(temp)}`;
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
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
            .then(res => res.json())
            .then(data => {
                const w = data.current_weather;
                showWeather(w.temperature, w.weathercode);
            })
            .catch(() => alert('天気情報の取得に失敗しました'));
    }, () => {
        alert('位置情報を取得できませんでした');
    });
});
