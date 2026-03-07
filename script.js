import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CONFIGURATION FIREBASE
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
const auth = getAuth(app);
const db = getDatabase(app);

// Global State
let userData = null;
let cacheTransactions = [];

// ==========================================
// I. OTANTIFIKASYON & SEKIRITE
// ==========================================

const generateArsID = () => "ARS-" + Math.floor(100000 + Math.random() * 900000);
const clean = (val) => val.trim();

window.handleSignup = async () => {
    const name = clean(document.getElementById('sign-name').value);
    const email = clean(document.getElementById('sign-email').value);
    const pass = document.getElementById('sign-pass').value;
    const phone = clean(document.getElementById('sign-phone').value);
    const terms = document.getElementById('accept-terms').checked;

    if (!/^[A-Z]/.test(pass)) return alert("Modpas la dwe kòmanse ak yon lèt Majiskil!");
    if (pass.length < 6) return alert("Modpas la dwe gen omwen 6 karaktè.");
    if (!terms) return alert("Ou dwe asepte kondisyon yo.");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await sendEmailVerification(userCred.user);
        
        await set(ref(db, `users/${userCred.user.uid}`), {
            fullname: name, email: email, phone: phone,
            arsID: generateArsID(), balance: 0, points: 0,
            status: "Inactif", lastLogin: serverTimestamp()
        });
        
        alert("Kont kreye! Tanpri verifye email ou anvan ou konekte.");
        toggleAuth('login');
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = async () => {
    const email = clean(document.getElementById('login-email').value);
    const pass = document.getElementById('login-pass').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        if (!userCred.user.emailVerified) {
            alert("Email ou poko verifye!");
            await signOut(auth);
        }
    } catch (e) { alert("Email oswa Modpas enkòrèk!"); }
};

// Auto-Logout apre 30 minit
let timer;
const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if(auth.currentUser) signOut(auth); }, 1800000);
};
window.onmousemove = resetTimer;
window.onkeypress = resetTimer;

// ==========================================
// II. GESTYON DONE DIRÈK & ISTORIK
// ==========================================

onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user && user.emailVerified) {
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // LANSE ISTORIK LA
        setupHistoryListener(user.uid);

        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snap) => {
            userData = snap.val();
            if (userData) {
                if (!userData.arsID) { update(userRef, { arsID: generateArsID() }); return; }
                document.getElementById('user-balance').innerText = userData.balance.toFixed(2);
                document.getElementById('side-name').innerText = userData.fullname;
                document.getElementById('side-id').innerText = userData.arsID;
                
                let [userPart, domain] = userData.email.split("@");
                document.getElementById('side-email').innerText = userPart.substring(0,2) + "***@" + domain;
            }
        });

        if(new Date().getHours() >= 18 || new Date().getHours() < 6) {
            document.body.classList.add('night-mode');
        }
    } else {
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// ==========================================
// III. SIK TRANZAKSYON ECHANJ (USSD)
// ==========================================

window.openDialer = function(rezo) {
    let montan = prompt("Konbe Gdes w ap voye?");
    if (!montan || isNaN(montan) || montan < 100) return alert("Minimòm lan se 100 HTG.");

    let resevwa = (montan * 0.835).toFixed(2);
    
    if(confirm(`W ap voye ${montan} HTG.\nW ap resevwa ${resevwa} HTG sou balans ou.\n\nÈske w konfime?`)) {
        let code = (rezo === 'natcom') ? `*123*88888888*32160708*${montan}%23` : `*128*50947111123*${montan}%23`;
        window.location.href = "tel:" + code;
        
        const transID = "TR-" + Date.now();
        set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            arsID: userData.arsID,
            fullname: userData.fullname,
            type: "Echanj",
            rezo: rezo,
            montan: parseFloat(montan),
            resevwa: parseFloat(resevwa),
            status: "En attente",
            timestamp: serverTimestamp()
        });
    }
};

// ==========================================
// IV. SISTÈM RETRÈ V1
// ==========================================

window.openRetreConfirm = function() {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montanInput = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanInput);

    if (!non || !tel || !montanInput || isNaN(montan) || montan < 100) return alert("Rempli chan yo kòrèkteman (Min 100 HTG).");
    if (montan > userData.balance) return alert("Balans ou pa ase!");

    document.getElementById('retre-preview-data').innerHTML = `
        <p><strong>Metòd:</strong> ${metod}</p>
        <p><strong>Telefòn:</strong> ${tel}</p>
        <p><strong>Retire:</strong> ${montan.toFixed(2)} HTG</p>`;
    document.getElementById('modal-confirm-retre').classList.remove('hidden');
};

