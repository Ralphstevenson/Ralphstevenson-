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

// --- 3. STATUS CHECK & AUTH LOGIC (ANTI-FWÒD METE AJOU) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');
    const loginEmailInput = document.getElementById('login-email');

    // Ranpli Email la otomatikman si l te deja konekte yon fwa sou aparèy la
    const savedEmail = localStorage.getItem('echanj_saved_email');
    if (savedEmail && loginEmailInput) {
        loginEmailInput.value = savedEmail;
    }

    if (user) {
        // Gade si mèt kont lan sot tape modpas li pou sesyon sa a
        const isVerifiedThisSession = sessionStorage.getItem('echanj_session_verified');

        if (isVerifiedThisSession === 'true') {
            // Si li valide modpas li, li ka antre sou Dashboard la
            authPage?.classList.add('hidden');
            homePage?.classList.remove('hidden');
            updateGlobalUI(user.uid);
            loadModules(user.uid);
        } else {
            // Si se koneksyon otomatik Firebase la, nou fòse l rete sou login pou l mete modpas li obligatwa
            authPage?.classList.remove('hidden');
            homePage?.classList.add('hidden');
        }
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
    
    try { 
        // Verifikasyon modpas la ak Firebase
        await signInWithEmailAndPassword(auth, email, pass); 
        
        // Sove Email la nèt nan aparèy la pou pwochen fwa
        localStorage.setItem('echanj_saved_email', email);
        
        // Valide sesyon aktyèl la piske li sot antre bon modpas la kounye a
        sessionStorage.setItem('echanj_session_verified', 'true');
        
        // Louvri Dashboard la rapid
        document.getElementById('auth-page')?.classList.add('hidden');
        document.getElementById('home-page')?.classList.remove('hidden');
        
        // Netwaye bwat modpas la pou sekirite
        if (document.getElementById('login-pass')) {
            document.getElementById('login-pass').value = "";
        }
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
        
        // Sove enfòmasyon sesyon yo otomatikman pou nouvo enskripsyon an
        localStorage.setItem('echanj_saved_email', email);
        sessionStorage.setItem('echanj_session_verified', 'true');

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
        
        // Remete email la otomatikman si l te deja sove lè l tounen sou login section
        const savedEmail = localStorage.getItem('echanj_saved_email');
        if (savedEmail && document.getElementById('login-email')) {
            document.getElementById('login-email').value = savedEmail;
        }
    }
};

window.handleLogout = () => { 
    if (confirm("Èske ou vle dekonekte vrèman?")) {
        // Efase verifikasyon an pou pwochen fwa li obligatwa pou l mete modpas
        sessionStorage.removeItem('echanj_session_verified');
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
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre', 'infos'];
    
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
