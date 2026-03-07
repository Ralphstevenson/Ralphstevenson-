import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
// 2. OTANTIFIKASYON & DONE
// ==========================================
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');
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
// 3. RETRÈ KORÈKTEMAN ARANJE
// ==========================================
window.openRetreConfirm = function() {
    // Nou rale ID yo egzakteman jan yo ye nan HTML ou a
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    if (!non || !tel || isNaN(montan) || montan < 100) {
        return alert("Tanpri ranpli tout chan yo (Minimòm 100 HTG)");
    }

    if (montan > userData.balance) {
        return alert("Balans ou pa ase pou fè retrè sa a!");
    }

    // Afiche preview nan modal la
    document.getElementById('retre-preview-data').innerHTML = `
        <div class="detail-row"><span>Non:</span> <span>${non}</span></div>
        <div class="detail-row"><span>Telefòn:</span> <span>${tel}</span></div>
        <div class="detail-row"><span>Metòd:</span> <span>${metod}</span></div>
        <div class="detail-row"><span>Montan:</span> <span>${montan.toFixed(2)} HTG</span></div>
    `;
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

window.submitRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    const transID = "RET-" + Date.now();
    try {
        // 1. Sove tranzaksyon an
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            type: "Retrè",
            method: metod,
            amount: montan,
            receiver: non,
            phone: tel,
            status: "En attente",
            timestamp: serverTimestamp()
        });

        // 2. Retire kòb la sou balans lan
        await update(ref(db, `users/${auth.currentUser.uid}`), {
            balance: userData.balance - montan
        });

        alert("Demann retrè ou voye ak siksè!");
        window.closeRetreConfirm();
        showPage('paj-akey');
    } catch (e) {
        alert("Erè: " + e.message);
    }
};

// ==========================================
// 4. TABLO ISTORIK PWOFESYONÈL
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
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;

    if (list.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">Poko gen tranzaksyon</div>`;
        return;
    }

    let tableHTML = `
        <div class="history-table-wrapper">
            <table class="history-table" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f8f9fa; border-bottom:1px solid #eee;">
                        <th style="padding:12px; text-align:left; font-size:12px;">TIP / DAT</th>
                        <th style="padding:12px; text-align:right; font-size:12px;">MONTAN</th>
                        <th style="padding:12px; text-align:center; font-size:12px;">STATUS</th>
                    </tr>
                </thead>
                <tbody>`;

    list.forEach(tr => {
        const statusClass = (tr.status || "en-attente").toLowerCase().replace(/\s+/g, '-');
        const dat = tr.timestamp ? new Date(tr.timestamp).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : '---';
        
        tableHTML += `
            <tr style="border-bottom:1px solid #f1f1f1;">
                <td style="padding:12px;">
                    <div style="font-weight:600; font-size:14px;">${tr.type}</div>
                    <div style="font-size:11px; color:#999;">${dat} • ${tr.method || tr.rezo || ''}</div>
                </td>
                <td style="padding:12px; text-align:right; font-weight:700; color:var(--primary-blue);">
                    ${(tr.amount || tr.montan || 0).toFixed(2)}
                </td>
                <td style="padding:12px; text-align:center;">
                    <span class="status-badge status-${statusClass}">${tr.status}</span>
                </td>
            </tr>`;
    });

    tableHTML += `</tbody></table></div>`;
    listContainer.innerHTML = tableHTML;
}

// ==========================================
// 5. CAROUSEL OTOMATIK (FIXED)
// ==========================================
let currentSlide = 0;
function runCarousel() {
    const slider = document.getElementById('carousel-slider');
    const slides = document.querySelectorAll('#carousel-slider .slide');
    if (!slider || slides.length === 0) return;

    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        slider.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }, 3500);
}
document.addEventListener('DOMContentLoaded', runCarousel);

// Fonksyon Navigasyon
window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};

window.closeRetreConfirm = () => document.getElementById('modal-confirm-retre').classList.add('hidden');
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active-sidebar');
window.handleLogout = () => signOut(auth);
