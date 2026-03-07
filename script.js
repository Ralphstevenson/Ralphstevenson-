import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CONFIGURATION FIREBASE
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
// 2. OTANTIFIKASYON & CAROUSEL
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        setupHistoryListener(user.uid);
        
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            userData = snap.val();
            if (userData) {
                document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
                document.getElementById('side-name').innerText = userData.fullname;
                document.getElementById('side-id').innerText = userData.arsID;
            }
        });
        startCarousel(); // Lanse carousel la
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function startCarousel() {
    const slider = document.querySelector(".slides"); // Match ak HTML ou
    const slides = document.querySelectorAll(".slide");
    if (!slider || slides.length === 0) return;

    let index = 0;
    setInterval(() => {
        index = (index + 1) % slides.length;
        slider.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        slider.style.transform = `translateX(-${index * 100}%)`;
    }, 3500);
}

// ==========================================
// 3. RETRÈ (ID YO KORİJE)
// ==========================================
window.openRetreConfirm = function() {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const method = document.getElementById('retre-method').value;
    const phone = document.getElementById('retre-phone').value;
    const name = document.getElementById('retre-name').value;

    if (!amount || amount < 100 || !phone || !name) return alert("Ranpli tout chan yo kòrèkteman.");
    if (amount > userData.balance) return alert("Balans ou pa ase!");

    document.getElementById('retre-preview-data').innerHTML = `
        <div style="text-align:left; font-size:14px;">
            <p><strong>Metòd:</strong> ${method}</p>
            <p><strong>Telefòn:</strong> ${phone}</p>
            <p><strong>Montan:</strong> ${amount.toFixed(2)} HTG</p>
        </div>`;
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

window.submitRetre = async () => {
    const amount = parseFloat(document.getElementById('retre-amount').value);
    const transID = "RET-" + Date.now();
    
    try {
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            type: "Retrè",
            amount: amount,
            status: "En attente",
            timestamp: serverTimestamp()
        });
        await update(ref(db, `users/${auth.currentUser.uid}`), { balance: userData.balance - amount });
        alert("Retrè voye!");
        window.closeRetreConfirm();
    } catch (e) { alert("Erè!"); }
};

// ==========================================
// 4. TABLO ISTORIK (DESIGN PWOFESYONÈL)
// ==========================================
function setupHistoryListener(uid) {
    onValue(ref(db, 'transactions'), (snapshot) => {
        const data = snapshot.val();
        cacheTransactions = [];
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].uid === uid) cacheTransactions.push({ id: key, ...data[key] });
            });
            cacheTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        renderHistoryList(cacheTransactions);
    });
}

function renderHistoryList(list) {
    const container = document.getElementById('transaction-list');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<div style="padding:40px; text-align:center; color:#999;">Okenn tranzaksyon.</div>`;
        return;
    }

    let html = `<div class="history-table-wrapper"><table class="history-table">
        <thead><tr><th>Dat / Tip</th><th>Montan</th><th>Status</th></tr></thead><tbody>`;

    list.forEach(tr => {
        const sClass = (tr.status || "en-attente").toLowerCase().replace(/\s+/g, '-');
        const dat = tr.timestamp ? new Date(tr.timestamp).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : '---';
        html += `<tr>
            <td><strong>${tr.type}</strong><br><small style="color:#999">${dat}</small></td>
            <td style="color:var(--primary-blue); font-weight:bold;">${(tr.amount || tr.montan || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${sClass}">${tr.status}</span></td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// Navigasyon & Lòt
window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};
window.closeRetreConfirm = () => document.getElementById('modal-confirm-retre').classList.add('hidden');
window.handleLogout = () => signOut(auth);
