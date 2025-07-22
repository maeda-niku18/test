import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

class JebikenApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.initializeDefaultAdmin();
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async initializeDefaultAdmin() {
        try {
            const adminDoc = await getDoc(doc(db, 'users', 'admin'));
            if (!adminDoc.exists()) {
                const encryptedPassword = await this.sha256('123');
                await setDoc(doc(db, 'users', 'admin'), {
                    name: '太郎',
                    email: 'abc',
                    role: 'admin',
                    encryptedPassword: encryptedPassword
                });
                console.log('デフォルト管理者を作成しました');
            }
        } catch (error) {
            console.error('管理者初期化エラー:', error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const encryptedPassword = await this.sha256(password);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), where('encryptedPassword', '==', encryptedPassword));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    this.currentUser = { id: doc.id, ...doc.data() };
                });
                this.showDashboard();
            } else {
                this.showError('メールアドレスまたはパスワードが間違っています');
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            this.showError('ログインエラーが発生しました');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showDashboard() {
        document.body.innerHTML = `
            <div class="container">
                <div class="dashboard">
                    <h2>ジェビケン ダッシュボード</h2>
                    <div class="user-info">
                        <p><strong>ユーザー:</strong> ${this.currentUser.name} (${this.currentUser.role === 'admin' ? '管理者' : '一般ユーザー'})</p>
                        <p><strong>メール:</strong> ${this.currentUser.email}</p>
                    </div>

                    ${this.currentUser.role === 'user' ? this.renderUserDashboard() : ''}
                    ${this.currentUser.role === 'admin' ? this.renderAdminDashboard() : ''}

                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">ログアウト</button>
                </div>
            </div>
        `;
        this.setupDashboardEventListeners();
    }

    renderUserDashboard() {
        return `
            <div class="attendance-section">
                <h3>勤怠管理</h3>
                <div class="attendance-buttons">
                    <button class="attendance-btn start-work" onclick="app.recordAttendance('start')">出勤</button>
                    <button class="attendance-btn break-start" onclick="app.recordAttendance('breakStart')">休憩開始</button>
                    <button class="attendance-btn break-end" onclick="app.recordAttendance('breakEnd')">休憩終了</button>
                    <button class="attendance-btn end-work" onclick="app.recordAttendance('end')">退勤</button>
                </div>
                <div id="attendance-status"></div>
            </div>

            <div class="paid-leave-section" style="margin-top: 30px;">
                <h3>有給申請</h3>
                <div style="margin-bottom: 15px;">
                    <input type="date" id="leaveDate" style="margin-right: 10px;">
                    <input type="text" id="leaveReason" placeholder="理由" style="margin-right: 10px;">
                    <button onclick="app.requestPaidLeave()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 3px;">申請</button>
                </div>
                <div id="leave-requests"></div>
            </div>
        `;
    }

    renderAdminDashboard() {
        return `
            <div class="admin-section">
                <h3>管理者機能</h3>
                <div class="admin-buttons">
                    <button class="admin-btn" onclick="app.showUserManagement()">ユーザー管理</button>
                    <button class="admin-btn" onclick="app.showLeaveApprovals()">有給承認</button>
                    <button class="admin-btn" onclick="app.exportCSV()">CSV出力</button>
                </div>
                <div id="admin-content"></div>
            </div>

            <div class="user-creation" style="margin-top: 30px;">
                <h3>新規ユーザー作成</h3>
                <div style="display: grid; gap: 10px; max-width: 400px;">
                    <input type="text" id="newUserName" placeholder="名前">
                    <input type="email" id="newUserEmail" placeholder="メールアドレス">
                    <input type="password" id="newUserPassword" placeholder="パスワード">
                    <select id="newUserRole">
                        <option value="user">一般ユーザー</option>
                        <option value="admin">管理者</option>
                    </select>
                    <button onclick="app.createUser()" style="padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px;">ユーザー作成</button>
                </div>
            </div>
        `;
    }

    setupDashboardEventListeners() {
        window.app = this;
        if (this.currentUser.role === 'user') {
            this.loadLeaveRequests();
        }
    }

    async recordAttendance(type) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            
            const position = await this.getCurrentPosition();
            
            const attendanceRef = doc(db, 'attendances', this.currentUser.id, 'records', today);
            const attendanceDoc = await getDoc(attendanceRef);
            
            let attendanceData = attendanceDoc.exists() ? attendanceDoc.data() : {};
            
            switch(type) {
                case 'start':
                    attendanceData.startTime = now.toISOString();
                    break;
                case 'breakStart':
                    attendanceData.breakStartTime = now.toISOString();
                    break;
                case 'breakEnd':
                    attendanceData.breakEndTime = now.toISOString();
                    break;
                case 'end':
                    attendanceData.endTime = now.toISOString();
                    break;
            }
            
            attendanceData.location = position;
            
            await setDoc(attendanceRef, attendanceData);
            
            this.showAttendanceStatus(`${this.getAttendanceTypeText(type)}を記録しました`);
        } catch (error) {
            console.error('勤怠記録エラー:', error);
            this.showAttendanceStatus('記録に失敗しました');
        }
    }

    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn('GPS取得失敗:', error);
                        resolve({ lat: 0, lng: 0 });
                    }
                );
            } else {
                resolve({ lat: 0, lng: 0 });
            }
        });
    }

    getAttendanceTypeText(type) {
        const typeMap = {
            'start': '出勤',
            'breakStart': '休憩開始',
            'breakEnd': '休憩終了',
            'end': '退勤'
        };
        return typeMap[type];
    }

    showAttendanceStatus(message) {
        const statusDiv = document.getElementById('attendance-status');
        statusDiv.innerHTML = `<p style="color: green; font-weight: bold;">${message}</p>`;
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    }

    async requestPaidLeave() {
        const date = document.getElementById('leaveDate').value;
        const reason = document.getElementById('leaveReason').value;
        
        if (!date || !reason) {
            alert('日付と理由を入力してください');
            return;
        }

        try {
            await addDoc(collection(db, 'paidLeaves', this.currentUser.id, 'requests'), {
                date: date,
                reason: reason,
                approved: false,
                requestedAt: new Date().toISOString()
            });
            
            document.getElementById('leaveDate').value = '';
            document.getElementById('leaveReason').value = '';
            
            alert('有給申請を送信しました');
            this.loadLeaveRequests();
        } catch (error) {
            console.error('有給申請エラー:', error);
            alert('申請に失敗しました');
        }
    }

    async loadLeaveRequests() {
        try {
            const requestsRef = collection(db, 'paidLeaves', this.currentUser.id, 'requests');
            const querySnapshot = await getDocs(query(requestsRef, orderBy('requestedAt', 'desc')));
            
            let html = '<h4>申請履歴</h4>';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const status = data.approved ? '✅ 承認済み' : '⏳ 未承認';
                html += `<p>${data.date} - ${data.reason} (${status})</p>`;
            });
            
            document.getElementById('leave-requests').innerHTML = html;
        } catch (error) {
            console.error('申請履歴読み込みエラー:', error);
        }
    }

    async createUser() {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;

        if (!name || !email || !password) {
            alert('すべての項目を入力してください');
            return;
        }

        try {
            const encryptedPassword = await this.sha256(password);
            const userId = email.replace('@', '_').replace('.', '_');
            
            await setDoc(doc(db, 'users', userId), {
                name: name,
                email: email,
                role: role,
                encryptedPassword: encryptedPassword
            });

            document.getElementById('newUserName').value = '';
            document.getElementById('newUserEmail').value = '';
            document.getElementById('newUserPassword').value = '';
            
            alert('ユーザーを作成しました');
        } catch (error) {
            console.error('ユーザー作成エラー:', error);
            alert('ユーザー作成に失敗しました');
        }
    }

    async showUserManagement() {
        try {
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            let html = '<h4>ユーザー管理</h4>';
            html += '<div style="max-height: 400px; overflow-y: auto;">';
            
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                const roleText = userData.role === 'admin' ? '管理者' : '一般ユーザー';
                const deleteButton = userDoc.id !== 'admin' ? 
                    `<button onclick="app.deleteUser('${userDoc.id}')" 
                            style="margin-left: 10px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        削除
                    </button>` : '';
                
                html += `
                    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
                        <p><strong>名前:</strong> ${userData.name}</p>
                        <p><strong>メール:</strong> ${userData.email}</p>
                        <p><strong>役割:</strong> ${roleText}</p>
                        <p><strong>ユーザーID:</strong> ${userDoc.id}</p>
                        <div style="margin-top: 10px;">
                            <button onclick="app.showUserEdit('${userDoc.id}')" 
                                    style="padding: 5px 10px; background: #ffc107; color: #333; border: none; border-radius: 3px; cursor: pointer;">
                                編集
                            </button>
                            ${deleteButton}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            document.getElementById('admin-content').innerHTML = html;
        } catch (error) {
            console.error('ユーザー管理読み込みエラー:', error);
            document.getElementById('admin-content').innerHTML = '<p>データの読み込みに失敗しました</p>';
        }
    }

    async showUserEdit(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                alert('ユーザーが見つかりません');
                return;
            }
            
            const userData = userDoc.data();
            
            const html = `
                <h4>ユーザー編集: ${userData.name}</h4>
                <div style="max-width: 400px; display: grid; gap: 10px;">
                    <div>
                        <label>名前:</label>
                        <input type="text" id="editUserName" value="${userData.name}" style="width: 100%; padding: 8px;">
                    </div>
                    <div>
                        <label>メール:</label>
                        <input type="email" id="editUserEmail" value="${userData.email}" style="width: 100%; padding: 8px;">
                    </div>
                    <div>
                        <label>役割:</label>
                        <select id="editUserRole" style="width: 100%; padding: 8px;">
                            <option value="user" ${userData.role === 'user' ? 'selected' : ''}>一般ユーザー</option>
                            <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>管理者</option>
                        </select>
                    </div>
                    <div>
                        <label>新しいパスワード（変更する場合のみ）:</label>
                        <input type="password" id="editUserPassword" placeholder="新しいパスワード" style="width: 100%; padding: 8px;">
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="app.updateUser('${userId}')" 
                                style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            更新
                        </button>
                        <button onclick="app.showUserManagement()" 
                                style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            キャンセル
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('admin-content').innerHTML = html;
        } catch (error) {
            console.error('ユーザー編集画面エラー:', error);
            alert('ユーザー情報の取得に失敗しました');
        }
    }

    async updateUser(userId) {
        try {
            const name = document.getElementById('editUserName').value;
            const email = document.getElementById('editUserEmail').value;
            const role = document.getElementById('editUserRole').value;
            const password = document.getElementById('editUserPassword').value;

            if (!name || !email) {
                alert('名前とメールは必須です');
                return;
            }

            const updateData = {
                name: name,
                email: email,
                role: role
            };

            if (password) {
                updateData.encryptedPassword = await this.sha256(password);
            }

            await updateDoc(doc(db, 'users', userId), updateData);
            
            alert('ユーザー情報を更新しました');
            this.showUserManagement();
        } catch (error) {
            console.error('ユーザー更新エラー:', error);
            alert('更新に失敗しました');
        }
    }

    async deleteUser(userId) {
        if (!confirm('本当にこのユーザーを削除しますか？')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
            alert('ユーザーを削除しました');
            this.showUserManagement();
        } catch (error) {
            console.error('ユーザー削除エラー:', error);
            alert('削除に失敗しました');
        }
    }

    async showLeaveApprovals() {
        try {
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            let allRequests = [];
            
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.data().role === 'user') {
                    const requestsRef = collection(db, 'paidLeaves', userDoc.id, 'requests');
                    const requestsSnapshot = await getDocs(query(requestsRef, orderBy('requestedAt', 'desc')));
                    
                    requestsSnapshot.forEach((reqDoc) => {
                        allRequests.push({
                            id: reqDoc.id,
                            userId: userDoc.id,
                            userName: userDoc.data().name,
                            ...reqDoc.data()
                        });
                    });
                }
            }
            
            let html = '<h4>有給申請一覧</h4>';
            if (allRequests.length === 0) {
                html += '<p>申請はありません</p>';
            } else {
                html += '<div style="max-height: 400px; overflow-y: auto;">';
                allRequests.forEach((request) => {
                    const statusText = request.approved ? '✅ 承認済み' : '⏳ 未承認';
                    const approveButton = request.approved ? '' : 
                        `<button onclick="app.approveLeave('${request.userId}', '${request.id}')" 
                                style="margin-left: 10px; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            承認
                        </button>`;
                    
                    html += `
                        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
                            <p><strong>申請者:</strong> ${request.userName}</p>
                            <p><strong>日付:</strong> ${request.date}</p>
                            <p><strong>理由:</strong> ${request.reason}</p>
                            <p><strong>申請日時:</strong> ${new Date(request.requestedAt).toLocaleString('ja-JP')}</p>
                            <p><strong>状態:</strong> ${statusText} ${approveButton}</p>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            document.getElementById('admin-content').innerHTML = html;
        } catch (error) {
            console.error('有給申請読み込みエラー:', error);
            document.getElementById('admin-content').innerHTML = '<p>データの読み込みに失敗しました</p>';
        }
    }

    async approveLeave(userId, requestId) {
        try {
            const requestRef = doc(db, 'paidLeaves', userId, 'requests', requestId);
            await updateDoc(requestRef, {
                approved: true,
                approvedAt: new Date().toISOString(),
                approvedBy: this.currentUser.id
            });
            
            alert('有給申請を承認しました');
            this.showLeaveApprovals();
        } catch (error) {
            console.error('承認エラー:', error);
            alert('承認に失敗しました');
        }
    }

    exportCSV() {
        const html = `
            <h4>CSV出力</h4>
            <div style="margin: 20px 0;">
                <label for="exportMonth">出力月を選択:</label>
                <input type="month" id="exportMonth" value="${new Date().toISOString().slice(0, 7)}">
                <button onclick="app.generateCSV()" style="margin-left: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    CSV生成
                </button>
            </div>
            <div id="csv-result"></div>
        `;
        document.getElementById('admin-content').innerHTML = html;
    }

    async generateCSV() {
        try {
            const monthInput = document.getElementById('exportMonth').value;
            if (!monthInput) {
                alert('月を選択してください');
                return;
            }

            const [year, month] = monthInput.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            let csvData = 'ユーザー名,メール,日付,出勤時刻,休憩開始,休憩終了,退勤時刻,労働時間,有給\n';
            
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.data().role === 'user') {
                    const userData = userDoc.data();
                    
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        
                        const attendanceRef = doc(db, 'attendances', userDoc.id, 'records', dateStr);
                        const attendanceDoc = await getDoc(attendanceRef);
                        
                        const paidLeaveRef = collection(db, 'paidLeaves', userDoc.id, 'requests');
                        const paidLeaveQuery = query(
                            paidLeaveRef, 
                            where('date', '==', dateStr),
                            where('approved', '==', true)
                        );
                        const paidLeaveSnapshot = await getDocs(paidLeaveQuery);
                        
                        const isPaidLeave = !paidLeaveSnapshot.empty;
                        
                        if (attendanceDoc.exists() || isPaidLeave) {
                            const data = attendanceDoc.exists() ? attendanceDoc.data() : {};
                            
                            const startTime = data.startTime ? new Date(data.startTime).toLocaleTimeString('ja-JP') : '';
                            const breakStart = data.breakStartTime ? new Date(data.breakStartTime).toLocaleTimeString('ja-JP') : '';
                            const breakEnd = data.breakEndTime ? new Date(data.breakEndTime).toLocaleTimeString('ja-JP') : '';
                            const endTime = data.endTime ? new Date(data.endTime).toLocaleTimeString('ja-JP') : '';
                            
                            let workHours = '';
                            if (data.startTime && data.endTime) {
                                const start = new Date(data.startTime);
                                const end = new Date(data.endTime);
                                let workMinutes = (end - start) / (1000 * 60);
                                
                                if (data.breakStartTime && data.breakEndTime) {
                                    const breakStart = new Date(data.breakStartTime);
                                    const breakEnd = new Date(data.breakEndTime);
                                    const breakMinutes = (breakEnd - breakStart) / (1000 * 60);
                                    workMinutes -= breakMinutes;
                                }
                                
                                workHours = `${Math.floor(workMinutes / 60)}:${String(Math.floor(workMinutes % 60)).padStart(2, '0')}`;
                            }
                            
                            const paidLeaveStatus = isPaidLeave ? '有給' : '';
                            
                            csvData += `"${userData.name}","${userData.email}","${dateStr}","${startTime}","${breakStart}","${breakEnd}","${endTime}","${workHours}","${paidLeaveStatus}"\n`;
                        }
                    }
                }
            }
            
            this.downloadCSV(csvData, `jebiken_${monthInput}.csv`);
            document.getElementById('csv-result').innerHTML = '<p style="color: green;">CSVファイルをダウンロードしました</p>';
            
        } catch (error) {
            console.error('CSV生成エラー:', error);
            document.getElementById('csv-result').innerHTML = '<p style="color: red;">CSV生成に失敗しました</p>';
        }
    }

    downloadCSV(csvData, filename) {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

const app = new JebikenApp();