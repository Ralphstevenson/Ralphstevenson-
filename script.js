/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V4.0 - MASTER EDITION
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- 2. ENPÒTE MODIL YO (Maryaj JS yo) ---
// Asire w fichye sa yo egziste nan menm dosye a
import { initEchanj } from './echanj.js';
import { initRetre } from './retre.js';
import { initIstorik } from './istorik.js';
import { initChat } from './chat.js';
import { initParennaj } from './parene.js';
import { initParamet } from './paramet.js';

// --- 3. GESTYON OTANTIFIKASYON ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Itilizatè konekte:", user.uid);
        
        // Kache paj login, montre dashboard
        document.getElementById('auth-page')?.classList.add('hidden');
        document.getElementById('home-page')?.classList.remove('hidden');

        // Lanse tout sèvis yo yon sèl kou
        updateGlobalUI(user.uid);
        initEchanj(user.uid);
        initRetre(user.uid);
        initIstorik(user.uid);
        initChat(user.uid);
        initParennaj(user.uid);
        initParamet(user.uid);
    } else {
        // Redireksyon si l pa konekte
        document.getElementById('auth-page')?.classList.remove('hidden');
        document.getElementById('home-page')?.classList.add('hidden');
    }
});

// --- 4. MOTÈ UI (POU HEADER AK BALANS) ---
function updateGlobalUI(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Bwat Balans Luxury (Vèt sou Nwa)
        const headerBalance = document.getElementById('header-quick-balance');
        if (headerBalance) {
            const formattedBal = (data.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            headerBalance.innerHTML = `
                <div class="balance-info" style="display: flex; flex-direction: column; justify-content: center;">
                    <span class="balance-amount" style="color: #28a745; font-weight: 800; font-size: 14px;">${formattedBal} HTG</span>
                    <span class="balance-ref" style="color: #ffffff; font-size: 9px; opacity: 0.8;">Ref: ${data.arsID || '---'}</span>
                </div>
            `;
        }

        // Enfòmasyon Profile
        const sideName = document.getElementById('side-name');
        const sideID = document.getElementById('side-id');
        if (sideName) sideName.innerText = data.fullname || "Itilizatè";
        if (sideID) sideID.innerText = data.arsID || "ARS-YYYY";
    });
}

// --- 5. NAVIGASYON (SINGLE PAGE APPLICATION) ---
window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.style.animation = "fadeIn 0.3s ease-in-out";
    }

    // Mizajou klas Active nan Bottom Nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    
    // Fèmen sidebar si mobil
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- 6. AKSYON GLOBAL ---
window.handleLogout = () => {
    if (confirm("Èske ou vle dekonekte?")) {
        signOut(auth);
    }
};

window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');
window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');
           
