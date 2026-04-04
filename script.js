/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.2 - AUTH EDITION
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
import { initRetre } from './retre.js';
import { initIstorik } from './istorik.js';
import { initParennaj } from './parene.js';
import { initParamet } from './paramet.js';

// --- 3. GESTYON OTANTIFIKASYON (STATUS CHECK) ---
onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        authPage?.classList.add('hidden');
        homePage?.classList.remove('hidden');
        
        // Lanse modil yo
        updateGlobalUI(user.uid);
        initEchanj(user.uid);
        initRetre(user.uid);
        initIstorik(user.uid);
        initParennaj(user.uid);
        initParamet(user.uid);
    } else {
        authPage?.classList.remove('hidden');
        homePage?.classList.add('hidden');
    }
});

// --- 4. LOJIK KONEKSYON (LOGIN) ---
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) return alert("Tanpri ranpli tout chan yo.");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Erè: " + error.message);
    }
};

// --- 5. LOJIK ENSKRIPSYON (SIGNUP) ---
window.handleSignup = async () => {
    const name = document.getElementById('sign-name').value;
    const phone = document.getElementById('sign-phone').value;
    const email = document.getElementById('sign-email').value;
    const pass = document.getElementById('sign-pass').value;
    const sponsorCode = document.getElementById('sponsor-input').value.trim();

    if (!name || !phone || !email || !pass) return alert("Ranpli tout enfòmasyon yo.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Jenere ARS ID: Non + 4 Chif o aza
        const randomID = Math.floor(1000 + Math.random() * 9000);
        const arsID = `ARS-${name.substring(0, 3).toUpperCase()}-${randomID}`;

        // Prepare done pou Firebase
        const userData = {
            uid: user.uid,
            fullname: name,
            phone: phone,
            email: email,
            arsID: arsID,
            balance: 0,
            referredBy: sponsorCode || "Sistèm",
            referral_data: { balance: 0, total_invites: 0 },
            createdAt: serverTimestamp()
        };

        // Sove nan Database
        await set(ref(db, `users/${user.uid}`), userData);
        
        // Si gen sponsor, mete itilizatè a nan lis li
        if (sponsorCode && sponsorCode.startsWith("ARS-")) {
            console.log("Sponsor detekte:", sponsorCode);
            // Lojik pou mete nan invite_list sponsor a ka fèt isit la
        }

        alert("Kont ou kreye ak siksè! Byenvini nan Echanj Plus.");
    } catch (error) {
        alert("Erè Enskripsyon: " + error.message);
    }
};

// --- 6. TOGGLE LOGIN/SIGNUP ---
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

// --- 7. MIZAJOU UI GLOBAL ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        const headerBal = document.getElementById('header-quick-balance');
        if (headerBal) {
            headerBal.innerHTML = `
                <div class="bal-pill">
                    <span style="color:#28a745; font-weight:800;">${(data.balance || 0).toFixed(2)} HTG</span>
                </div>`;
        }
        
        document.getElementById('side-name').innerText = data.fullname || "Itilizatè";
        document.getElementById('side-id').innerText = data.arsID || "ARS-YYYY";
    });
}

window.handleLogout = () => {
    if (confirm("Èske ou vle dekonekte?")) signOut(auth);
};
       