window.submitRetre = async () => {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    window.closeRetreConfirm();
    try {
        const transID = "RET-" + Date.now();
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid, arsID: userData.arsID,
            fullname: userData.fullname, type: "Retrè",
            method: metod, phone: tel, receiver: non,
            amount: montan, status: "En attente", timestamp: serverTimestamp()
        });
        await update(ref(db, `users/${auth.currentUser.uid}`), { balance: userData.balance - montan });
        
        document.getElementById('modal-success').classList.remove('hidden');
        setTimeout(() => { document.getElementById('modal-success').classList.add('hidden'); showPage('paj-akey'); }, 4000);
    } catch (e) { alert("Erè nan retrè a."); }
};

// ==========================================
// V. GESTYON ISTORIK (REAL-TIME)
// ==========================================

function setupHistoryListener(uid) {
    onValue(ref(db, 'transactions'), (snapshot) => {
        const data = snapshot.val();
        cacheTransactions = [];
        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key].uid === uid) cacheTransactions.push({ id: key, ...data[key] });
            });
            cacheTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        renderHistoryList(cacheTransactions);
    });
}

function renderHistoryList(list) {
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;
    listContainer.innerHTML = list.length === 0 ? "<p style='text-align:center; padding:50px;'>Okenn aktivite.</p>" : "";

    list.forEach(tr => {
        const statusClass = (tr.status || "En attente").toLowerCase().replace(/\s+/g, '-');
        const datFoma = tr.timestamp ? new Date(tr.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jodi a';
        
        listContainer.innerHTML += `
            <div class="trans-card" style="border-left: 5px solid var(--primary-blue); margin-bottom:12px; padding:15px; background:white; border-radius:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0;">${tr.type}</h4>
                    <span style="font-size:12px; color:#6b778c;">${datFoma} • ${tr.method || tr.rezo || 'Plus'}</span>
                    <br><span class="status-badge status-${statusClass}">${tr.status || 'En attente'}</span>
                </div>
                <div style="text-align:right;">
                    <b style="color:var(--primary-blue);">${(tr.amount || tr.montan || 0).toFixed(2)} HTG</b>
                </div>
            </div>`;
    });
}

window.filterHistory = function(kategori, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    let filtered = (kategori === 'tout') ? cacheTransactions : 
                   (kategori === 'Succès') ? cacheTransactions.filter(t => t.status === 'Succès' || t.status === 'Valide') :
                   (kategori === 'Anulé') ? cacheTransactions.filter(t => t.status === 'Anulé' || t.status === 'Echoué') :
                   cacheTransactions.filter(t => t.type === kategori);
    renderHistoryList(filtered);
};

// ==========================================
// VI. NAVIGASYON & UI
// ==========================================

window.showPage = (id, el) => {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(el) el.classList.add('active');
};

window.toggleAuth = (type) => {
    document.getElementById('login-section').classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', type === 'login');
};

window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active-sidebar');
window.handleLogout = () => signOut(auth);
window.closeRetreConfirm = () => document.getElementById('modal-confirm-retre').classList.add('hidden');
window.handleForgotPassword = () => {
    const email = prompt("Ekri email ou:");
    if(email) sendPasswordResetEmail(auth, email).then(() => alert("Lyen reset la voye!"));
};

// CAROUSEL
let index = 0;
setInterval(() => {
    const slides = document.querySelector(".slides");
    if(slides) {
        index = (index + 1) % 5;
        slides.style.transform = `translateX(-${index * 100}%)`;
    }
}, 3500);
    



// ==========================================
// A. CAROUSEL AKÈY OTOMATIK (FIX)
// ==========================================
let currentIdx = 0;
const runCarousel = () => {
    const slider = document.getElementById('carousel-slider');
    const slides = document.querySelectorAll('#carousel-slider .slide');
    if (!slider || slides.length === 0) return;

    setInterval(() => {
        currentIdx = (currentIdx + 1) % slides.length;
        slider.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        slider.style.transform = `translateX(-${currentIdx * 100}%)`;
    }, 3500);
};
runCarousel();



// Fonksyon pou klike sou yon liy nan tablo a pou wè detay (Opsyonèl)
window.showTransactionDetail = (id) => {
    const tr = cacheTransactions.find(t => t.id === id);
    if(!tr) return;
    
    // Ou ka kreye yon alert pwofesyonèl oswa yon modal isit la
    alert(`Detay Tranzaksyon:\n------------------\nID: ${id}\nTip: ${tr.type}\nMontan: ${tr.amount || tr.montan} HTG\nStatus: ${tr.status}`);
};
            
