import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// I. KONFIGIRASYON (Lojik 1)
const firebaseConfig = {
    apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
    authDomain: "echanj-plus-778cd.firebaseapp.com",
    databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
    projectId: "echanj-plus-778cd",
    storageBucket: "echanj-plus-778cd.firebasestorage.app",
    messagingSenderId: "111144762929",
    appId: "1:111144762929:web:e64ce9a6da65781c289f10",
    measurementId: "G-J1BQRF32ZW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// ==========================================
// II. OTANTIFIKASYON (Lojik 2-9)
// ==========================================

// Login
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout chan yo!");

    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè: Email oswa Modpas pa bon."));
};

// Signup
window.handleSignup = () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) {
        return alert("Modpas la dwe gen 6 karaktè ak yon Majiskil (Lojik 2).");
    }

    createUserWithEmailAndPassword(auth, email, pass).then((userCredential) => {
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000); // Lojik 7
        set(ref(db, `users/${uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0.00,
            status: "active",
            createdAt: serverTimestamp()
        });
    }).catch(err => alert(err.message));
};

// Logout
window.handleLogout = () => signOut(auth);

// ==========================================
// III. NAVIGASYON (5 Seksyon)
// ==========================================

window.showPage = (pageId, navElement) => {
    // Kache tout seksyon
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Montre paj la
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // Navbar active state
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');

    if (pageId === 'paj-akey') startCarousel();
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active');
};

// ==========================================
// IV. LOJIK SISTÈM (Balans, Istorik, Echanj)
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        loadUserData(user.uid);
        loadTransactions(user.uid);
        
        // Deklanche Chat (Lojik 25)
        if (window.listenToMessages) window.listenToMessages(user.uid);
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function loadUserData(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Lojik 10: Balans reyèl
        document.getElementById('user-balance').innerText = data.balance.toFixed(2);
        document.getElementById('side-name').innerText = data.fullname;
        document.getElementById('side-id').innerText = data.arsID;
        // Lojik 6: Maskay email
        document.getElementById('side-email').innerText = data.email.replace(/(.{3})(.*)(?=@)/, "$1***");
    });
}

// Lojik 17: Istorik ak Koulè
function loadTransactions(uid) {
    onValue(ref(db, `transactions`), (snap) => {
        const list = document.getElementById('transaction-list');
        if (!list) return;
        list.innerHTML = "";
        
        const data = snap.val();
        if (data) {
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp); // Lojik 23: LIFO

            myTrans.forEach(t => {
                const statusClass = `status-${t.status.toLowerCase().replace(" ", "-")}`;
                list.innerHTML += `
                    <div class="transaction-item" style="border-left: 5px solid var(--${t.status === 'Validé' ? 'success' : (t.status === 'Refusé' ? 'danger' : 'warning')})">
                        <div><b>${t.type} ${t.rezo || ''}</b><br><small>${new Date(t.timestamp).toLocaleString()}</small></div>
                        <div style="text-align:right"><b>${t.amount} HTG</b><br><span class="status-badge ${statusClass}">${t.status}</span></div>
                    </div>`;
            });
        }
    });
}

// Lojik 13 & 16: Echanj Sekirize
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (Minit " + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");

    const transID = "ECH-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid,
        type: "Echanj",
        rezo: rezo,
        amount: montan,
        status: "En attente",
        timestamp: serverTimestamp()
    });

    const ussd = rezo === 'digicel' ? `*126*1001*${montan}#` : `*202*501*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

// ==========================================
// V. UI AUTOMATION (Lojik 28-29)
// ==========================================

let slideIndex = 0;
function startCarousel() {
    const slides = document.querySelector('.slides');
    if (!slides) return;
    setInterval(() => {
        slideIndex = (slideIndex + 1) % 5;
        slides.style.transform = `translateX(-${slideIndex * 100}%)`;
    }, 4000);
}

// Night Mode (6h PM)
if (new Date().getHours() >= 18 || new Date().getHours() < 6) {
    document.body.classList.add('night-mode');
         }
