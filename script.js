import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
    authDomain: "echanj-plus-778cd.firebaseapp.com",
    databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
    projectId: "echanj-plus-778cd",
    storageBucket: "echanj-plus-778cd.firebasestorage.app",
    messagingSenderId: "111144762929",
    appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let userData = null;
let cacheTransactions = [];

// ==========================================
// MONITORING KONEKSYON (DEKLANCHE ISTORIK)
// ==========================================
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user && user.emailVerified) {
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // DEKLANCHE LEKTI ISTORIK LA TOUSWIT
        setupHistoryListener(user.uid);

        onValue(ref(db, `users/${user.uid}`), (snap) => {
            userData = snap.val();
            if (userData) {
                document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
                document.getElementById('side-name').innerText = userData.fullname;
                document.getElementById('side-id').innerText = userData.arsID;
            }
        });
    } else {
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// ==========================================
// GESTYON ISTORIK (CORRECTED)
// ==========================================
window.setupHistoryListener = function(uid) {
    onValue(ref(db, 'transactions'), (snapshot) => {
        const data = snapshot.val();
        cacheTransactions = [];
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].uid === uid) {
                    cacheTransactions.push({ id: key, ...data[key] });
                }
            });
            cacheTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        renderHistoryList(cacheTransactions);
    });
};

function renderHistoryList(list) {
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;
    listContainer.innerHTML = list.length === 0 ? "<p style='text-align:center; padding:20px;'>Poko gen aktivite</p>" : "";
    
    list.forEach(tr => {
        const statusClass = (tr.status || "en-attente").toLowerCase().replace(" ", "-");
        listContainer.innerHTML += `
            <div class="trans-card">
                <div>
                    <b>${tr.type}</b><br><small>${tr.method || tr.rezo}</small>
                    <br><span class="status-badge status-${statusClass}">${tr.status}</span>
                </div>
                <div style="text-align:right">
                    <b style="color:#0052cc">${(tr.amount || tr.montan || 0).toFixed(2)} HTG</b>
                </div>
            </div>`;
    });
}

window.filterHistory = (cat, btn) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    let filtered = cat === 'tout' ? cacheTransactions : cacheTransactions.filter(t => t.type === cat || t.status === cat);
    renderHistoryList(filtered);
};

// ==========================================
// NAVIGASYON & RETRÈ
// ==========================================
window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};

window.openRetreConfirm = () => {
    const amt = parseFloat(document.getElementById('retre-amount').value);
    if(amt > userData.balance) return alert("Balans ou pa ase!");
    document.getElementById('retre-preview-data').innerHTML = `Retrè: ${amt} HTG`;
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

window.closeRetreConfirm = () => document.getElementById('modal-confirm-retre').classList.add('hidden');

window.submitRetre = async () => {
    const amt = parseFloat(document.getElementById('retre-amount').value);
    const transID = "RET-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid,
        type: "Retrè",
        amount: amt,
        status: "En attente",
        timestamp: serverTimestamp()
    });
    await update(ref(db, `users/${auth.currentUser.uid}`), { balance: userData.balance - amt });
    closeRetreConfirm();
    alert("Demann voye!");
};

// Fonksyon Login/Signup (kenbe sa ou te genyen yo...)
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch(e) { alert("Erè!"); }
};
window.toggleAuth = (type) => {
    document.getElementById('login-section').classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', type === 'login');
};
window.handleLogout = () => signOut(auth);
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active-sidebar');
