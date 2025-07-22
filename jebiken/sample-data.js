// テスト用のサンプルデータ生成
function generateSampleData() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 今月の1日から今日までのサンプル勤怠データを生成
    for (let day = 1; day <= today.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // 平日のみ勤怠データを生成
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            const sampleAttendance = {
                startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0).toISOString(),
                breakStartTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0).toISOString(),
                breakEndTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 0, 0).toISOString(),
                endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0).toISOString(),
                location: {
                    lat: 35.6812 + (Math.random() - 0.5) * 0.01,
                    lng: 139.7671 + (Math.random() - 0.5) * 0.01,
                    status: 'success',
                    message: 'GPS位置情報取得成功'
                }
            };
            
            localStorage.setItem(`attendance_${dateStr}`, JSON.stringify(sampleAttendance));
        }
    }
    
    console.log('サンプルデータを生成しました:', today.getDate(), '日分');
}

// 管理者ダッシュボードにテスト用ボタンを追加
function addTestButton() {
    const reportsTab = document.getElementById('reports');
    if (reportsTab) {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 テスト用サンプルデータ生成';
        testButton.className = 'admin-btn';
        testButton.style.marginRight = '10px';
        testButton.onclick = function() {
            generateSampleData();
            alert('今月のサンプル勤怠データを生成しました！CSV出力をテストできます。');
        };
        
        const exportButton = reportsTab.querySelector('button[onclick="exportCSV()"]');
        if (exportButton) {
            exportButton.parentNode.insertBefore(testButton, exportButton);
        }
    }
}

// ページ読み込み時にテストボタンを追加
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestButton);
} else {
    addTestButton();
}

export { generateSampleData };