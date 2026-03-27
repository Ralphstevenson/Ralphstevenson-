import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// I. KONFIGIRASYON FIREBASE
// ==========================================
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

// ==========================================
// II. OTANTIFIKASYON (LOGIN / SIGNUP)
// ==========================================

window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout chan yo!");
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè: Email oswa Modpas pa bon."));
};

window.handleSignup = () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) {
        return alert("Modpas la dwe gen 6 karaktè ak yon Majiskil.");
    }

    createUserWithEmailAndPassword(auth, email, pass).then((userCredential) => {
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000); 
        set(ref(db, `users/${uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0.00,
            status: "active",
            createdAt: serverTimestamp()
        });
    }).catch(err => alert(err.message));
};

window.handleLogout = () => {
    if (confirm("Èske ou sèten ou vle kite sesyon an?")) {
        signOut(auth);
    }
};

// ==========================================
// III. SISTÈM NOTIFIKASYON
// ==========================================
let tabKouran = 'koneksyon';
let konteNotif = 0;

window.toggleNotifPanel = () => {
    const panel = document.getElementById('notif-panel');
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
        konteNotif = 0;
        updateBadgeUI();
    }
};

window.switchNotifTab = (tabName) => {
    tabKouran = tabName;
    document.getElementById('tab-koneksyon').classList.toggle('active', tabName === 'koneksyon');
    document.getElementById('tab-transak').classList.toggle('active', tabName === 'transak');
    loadNotifFromFirebase();
};

function updateBadgeUI() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.innerText = konteNotif;
        badge.classList.toggle('hidden', konteNotif === 0);
    }
}

function loadNotifFromFirebase() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const container = document.getElementById('notif-content');
    
    onValue(ref(db, `users/${uid}/notifications/${tabKouran}`), (snap) => {
        container.innerHTML = "";
        const data = snap.val();
        if (data) {
            const sortedNotifs = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
            sortedNotifs.forEach(n => {
                const icon = tabKouran === 'koneksyon' ? 'fa-shield-check' : 'fa-receipt';
                container.innerHTML += `
                    <div class="notif-item">
                        <i class="fa ${icon}"></i>
                        <div class="notif-info">
                            <p>${n.msg}</p>
                            <small>${new Date(n.timestamp).toLocaleString()}</small>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="empty-msg">Pa gen mesaj nan ${tabKouran}.</p>`;
        }
    });
}

// ==========================================
// IV. NAVIGASYON PWOFESYONÈL
// ==========================================
window.showPage = async (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    if (pageId === 'paj-retre' && window.enjekteHtmlRetre) await window.enjekteHtmlRetre();
    
    // BRANCHMAN ISTORIK (Rele fonksyon ki nan istorik.js la)
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    if (pageId === 'paj-akey') startCarousel();
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active');
};

// ==========================================
// V. LOJIK DONE & FIREBASE LISTENERS
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        loadUserData(user.uid);
        loadNotifFromFirebase();
        if (window.listenToMessages) window.listenToMessages(user.uid);
        
        // Notif sekirite login
        const loginRef = push(ref(db, `users/${user.uid}/notifications/koneksyon`));
        set(loginRef, { msg: "Koneksyon detekte sou kont ou.", timestamp: Date.now() });
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
    }
});

function loadUserData(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('user-balance').innerText = data.balance.toFixed(2);
        document.getElementById('side-name').innerText = data.fullname;
        document.getElementById('side-id').innerText = data.arsID;
        document.getElementById('side-email').innerText = data.email.replace(/(.{3})(.*)(?=@)/, "$1***");
    });
}

// Lojik Echanj
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (Minit " + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");
    const transID = "ECH-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid, type: "Echanj", rezo: rezo, amount: montan, status: "En attente", timestamp: serverTimestamp()
    });
    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

// ==========================================
// VI. UI AUTOMATION (CAROUSEL & THEME)
// ==========================================
let slideIndex = 0;
window.startCarousel = () => {
    const slides = document.querySelector('.slides');
    if (!slides) return;
    if (window.carouselInterval) clearInterval(window.carouselInterval);
    window.carouselInterval = setInterval(() => {
        slideIndex = (slideIndex + 1) % 3;
        slides.style.transform = `translateX(-${slideIndex * 100}%)`;
    }, 4000);
};

