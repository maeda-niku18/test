// Firebase設定とアプリクラス
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBKhb3ctxhr-KT_4z32Iyfjo_tOc7LpImA",
    authDomain: "auth-test-ba58c.firebaseapp.com",
    projectId: "auth-test-ba58c",
    storageBucket: "auth-test-ba58c.firebasestorage.app",
    messagingSenderId: "856692946306",
    appId: "1:856692946306:web:d8cbddf97686f542bd0b9b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class JebikenApp {
    constructor() {
        this.currentUser = null;
        this.db = db;
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
            // 管理者を強制的に再作成（既存データを上書き）
            const encryptedPassword = await this.sha256('123');
            await setDoc(doc(this.db, 'users', 'admin'), {
                name: '太郎',
                email: 'aaa@bbb.com',
                password: encryptedPassword,
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            console.log('デフォルト管理者を作成/更新しました');
        } catch (error) {
            console.error('管理者初期化エラー:', error);
        }
    }

    async login(email, password) {
        try {
            const encryptedPassword = await this.sha256(password);
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('email', '==', email), where('password', '==', encryptedPassword));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    this.currentUser = { id: doc.id, ...doc.data() };
                });
                
                // ログイン情報をセッションストレージに保存
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return this.currentUser;
            }
            return null;
        } catch (error) {
            console.error('ログインエラー:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            // バリデーション
            if (!userData.name || !userData.email || !userData.password) {
                throw new Error('名前、メールアドレス、パスワードは必須です');
            }
            
            console.log('ユーザー作成データ:', userData);
            
            const encryptedPassword = await this.sha256(userData.password);
            const userId = userData.email.replace(/[@.]/g, '_');
            
            const userDoc = {
                name: userData.name,
                email: userData.email,
                password: encryptedPassword,
                role: userData.role || 'user',
                createdAt: new Date().toISOString()
            };
            
            console.log('Firestore保存データ:', userDoc);
            console.log('ユーザーID:', userId);
            
            await setDoc(doc(this.db, 'users', userId), userDoc);

            return { success: true, userId };
        } catch (error) {
            console.error('ユーザー作成エラー:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const usersRef = collection(this.db, 'users');
            const querySnapshot = await getDocs(usersRef);
            
            const users = [];
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    createdAt: userData.createdAt
                });
            });
            
            return users;
        } catch (error) {
            console.error('ユーザー取得エラー:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            await deleteDoc(doc(this.db, 'users', userId));
            return { success: true };
        } catch (error) {
            console.error('ユーザー削除エラー:', error);
            throw error;
        }
    }

    async submitLeaveRequest(date, reason) {
        try {
            if (!this.currentUser) throw new Error('ログインが必要です');
            
            await addDoc(collection(this.db, 'paidLeaves', this.currentUser.id, 'requests'), {
                date: date,
                reason: reason,
                approved: false,
                requestedAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('有給申請エラー:', error);
            throw error;
        }
    }

    async getLeaveRequests(userId = null) {
        try {
            if (userId) {
                // 特定ユーザーの申請を取得
                const requestsRef = collection(this.db, 'paidLeaves', userId, 'requests');
                const querySnapshot = await getDocs(query(requestsRef, orderBy('requestedAt', 'desc')));
                
                const requests = [];
                querySnapshot.forEach((doc) => {
                    requests.push({
                        id: doc.id,
                        userId: userId,
                        ...doc.data()
                    });
                });
                
                return requests;
            } else {
                // 全ユーザーの申請を取得（管理者用）
                const usersRef = collection(this.db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                
                let allRequests = [];
                
                for (const userDoc of usersSnapshot.docs) {
                    if (userDoc.data().role === 'user') {
                        const requestsRef = collection(this.db, 'paidLeaves', userDoc.id, 'requests');
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
                
                return allRequests;
            }
        } catch (error) {
            console.error('有給申請取得エラー:', error);
            throw error;
        }
    }

    async approveLeaveRequest(userId, requestId) {
        try {
            const requestRef = doc(this.db, 'paidLeaves', userId, 'requests', requestId);
            await updateDoc(requestRef, {
                approved: true,
                approvedAt: new Date().toISOString(),
                approvedBy: this.currentUser.id
            });

            return { success: true };
        } catch (error) {
            console.error('承認エラー:', error);
            throw error;
        }
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        
        return null;
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    requireAdmin() {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

export { JebikenApp };