/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V3.2 - MASTER (UPDATED)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp, get, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- ENPÒTE MODIL YO ---
import { activateDynamicHeader } from './header-manager.js';

// I. KONFIGIRASYON FIREBASE
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

// --- II. SISTÈM NOTIFIKASYON (KLÒCH) ---
let tabKouran = 'koneksyon'; 

window.voyeNotifikasyon = async (uid, tit, mesaj) => {
    const path = tit.toLowerCase().includes('konekte') || tit.toLowerCase().includes('byenveni') ? 'koneksyon' : 'transak';
    const notifRef = push(ref(db, `users/${uid}/notifications/${path}`));
    await set(notifRef, {
        title: tit,
        msg: mesaj,
        timestamp: Date.now(),
        read: false
    });
};

window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');

window.switchNotifTab = (tabName) => {
    tabKouran = tabName === 'koneksyon' ? 'koneksyon' : 'transak';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName === 'koneksyon' ? 'tab-koneksyon' : 'tab-transak')?.classList.add('active');
    chajeNotifikasyonUI();
};

function chajeNotifikasyonUI() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    onValue(ref(db, `users/${uid}/notifications/${tabKouran}`), (snap) => {
        const container = document.getElementById('notif-content');
        const badge = document.getElementById('notif-badge');
        const data = snap.val();
        
        if (!data) {
            if(container) container.innerHTML = `<p class="empty-msg">Pa gen mesaj nan ${tabKouran}.</p>`;
            if(badge) badge.classList.add('hidden');
            return;
        }

        const notifList = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        const unread = notifList.filter(n => n.read === false).length;
        
        if (badge) {
            badge.innerText = unread;
            badge.classList.toggle('hidden', unread === 0);
        }

        const icon = tabKouran === 'koneksyon' ? 'fa-shield-check' : 'fa-receipt';
        if(container) {
            container.innerHTML = notifList.map(n => `
                <div class="notif-item">
                    <i class="fa ${icon}"></i>
                    <div class="notif-info">
                        <b>${n.title || (tabKouran === 'koneksyon' ? 'Sekirite' : 'Tranzaksyon')}</b>
                        <p>${n.msg}</p>
                        <small>${new Date(n.timestamp).toLocaleString('fr-FR')}</small>
                    </div>
                </div>`).join('');
        }
    });
}

// --- III. OTANTIFIKASYON ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((u) => window.voyeNotifikasyon(u.user.uid, "Bon retou!", "Ou konekte ak siksè."))
        .catch(() => alert("Email oswa Modpas pa bon."));
};

window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const sponsor = document.getElementById('sponsor-input')?.value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) return alert("Modpas la dwe gen 6 karaktè ak yon Majiskil.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000); 

        await set(ref(db, `users/${uid}`), {
            fullname: name, email: email, phone: phone, arsID: arsID,
            balance: 0.00, status: "active", sponsor_id: sponsor || null,
            bonus_claimed: false, createdAt: serverTimestamp()
        });
        await set(ref(db, `ars_mapping/${arsID}`), { uid: uid });
        window.voyeNotifikasyon(uid, "Byenveni!", `Kòd ARS ou se ${arsID}.`);
    } catch (err) { alert(err.message); }
};

// --- IV. NAVIGASYON & LISTENERS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        loadUserData(user.uid);
        chajeNotifikasyonUI();
        activateDynamicHeader(user.uid, db);

        // 1. Lanse Lojik Parennaj
        if (window.initReferralDashboard) {
            window.initReferralDashboard(user.uid);
        }

        // 2. Lanse Lojik Paramètres (NEW)
        if (window.initSettings) {
            window.initSettings(user.uid);
        }
        
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
        
        const balEl = document.getElementById('user-balance');
        if(balEl) balEl.innerText = (data.balance || 0).toFixed(2);
        
        document.getElementById('side-name').innerText = data.fullname || "...";
        document.getElementById('side-id').innerText = data.arsID || "---";
        document.getElementById('side-email').innerText = data.email ? data.email.replace(/(.{3})(.*)(?=@)/, "$1***") : "...";
        
        const refInput = document.getElementById('my-ref-code');
        if (refInput && data.arsID) refInput.value = data.arsID;
    });
}

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

window.showPage = (pageId, navElement) => {
    // Te ajoute 'paj-parametre' nan lis sa a
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    
    if (pageId === 'paj-parennaj') {
        const sideID = document.getElementById('side-id').innerText;
        const refInput = document.getElementById('my-ref-code');
        if (refInput && sideID !== "---") refInput.value = sideID;
    }

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    
    // Fèmen sidebar si se sou mobil li ye
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- V. LOJIK ECHANJ ---
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (" + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");
    const transID = "ECH-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid, type: "Echanj", rezo, amount: parseFloat(montan), status: "En attente", timestamp: serverTimestamp()
    });
    window.voyeNotifikasyon(auth.currentUser.uid, "Tranzaksyon", `Echanj ${montan} HTG ap tann validasyon.`);
    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');
       
