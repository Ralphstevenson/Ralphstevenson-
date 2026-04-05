/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.5 - FIXED AUTH
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
import { initEchanj } from './echanj.js';
import { initParennaj } from './parene.js';
import { initParamet } from './paramet.js';
// Ajoute lòt init yo si w genyen yo (retre, istorik)

// --- 3. STATUS CHECK (VELE SI MOUN NAN KONEKTE) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        console.log("✅ Itilizatè konekte:", user.email);
        if (authPage) authPage.style.display = 'none';
        if (homePage) homePage.style.display = 'block';
        
        // Lanse sèvis yo
        updateGlobalUI(user.uid);
        if (typeof initEchanj === 'function') initEchanj(user.uid);
        if (typeof initParennaj === 'function') initParennaj(user.uid);
        if (typeof initParamet === 'function') initParamet(user.uid);
    } else {
        console.log("❌ Pèsonn pa konekte");
        if (authPage) authPage.style.display = 'flex';
        if (homePage) homePage.style.display = 'none';
    }
});

// --- 4. FONKSYON LOGIN (KONEKSYON) ---
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn = document.querySelector('#login-section .btn-primary-pro');

    if (!email || !pass) return alert("Antre email ak modpas ou.");

    try {
        btn.innerText = "Y ap konekte...";
        btn.disabled = true;
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error(error);
        alert("Erè: Email oswa modpas pa kòrèk.");
    } finally {
        btn.innerText = "KONEKTE";
        btn.disabled = false;
    }
};

// --- 5. FONKSYON SIGNUP (ENSKRIPSYON) ---
window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value.trim();
    const sponsor = document.getElementById('sponsor-input').value.trim();
    const btn = document.querySelector('#signup-section .btn-primary-pro');

    if (!name || !email || !pass) return alert("Ranpli tout chan obligatwa yo.");

    try {
        btn.innerText = "Y ap kreye kont...";
        btn.disabled = true;

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Jenere ARS ID pwofesyonèl
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const arsID = `ARS-${name.substring(0, 3).toUpperCase()}-${randomNum}`;

        const userData = {
            uid: user.uid,
            fullname: name,
            phone: phone,
            email: email,
            arsID: arsID,
            balance: 0,
            referredBy: sponsor || "Sistèm",
            createdAt: serverTimestamp(),
            referral_data: { balance: 0, total_invites: 0 }
        };

        await set(ref(db, `users/${user.uid}`), userData);
        alert("Byenvini! Kont ou kreye ak siksè.");
    } catch (error) {
        console.error(error);
        alert("Erè: " + error.message);
    } finally {
        btn.innerText = "ANREJISTRE";
        btn.disabled = false;
    }
};

// --- 6. NAVIGASYON PAJ ---
window.toggleAuth = (mode) => {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');

    if (mode === 'signup') {
        loginSec.classList.add('hidden');
        signupSec.classList.remove('hidden');
    } else {
        signupSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
    }
};

// --- 7. MIZAJOU UI (BALANS AK NON) ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Mete non ak ID nan sidebar
        const sideName = document.getElementById('side-name');
        const sideID = document.getElementById('side-id');
        if (sideName) sideName.innerText = data.fullname || "Itilizatè";
        if (sideID) sideID.innerText = data.arsID || "ARS-YYYY";

        // Balans nan Header
        const headerBal = document.getElementById('header-quick-balance');
        if (headerBal) {
            headerBal.innerHTML = `<b style="color:#28a745;">${(data.balance || 0).toFixed(2)} HTG</b>`;
        }
    });
}

// --- 8. AKSYON LÒT ---
window.handleLogout = () => {
    if (confirm("Vle dekonekte?")) signOut(auth);
};

window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
};
