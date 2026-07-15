/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.6 - FULL INTEGRATION
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. KONFIGIRASYON FIREBASE ---
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
export const auth = getAuth(app);
export const db = getDatabase(app);

// --- 2. ENPÒTE MODIL SEKSYON YO ---
async function loadModules(uid) {
    try {
        // Nou chaje tout modil yo an menm tan (Nou ajoute akey.js ak notif.js)
        const [akey, notif, echanj, retre, istorik, chat, parennaj, paramet] = await Promise.all([
            import('./akey.js').catch((err) => { console.error("Erè akey.js:", err); return {}; }),
            import('./notif.js').catch((err) => { console.error("Erè notif.js:", err); return {}; }),
            import('./echanj.js').catch(() => ({})),
            import('./retre.js').catch(() => ({})),
            import('./istorik.js').catch(() => ({})),
            import('./parene.js').catch(() => ({})),
            import('./paramet.js').catch(() => ({}))
        ]);

        // Lanse akèy la pou kliyan sa a
        if (akey.initAkeyDone) akey.initAkeyDone(uid);
        if (akey.initHomeCarousel) akey.initHomeCarousel();

        // Lanse sistèm notifikasyon yo
        if (notif.initNotifikasyon) notif.initNotifikasyon(uid);

        // Lanse rès modil yo
        if (echanj.initEchanj) echanj.initEchanj(uid);
        if (retre.initRetre) retre.initRetre(uid);
        if (istorik.initIstorik) istorik.initIstorik(uid);
        if (chat.initChat) chat.initChat(uid);
        if (parennaj.initParennaj) parennaj.initParennaj(uid);
        if (paramet.initParamet) paramet.initParamet(uid);

    } catch (e) {
        console.warn("Gen modil ki gen ti pwoblèm pou chaje:", e.message);
    }
}

// --- 3. STATUS CHECK & AUTH LOGIC ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage?.classList.add('hidden');
        homePage?.classList.remove('hidden');
        updateGlobalUI(user.uid);
        loadModules(user.uid);
    } else {
        authPage?.classList.remove('hidden');
        homePage?.classList.add('hidden');
    }
});

// --- 4. EKSPÒTE FONKSYON POU HTML ---

// Auth Actions
window.handleLogin = async () => {
    const email = document.getElementById('login-email')?.value.trim();
    const pass = document.getElementById('login-pass')?.value;
    if (!email || !pass) return alert("Antre email ak modpas ou.");
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Email oswa Modpas enkòrèk."); }
};

window.handleSignup = async () => {
    const name = document.getElementById('sign-name')?.value.trim();
    const email = document.getElementById('sign-email')?.value.trim();
    const pass = document.getElementById('sign-pass')?.value;
    const phone = document.getElementById('sign-phone')?.value.trim();
    const sponsor = document.getElementById('sponsor-input')?.value.trim();

    if (!name || !email || !pass) return alert("Tanpri ranpli chan obligatwa yo.");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCred.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 8999) + "-2026";

        await set(ref(db, `users/${uid}`), {
            fullname: name, email, phone, arsID,
            balance: 0, referredBy: sponsor || "Sistèm",
            createdAt: serverTimestamp(),
            transactionPin: "0000" // PIN pa defo
        });
    } catch (e) { alert("Erè: " + e.message); }
};

window.toggleAuth = (mode) => {
    document.getElementById('login-section')?.classList.toggle('hidden', mode === 'signup');
    document.getElementById('signup-section')?.classList.toggle('hidden', mode === 'login');
};

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

// Sidebar UI
window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');

// N.B: toggleNotifPanel ak switchNotifTab ap jere nèt anndan notif.js lè l fin chaje.
// Nou kite vèsyon "fallback" sa yo sèlman si notif.js poko fin chaje nèt pou evite erè nan HTML la.
window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');

window.switchNotifTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    document.getElementById('notif-content').innerHTML = `<p class="empty-msg">Chaje notifikasyon ${tab}...</p>`;
};

// Modal Receipt Actions
window.closeReceipt = () => document.getElementById('modal-receipt')?.classList.add('hidden');

window.shareReceipt = () => {
    const id = document.getElementById('rec-id').innerText;
    const amt = document.getElementById('rec-amount').innerText;
    const text = `✅ Echanj Plus - Tranzaksyon Reyisi\nID: ${id}\nMontan: ${amt}`;
    navigator.share ? navigator.share({title: 'Resi', text}) : (navigator.clipboard.writeText(text), alert("Kopye!"));
};

// --- 5. UI SYNC (DASHBOARD) ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        document.getElementById('side-name').innerText = data.fullname || "Itilizatè";
        document.getElementById('side-email').innerText = data.email || "";
        document.getElementById('side-id').innerText = data.arsID || "---";
        
        const balElement = document.getElementById('header-quick-balance');
        if (balElement) {
            balElement.innerHTML = `<b style="color:#f1c40f;">${(data.balance || 0).toFixed(2)} HTG</b>`;
        }
    });
}

// --- 6. NAVIGASYON (SINGLE PAGE) ---
window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item, .menu-item').forEach(el => el.classList.remove('active'));
    if (navElement) navElement.classList.add('active');

    // Fèmen sidebar otomatikman sou mobil apre klike
    document.getElementById('sidebar')?.classList.remove('active');
};
