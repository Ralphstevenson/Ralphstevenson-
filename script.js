/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V3.2 - MASTER (FIXED)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp, get, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- ENPÒTE MODIL EKSTÈN YO ---
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

// --- II. SISTÈM NOTIFIKASYON (KLÒCH & GMAIL) ---
let tabKouran = 'koneksyon'; 

// 1. Fonksyon pou voye Gmail via EmailJS
window.voyeGmail = async (tip, done) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const settingsSnap = await get(ref(db, `users/${user.uid}/settings`));
        const settings = settingsSnap.val();

        if (settings && settings.gmail_enabled === false) {
            console.log("Gmail dezaktive nan paramèt.");
            return;
        }

        let templateParams = {
            to_email: user.email,
            user_name: done.name || "Kliyan Echanj Plus",
            message: ""
        };

        let templateID = "YOUR_TEMPLATE_TRANSAK"; 

        if (tip === 'enskripsyon') {
            templateID = "YOUR_TEMPLATE_WELCOME"; 
            templateParams.message = `Byenveni nan Echanj Plus! Kòd ARS ou se ${done.arsID}.`;
        } else if (tip === 'echanj') {
            templateParams.message = `Ou fè yon echanj ${done.amount} HTG nan rezo ${done.rezo}. N ap valide li.`;
        } else if (tip === 'retre') {
            templateParams.message = `Demann retrè ${done.amount} HTG sou ${done.method} resevwa.`;
        }

        await emailjs.send("YOUR_SERVICE_ID", templateID, templateParams);
        console.log("Gmail voye ak siksè!");
    } catch (err) {
        console.error("Erè voye Gmail:", err);
    }
};

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

// --- III. OTANTIFIKASYON (LOGIN / SIGNUP) ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((u) => window.voyeNotifikasyon(u.user.uid, "Bon retou!", "Ou konekte ak siksè."))
        .catch((err) => alert("Email oswa Modpas pa bon."));
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
            bonus_claimed: false, createdAt: serverTimestamp(),
            settings: { gmail_enabled: true } 
        });
        await set(ref(db, `ars_mapping/${arsID}`), { uid: uid });
        
        window.voyeNotifikasyon(uid, "Byenveni!", `Kòd ARS ou se ${arsID}.`);
        window.voyeGmail('enskripsyon', { name: name, arsID: arsID });
    } catch (err) { alert(err.message); }
};

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

// --- IV. NAVIGASYON & LISTENERS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page')?.classList.add('hidden');
        document.getElementById('home-page')?.classList.remove('hidden');
        
        loadUserData(user.uid);
        activateDynamicHeader(user.uid, db);

        if (window.initReferralDashboard) window.initReferralDashboard(user.uid);
        if (window.initParamet) window.initParamet(user.uid); 
        if (window.listenToMessages) window.listenToMessages(user.uid);
    } else {
        document.getElementById('auth-page')?.classList.remove('hidden');
        document.getElementById('home-page')?.classList.add('hidden');
    }
});

function loadUserData(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;
        
        const balElements = document.querySelectorAll('.display-balance');
        const formattedBal = (data.balance || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + " HTG";
        
        balElements.forEach(el => {
            if (!el.innerText.includes('*')) {
                el.innerText = formattedBal;
            }
            el.dataset.realValue = formattedBal; 
        });
        
        document.getElementById('side-name').innerText = data.fullname || "...";
        document.getElementById('side-id').innerText = data.arsID || "---";
        
        const refInput = document.getElementById('my-ref-code');
        if (refInput && data.arsID) refInput.value = data.arsID;
    });
}

window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    document.getElementById(pageId)?.classList.remove('hidden');
    
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('active');
};

// UI Toggles
window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');
window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');
       
