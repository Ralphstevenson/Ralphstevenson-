import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. KONFIGIRASYON FIREBASE
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
// 2. GESTYON KONEKSYON (AUTH)
// ==========================================
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user && user.emailVerified) {
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // Deklanche Istorik la
        setupHistoryListener(user.uid);

        // Koute done itilizatè a (Balans, Non, ID)
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
// 3. LOJIK ECHANJ (DIALER + FIREBASE)
// ==========================================
window.openDialer = function(rezo) {
    let montan = prompt("Konbe Gdes w ap voye?");
    if (!montan || isNaN(montan) || montan < 10) return alert("Montan an pa valid.");

    let resevwa = (montan * 0.835).toFixed(2);
    
    if(confirm(`W ap voye ${montan} HTG.\nW ap resevwa ${resevwa} HTG sou balans ou.`)) {
        // Ouvri telefòn
        let code = (rezo === 'natcom') ? `*123*88888888*32160708*${montan}%23` : `*128*50947111123*${montan}%23`;
        window.location.href = "tel:" + code;

        // Sove nan Istorik Firebase
        const transID = "ECHANJ-" + Date.now();
        set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            type: "Echanj",
            rezo: rezo,
            montan: parseFloat(montan),
            status: "En attente",
            timestamp: serverTimestamp()
        });
    }
};

// ==========================================
// 4. GESTYON ISTORIK (REAL-TIME)
// ==========================================
function setupHistoryListener(uid) {
    const transRef = ref(db, 'transactions');
    onValue(transRef, (snapshot) => {
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
}

function renderHistoryList(list) {
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = list.length === 0 ? 
        "<div style='text-align:center; padding:20px; color:#999;'>Poko gen aktivite</div>" : "";
    
    list.forEach(tr => {
        const statusClass = (tr.status || "en-attente").toLowerCase().replace(/\s+/g, '-');
        listContainer.innerHTML += `
            <div class="trans-card" style="border-left: 5px solid var(--primary-blue); margin-bottom:12px; padding:15px; background:white; border-radius:15px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                <div>
                    <b style="font-size:15px;">${tr.type}</b><br>
                    <small style="color:#6b778c;">${tr.rezo || tr.method || "Sistèm"}</small><br>
                    <span class="status-badge status-${statusClass}" style="font-size:10px; padding:2px 8px; border-radius:6px;">${tr.status}</span>
                </div>
                <div style="text-align:right;">
                    <b style="color:var(--primary-blue); font-size:16px;">${(tr.montan || tr.amount || 0).toFixed(2)} HTG</b>
                </div>
            </div>`;
    });
}

// Filtre bouton yo
window.filterHistory = function(kategori, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    let filtered = [];
    if (kategori === 'tout') filtered = cacheTransactions;
    else if (kategori === 'Succès') filtered = cacheTransactions.filter(t => t.status === 'Succès' || t.status === 'Valide');
    else if (kategori === 'Anulé') filtered = cacheTransactions.filter(t => t.status === 'Anulé' || t.status === 'Echoué');
    else filtered = cacheTransactions.filter(t => t.type === kategori);

    renderHistoryList(filtered);
};

// ==========================================
// 5. RETRÈ & NAVIGASYON
// ==========================================
window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};

window.openRetreConfirm = () => {
    const amt = parseFloat(document.getElementById('retre-amount').value);
    if(!amt || amt < 50) return alert("Minimòm retrè se 50 HTG");
    if(amt > userData.balance) return alert("Balans ou pa ase!");
    
    document.getElementById('retre-preview-data').innerHTML = `Montan: ${amt} HTG<br>Metòd: ${document.getElementById('retre-method').value}`;
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

window.submitRetre = async () => {
    const amt = parseFloat(document.getElementById('retre-amount').value);
    const method = document.getElementById('retre-method').value;
    const transID = "RETRE-" + Date.now();

    try {
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            type: "Retrè",
            method: method,
            amount: amt,
            status: "En attente",
            timestamp: serverTimestamp()
        });
        await update(ref(db, `users/${auth.currentUser.uid}`), { balance: userData.balance - amt });
        document.getElementById('modal-confirm-retre').classList.add('hidden');
        alert("Demann retrè voye ak siksè!");
    } catch(e) { alert("Erè: " + e.message); }
};

// Fonksyon Login/Signup debaz
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch(e) { alert("Email oswa Modpas enkòrèk!"); }
};

window.handleLogout = () => signOut(auth);
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active-sidebar');
window.closeRetreConfirm = () => document.getElementById('modal-confirm-retre').classList.add('hidden');
                
