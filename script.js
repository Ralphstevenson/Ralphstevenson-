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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

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

        // --- KONEKSYON CHAT (Liy pou w ajoute a) ---
        if (window.listenToMessages) {
            window.listenToMessages(user.uid);
        }

        // LANSE ISTORIK LA
        setupHistoryListener(user.uid);
        
        // Kòd ou a ap kontinye ak userRef la...
        

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
// III. LOJIK RETRÈ PWOFESYONÈL (ECHANJ PLUS)
// ==========================================

// 1. Fonksyon pou ouvè modal konfimasyon an
window.openRetreConfirm = () => {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montanInput = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanInput);

    // Sekirite: Tcheke si chan yo vid
    if (!non || !tel || !montanInput || montan <= 0) {
        alert("⚠️ Tanpri ranpli tout chan yo kòrèkteman.");
        return;
    }

    // Sekirite: Tcheke si balans lan ase
    if (montan > userData.balance) {
        alert(`❌ Balans ou twò piti. Ou gen ${userData.balance.toFixed(2)} HTG.`);
        return;
    }

    // Kalkil rès balans (Lojik 12)
    const resBalans = userData.balance - montan;

    // Afiche enfòmasyon yo nan modal la (Lojik 15)
    // N.B. Si ID sa yo pa nan HTML ou, JS la p'ap kraze, l'ap jis sote yo
    const spanMontan = document.getElementById('confirm-amount-retre');
    const spanNon = document.getElementById('confirm-name-retre'); // Ajoute ID sa si w vle non an parèt
    const spanRes = document.getElementById('confirm-res-balance'); // Ajoute ID sa pou rès balans

    if (spanMontan) spanMontan.innerText = montan.toFixed(2) + " HTG";
    if (spanNon) spanNon.innerText = non;
    if (spanRes) spanRes.innerText = resBalans.toFixed(2) + " HTG";

    // Louvri modal konfimasyon an
    const modalConfirm = document.getElementById('modal-confirm-retre');
    if (modalConfirm) modalConfirm.classList.remove('hidden');
};

// 2. Fonksyon pou fèmen modal la
window.closeRetreConfirm = () => {
    const modalConfirm = document.getElementById('modal-confirm-retre');
    if (modalConfirm) modalConfirm.classList.add('hidden');
};

// 3. Fonksyon final pou voye retrè a nan Firebase
window.submitRetre = async () => {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    // Fèmen modal konfimasyon an
    window.closeRetreConfirm();

    try {
        // Kreye yon ID tranzaksyon inik
        const transID = "RET-" + Date.now();
        
        // Save nan Firebase Realtime Database
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            arsID: userData.arsID,
            fullname: userData.fullname,
            type: "Retrè",
            method: metod,
            phone: tel,
            receiver: non,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        });

        // Montre Modal Siksè a (Lojik lordicon 5 segond)
        const successModal = document.getElementById('modal-success');
        if (successModal) {
            successModal.classList.remove('hidden');
            
            // Delè 5 segond anvan redireksyon
            setTimeout(() => {
                successModal.classList.add('hidden');
                
                // Vide fòm nan
                document.getElementById('retre-name').value = "";
                document.getElementById('retre-phone').value = "";
                document.getElementById('retre-amount').value = "";

                // Voye kliyan an sou Akèy
                window.showPage('paj-akey', document.querySelector('.nav-item'));
            }, 5000);
        } else {
            alert("✅ Tranzaksyon Reyisi!");
            window.showPage('paj-akey', document.querySelector('.nav-item'));
        }

    } catch (error) {
        alert("❌ Erè: " + error.message);
    }
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
// CAROUSEL OTOMATIK (ECHANJ PLUS 2026)
// ==========================================
function komanseCarousel() {
    const slider = document.getElementById('carousel-slider');
    const slides = document.querySelectorAll('#carousel-slider .slide');
    
    // Si slider a pa egziste nan paj la, pa fè anyen
    if (!slider || slides.length === 0) return;

    let index = 0;
    const totalSlides = slides.length;

    // Fonksyon pou deplase imaj yo
    function gliseImaj() {
        index++;
        
        // Si nou rive nan dènye imaj la, tounen nan premye a
        if (index >= totalSlides) {
            index = 0;
        }

        // Aplike tranzisyon an (100% vle di deplase yon foto konplè)
        slider.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        slider.style.transform = `translateX(-${index * 100}%)`;
    }

    // Chanje foto chak 3.5 segonn (3500ms)
    setInterval(gliseImaj, 3500);
}

// Lanse carousel la depi paj la chaje
document.addEventListener('DOMContentLoaded', komanseCarousel);
