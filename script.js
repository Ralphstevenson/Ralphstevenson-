/* ============================================================
   GWO JS (SÃˆVO SANTRAL) - ECHANJ PLUS V3 - MASTER KONPLE
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp, get, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- II. SISTÃˆM ENTÃŠTE DINAMIK (NEW) ---
function initDynamicHeader(data) {
    const container = document.getElementById('header-dynamic-container');
    if (!container) return;

    container.innerHTML = `
    <div id="dynamic-header" class="dynamic-header">
        <div class="header-top-row">
            <div class="user-greeting">
                <span class="greeting-text">Bonjou, <b>${data.fullname.split(' ')[0]}</b>! ðŸ‘‹</span>
                <span class="security-status"><i class="fas fa-shield-alt"></i> Kont ou an sekirite</span>
            </div>
            <div class="quick-balance">
                <div class="bal-item">
                    <small>Balans</small>
                    <span>${(data.balance || 0).toFixed(2)} HTG</span>
                </div>
                <div class="bal-divider"></div>
                <div class="bal-item">
                    <small>Komisyon</small>
                    <span style="color: #e67e22;">${(data.referral_data?.balance || 0).toFixed(2)} HTG</span>
                </div>
            </div>
        </div>
        <div class="flash-info-bar">
            <div class="flash-label">INFO:</div>
            <marquee behavior="scroll" direction="left">
                ðŸš€ Nouvo pousantaj disponib pou Digicel! | âš ï¸ Pa janm bay pÃ¨sonn kÃ²d sekirite ou. | ðŸŽ RekÃ²mande yon zanmi pou touche 4.5% komisyon.
            </marquee>
        </div>
    </div>`;
}

// --- III. SISTÃˆM NOTIFIKASYON (KLÃ’CH) ---
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

window.toggleNotifPanel = () => document.getElementById('notif-panel').classList.toggle('active');

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
            container.innerHTML = `<p class="empty-msg">Pa gen mesaj nan ${tabKouran}.</p>`;
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
        container.innerHTML = notifList.map(n => `
            <div class="notif-item">
                <i class="fa ${icon}"></i>
                <div class="notif-info">
                    <b>${n.title || (tabKouran === 'koneksyon' ? 'Sekirite' : 'Tranzaksyon')}</b>
                    <p>${n.msg}</p>
                    <small>${new Date(n.timestamp).toLocaleString('fr-FR')}</small>
                </div>
            </div>`).join('');
    });
}

// --- IV. OTANTIFIKASYON ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((u) => window.voyeNotifikasyon(u.user.uid, "Bon retou!", "Ou konekte ak siksÃ¨."))
        .catch(() => alert("Email oswa Modpas pa bon."));
};

window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const sponsor = document.getElementById('sponsor-input')?.value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) return alert("Modpas la dwe gen 6 karaktÃ¨ ak yon Majiskil.");

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
        window.voyeNotifikasyon(uid, "Byenveni!", `KÃ²d ARS ou se ${arsID}.`);
    } catch (err) { alert(err.message); }
};

// --- V. NAVIGASYON & LISTENERS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        loadUserData(user.uid);
        chajeNotifikasyonUI();
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
        document.getElementById('user-balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('side-name').innerText = data.fullname || "...";
        document.getElementById('side-id').innerText = data.arsID || "---";
        document.getElementById('side-email').innerText = data.email.replace(/(.{3})(.*)(?=@)/, "$1***");
        
        // LANSE ENTÃŠTE DINAMIK LA
        initDynamicHeader(data);
    });
}

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById(pageId)?.classList.remove('hidden');
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
};

// --- VI. LOJIK ECHANJ ---
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (" + rezo + ")?");
    if (!montan || montan < 100) return alert("MinimÃ²m se 100 HTG.");
    const transID = "ECH-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid, type: "Echanj", rezo, amount: parseFloat(montan), status: "En attente", timestamp: serverTimestamp()
    });
    window.voyeNotifikasyon(auth.currentUser.uid, "Tranzaksyon", `Echanj ${montan} HTG ap tann validasyon.`);
    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active');
       
