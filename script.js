/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.0 - LUXURY EDITION
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// I. KONFIGIRASYON FIREBASE
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

// --- II. MOTÈ UI (POU VIZYÈL LUXURY A) ---

// 1. Mise à jour Globale de l'interface
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Balans nan Bwat Nwa a (Header)
        const headerBalance = document.getElementById('header-quick-balance');
        if (headerBalance) {
            const formattedBal = (data.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            headerBalance.innerHTML = `
                <div class="balance-info">
                    <span class="balance-amount">${formattedBal} HTG</span>
                    <span class="balance-ref">Ref: ${data.arsID || '0.00'}</span>
                </div>
            `;
        }

        // Enfòmasyon Sidebar/Profil
        const sideName = document.getElementById('side-name');
        const sideID = document.getElementById('side-id');
        if (sideName) sideName.innerText = data.fullname || "Kliyan";
        if (sideID) sideID.innerText = data.arsID || "ARS-0000";

        // Maske Email pou sekirite (echan***@gmail.com)
        const emailEl = document.getElementById('user-email-display');
        if (emailEl && data.email) {
            const [name, domain] = data.email.split('@');
            emailEl.innerText = `${name.substring(0, 5)}***@${domain}`;
        }
    });
}

// 2. Sistèm Navigasyon (Tab Switcher)
window.showPage = (pageId, navElement) => {
    // Lis tout seksyon yo
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        // Ti animasyon lè paj la parèt
        activePage.style.animation = "fadeIn 0.4s ease";
    }

    // Mizajou klas Active nan Bottom Nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    
    // Fèmen sidebar si l te ouvè (mobil)
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- III. OTANTIFIKASYON ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kache login, montre aplikasyon an
        document.getElementById('auth-page')?.classList.add('hidden');
        document.getElementById('home-page')?.classList.remove('hidden');
        
        // Chaje tout done yo
        updateGlobalUI(user.uid);
        if (window.listenToMessages) window.listenToMessages(user.uid);
    } else {
        document.getElementById('auth-page')?.classList.remove('hidden');
        document.getElementById('home-page')?.classList.add('hidden');
    }
});

window.handleLogout = () => {
    if (confirm("Èske ou vle dekonekte?")) {
        signOut(auth).catch(err => console.error(err));
    }
};

// --- IV. SISTÈM NOTIFIKASYON REAL-TIME ---
window.voyeNotifikasyon = async (uid, tit, mesaj) => {
    const path = tit.toLowerCase().includes('konekte') ? 'koneksyon' : 'transak';
    const notifRef = push(ref(db, `users/${uid}/notifications/${path}`));
    await set(notifRef, {
        title: tit,
        msg: mesaj,
        timestamp: serverTimestamp(),
        read: false
    });
};

// Toggles pou UI
window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');
window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');
           
