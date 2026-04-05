/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.5 - FIXED AUTH & UI
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

// --- 2. ENPÒTE MODIL YO ---
// Nou itilize try/catch pou si yon fichye manke, sa pa bloke tout App la
async function loadModules(uid) {
    try {
        const { initEchanj } = await import('./echanj.js');
        const { initParennaj } = await import('./parene.js');
        const { initParamet } = await import('./paramet.js');
        
        if (initEchanj) initEchanj(uid);
        if (initParennaj) initParennaj(uid);
        if (initParamet) initParamet(uid);
    } catch (e) {
        console.warn("Kèk modil poko chaje pafè:", e.message);
    }
}

// --- 3. STATUS CHECK (KORÈK) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        // Itilizatè konekte: Montre Dashboard
        if (authPage) authPage.classList.add('hidden');
        if (homePage) homePage.classList.remove('hidden');
        
        updateGlobalUI(user.uid);
        loadModules(user.uid);
    } else {
        // Itilizatè dekonekte: Montre Paj Login
        if (authPage) authPage.classList.remove('hidden');
        if (homePage) homePage.classList.add('hidden');
    }
});

// --- 4. EKSPÒTE FONKSYON POU HTML ---
window.handleLogin = async () => {
    const email = document.getElementById('login-email')?.value.trim();
    const pass = document.getElementById('login-pass')?.value;

    if (!email || !pass) return alert("Ranpli tout chan yo.");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Erè: Email oswa Modpas pa bon.");
    }
};

window.handleSignup = async () => {
    const name = document.getElementById('sign-name')?.value.trim();
    const email = document.getElementById('sign-email')?.value.trim();
    const pass = document.getElementById('sign-pass')?.value;
    const phone = document.getElementById('sign-phone')?.value.trim();
    const sponsor = document.getElementById('sponsor-input')?.value.trim();

    if (!name || !email || !pass) return alert("Ranpli tout enfòmasyon yo.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000);

        await set(ref(db, `users/${uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0,
            referredBy: sponsor || "Sistèm",
            createdAt: serverTimestamp(),
            referral_data: { balance: 0, total_invites: 0 }
        });
    } catch (error) {
        alert("Erè: " + error.message);
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
    if (confirm("Èske ou vle dekonekte?")) signOut(auth);
};

// --- 5. UI SYNC ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        const sideName = document.getElementById('side-name');
        const sideID = document.getElementById('side-id');
        const headerBal = document.getElementById('header-quick-balance');

        if (sideName) sideName.innerText = data.fullname || "Itilizatè";
        if (sideID) sideID.innerText = data.arsID || "---";
        if (headerBal) {
            headerBal.innerHTML = `<b style="color:#28a745;">${(data.balance || 0).toFixed(2)} HTG</b>`;
        }
    });
}

// --- 6. NAVIGASYON ---
window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
};
   
