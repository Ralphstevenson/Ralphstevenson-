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
        // Tout modil yo aliyen parfe nan lòd kounye a (8 modil total)
        const [akey, header, echanj, retre, istorik, chat, parennaj, paramet] = await Promise.all([
            import('./akey.js').catch((err) => { console.error("Erè akey.js:", err); return {}; }),
            import('./header.js').catch((err) => { console.error("Erè header.js:", err); return {}; }),
            import('./echanj.js').catch((err) => { console.error("Erè echanj.js:", err); return {}; }),
            import('./retre.js').catch((err) => { console.error("Erè retre.js:", err); return {}; }),
            import('./istorik.js').catch((err) => { console.error("Erè istorik.js:", err); return {}; }),
            import('./chat.js').catch((err) => { console.error("Erè chat.js:", err); return {}; }),
            import('./parene.js').catch((err) => { console.error("Erè parene.js:", err); return {}; }),
            import('./paramet.js').catch((err) => { console.error("Erè paramet.js:", err); return {}; })
        ]);

        // Lanse akèy la pou kliyan sa a
        if (akey.initAkeyDone) akey.initAkeyDone(uid);
        if (akey.initHomeCarousel) akey.initHomeCarousel();

        // Lanse sistèm notifikasyon yo depi nan header.js
        if (header.initNotifikasyon) header.initNotifikasyon(uid);

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

// --- 3. STATUS CHECK & AUTH LOGIC (MIZAJOU NOUVO SDK ONESIGNAL) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage?.classList.add('hidden');
        homePage?.classList.remove('hidden');
        updateGlobalUI(user.uid);
        loadModules(user.uid);

        // MARE TELEFÒN NAN AK UID FIREBASE LA VIA DEFERRED SDK
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.login(user.uid);
                console.log("OneSignal: Aparèy mare avèk siksè pou UID:", user.uid);
            } catch (err) {
                console.error("Erè OneSignal Deferred Login:", err);
            }
        });

    } else {
        authPage?.classList.remove('hidden');
        homePage?.classList.add('hidden');

        // RETIRE KLIYAN AN SOU APARÈY LA LÈ LI DEKONEKTE
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.logout();
                console.log("OneSignal: Itilizatè a dekonekte nòmalman.");
            } catch (err) {
                console.error("Erè OneSignal Deferred Logout:", err);
            }
        });
    }
});

// --- 4. EKSPÒTE FONKSYON POU HTML ---

// Auth Actions
window.handleLogin = async () => {
    const email = document.getElementById('login-email')?.value.trim();
    const pass = document.getElementById('login-pass')?.value;
    if (!email || !pass) return alert("Antre email ak modpas ou.");
    try { 
        await signInWithEmailAndPassword(auth, email, pass); 
    } catch (e) { 
        alert("Email oswa Modpas enkòrèk."); 
    }
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
        
        // Jenerasyon kòd ARS inik ak fòma 2026
        const randomDigits = Math.floor(1000 + Math.random() * 8900); // Evite kòmanse pa 0 pou sekirite
        const arsID = `ARS-${randomDigits}-2026`;

        await set(ref(db, `users/${uid}`), {
            fullname: name,
            email: email,
            phone: phone || "",
            arsID: arsID,
            balance: 0,
            referredBy: sponsor || "Sistèm",
            createdAt: serverTimestamp(),
            transactionPin: "0000" // PIN sekirite pa defo
        });
    } catch (e) { 
        alert("Erè nan enskripsyon an: " + e.message); 
    }
};

window.toggleAuth = (mode) => {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    
    if (mode === 'signup') {
        loginSec?.classList.add('hidden');
        signupSec?.classList.remove('hidden');
    } else {
        signupSec?.classList.add('hidden');
        loginSec?.classList.remove('hidden');
    }
};

window.handleLogout = () => { 
    if (confirm("Èske ou vle dekonekte vrèman?")) {
        signOut(auth); 
    }
};

// Sidebar UI
window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');

// Fallback pou notifikasyon anvan modil yo fin chaje
window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');

window.switchNotifTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    
    const notifContent = document.getElementById('notif-content');
    if (notifContent) {
        notifContent.innerHTML = `<p class="empty-msg">Chaje notifikasyon ${tab}...</p>`;
    }
};

// Modal Receipt Actions
window.closeReceipt = () => document.getElementById('modal-receipt')?.classList.add('hidden');

window.shareReceipt = () => {
    const idElement = document.getElementById('rec-id');
    const amtElement = document.getElementById('rec-amount');
    
    const id = idElement ? idElement.innerText : "---";
    const amt = amtElement ? amtElement.innerText : "0.00 HTG";
    
    const text = `✅ Echanj Plus - Tranzaksyon Reyisi\nID: ${id}\nMontan: ${amt}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Resi Echanj Plus', text })
            .catch((err) => console.log("Erè nan pataje:", err));
    } else {
        navigator.clipboard.writeText(text);
        alert("Kopye nan clipboard ou!");
    }
};

// --- 5. UI SYNC (DASHBOARD) ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        const sideName = document.getElementById('side-name');
        const sideEmail = document.getElementById('side-email');
        const sideId = document.getElementById('side-id');
        const balElement = document.getElementById('header-quick-balance');

        if (sideName) sideName.innerText = data.fullname || "Itilizatè";
        if (sideEmail) sideEmail.innerText = data.email || "";
        if (sideId) sideId.innerText = data.arsID || "---";
        
        if (balElement) {
            balElement.innerHTML = `<b style="color:#f1c40f;">${(data.balance || 0).toFixed(2)} HTG</b>`;
        }
    });
}

// --- 6. NAVIGASYON (SINGLE PAGE) ---
window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    
    sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.classList.add('hidden');
    });
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item, .menu-item').forEach(el => el.classList.remove('active'));
    if (navElement) navElement.classList.add('active');

    // Fèmen sidebar otomatikman sou mobil apre klike
    document.getElementById('sidebar')?.classList.remove('active');
};
                   
