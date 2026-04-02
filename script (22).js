/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V3.2 - MASTER (UPDATED)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp, get, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- ENPÒTE MODIL YO ---
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
        // Tcheke si itilizatè a aktive Notifikasyon Gmail nan pwofil li
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

        let templateID = "YOUR_TEMPLATE_TRANSAK"; // Mete ID ou isit la

        if (tip === 'enskripsyon') {
            templateID = "YOUR_TEMPLATE_WELCOME"; 
            templateParams.message = `Byenveni! Kòd ARS ou se ${done.arsID}. Mèsi deske ou chwazi Echanj Plus.`;
        } else if (tip === 'echanj') {
            templateParams.message = `Ou fè yon echanj ${done.amount} HTG nan rezo ${done.rezo}. N ap valide tranzaksyon an kounye a.`;
        } else if (tip === 'retre') {
            templateParams.message = `Ou mande yon retrè ${done.amount} HTG sou kont ${done.method} (${done.phone}).`;
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

window.toggleNotifPanel = () => document.getElementById('notif-panel')?.classList.toggle('active');

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
            if(container) container.innerHTML = `<p class="empty-msg">Pa gen mesaj nan ${tabKouran}.</p>`;
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
        if(container) {
            container.innerHTML = notifList.map(n => `
                <div class="notif-item">
                    <i class="fa ${icon}"></i>
                    <div class="notif-info">
                        <b>${n.title || (tabKouran === 'koneksyon' ? 'Sekirite' : 'Tranzaksyon')}</b>
                        <p>${n.msg}</p>
                        <small>${new Date(n.timestamp).toLocaleString('fr-FR')}</small>
                    </div>
                </div>`).join('');
        }
    });
}

// --- III. OTANTIFIKASYON ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((u) => window.voyeNotifikasyon(u.user.uid, "Bon retou!", "Ou konekte ak siksè."))
        .catch(() => alert("Email oswa Modpas pa bon."));
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
            settings: { gmail_enabled: true } // Aktive pa defo
        });
        await set(ref(db, `ars_mapping/${arsID}`), { uid: uid });
        
        // Voye notifikasyon lokal ak Gmail
        window.voyeNotifikasyon(uid, "Byenveni!", `Kòd ARS ou se ${arsID}.`);
        window.voyeGmail('enskripsyon', { name: name, arsID: arsID });

    } catch (err) { alert(err.message); }
};

// --- IV. NAVIGASYON & LISTENERS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        loadUserData(user.uid);
        chajeNotifikasyonUI();
        activateDynamicHeader(user.uid, db);

        if (window.initReferralDashboard) window.initReferralDashboard(user.uid);
        if (window.initParamet) window.initParamet(user.uid); // Nouvo non fonksyon an
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
        
        // Pou balans kache/montre a, nou mete l nan klas la tou
        const balElements = document.querySelectorAll('.display-balance');
        const formattedBal = (data.balance || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + " HTG";
        
        balElements.forEach(el => {
            // Si sistèm nan sou "Kache", nou pa chanje tèks la isit la, 
            // men si l sou "Montre", nou mete valè a.
            if (!el.innerText.includes('*')) {
                el.innerText = formattedBal;
            }
            el.dataset.realValue = formattedBal; // Sove valè a pou JS Balans lan
        });
        
        document.getElementById('side-name').innerText = data.fullname || "...";
        document.getElementById('side-id').innerText = data.arsID || "---";
        document.getElementById('side-email').innerText = data.email ? data.email.replace(/(.{3})(.*)(?=@)/, "$1***") : "...";
        
        const refInput = document.getElementById('my-ref-code');
        if (refInput && data.arsID) refInput.value = data.arsID;
    });
}

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj', 'paj-parametre'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    
    if (pageId === 'paj-parennaj') {
        const sideID = document.getElementById('side-id').innerText;
        const refInput = document.getElementById('my-ref-code');
        if (refInput && sideID !== "---") refInput.value = sideID;
    }

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('active');
};

// --- V. LOJIK ECHANJ ---
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (" + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");
    
    const transID = "ECH-" + Date.now();
    const uid = auth.currentUser.uid;

    await set(ref(db, `transactions/${transID}`), {
        uid: uid, type: "Echanj", rezo, amount: parseFloat(montan), status: "En attente", timestamp: serverTimestamp()
    });

    window.voyeNotifikasyon(uid, "Tranzaksyon", `Echanj ${montan} HTG ap tann validasyon.`);
    
    // Deklanche Gmail
    window.voyeGmail('echanj', { amount: montan, rezo: rezo });

    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('active');
       
