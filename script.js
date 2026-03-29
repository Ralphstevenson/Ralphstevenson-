/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V3 - KONPLE NET
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp, get, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- FONKSYON POU VOYE MESAJ NAN KLÒCH (NOTIFIKASYON) ---
window.voyeNotifikasyon = async (uid, tit, mesaj) => {
    const notifRef = push(ref(db, `notifications/${uid}`));
    await set(notifRef, {
        title: tit,
        message: mesaj,
        date: new Date().toLocaleString(),
        read: false,
        timestamp: serverTimestamp()
    });
};

// II. OTANTIFIKASYON (LOGIN / SIGNUP)
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            window.voyeNotifikasyon(userCredential.user.uid, "Bon retou!", "Ou konekte ak siksè sou Echanj Plus.");
        })
        .catch(err => alert("Erè: Email oswa Modpas pa bon."));
};

window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const sponsorInput = document.getElementById('sponsor-input')?.value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) {
        return alert("Modpas la dwe gen 6 karaktè ak yon Majiskil.");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000); 

        await set(ref(db, `users/${uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0.00,
            status: "active",
            sponsor_id: sponsorInput || null,
            bonus_claimed: false,
            createdAt: serverTimestamp()
        });

        await set(ref(db, `ars_mapping/${arsID}`), { uid: uid });
        
        if (sponsorInput) {
            const mappingSnap = await get(ref(db, `ars_mapping/${sponsorInput}`));
            if (mappingSnap.exists()) {
                const sponsorUid = mappingSnap.val().uid;
                const inviteRef = push(ref(db, `users/${sponsorUid}/referral_data/invite_list`));
                await set(inviteRef, {
                    uid: uid, name: name, date: new Date().toLocaleDateString(), status: "Pending"
                });
                await update(ref(db, `users/${sponsorUid}/referral_data`), { total_invites: increment(1) });
            }
        }
        
        window.voyeNotifikasyon(uid, "Byenveni!", `Byenveni sou Echanj Plus, ${name}! Kòd ARS ou se ${arsID}.`);

    } catch (err) { alert("Erè Enskripsyon: " + err.message); }
};

// III. DISTRIBISYON BONIS (ADMIN AP DEKLANCHE SA LÈ ECHANJ FIN REYISI)
window.distribyeBonisOtomatik = async (uid, montantHTG) => {
    try {
        const userSnap = await get(ref(db, `users/${uid}`));
        const userData = userSnap.val();

        if (userData.sponsor_id && userData.bonus_claimed === false) {
            const bonusKliyan = montantHTG * 0.02; // 2% Rabè
            const komisyonParenn = montantHTG * 0.045; // 4.5% Komisyon

            // 1. Bay Kliyan an
            await update(ref(db, `users/${uid}`), {
                balance: increment(bonusKliyan),
                bonus_claimed: true 
            });
            window.voyeNotifikasyon(uid, "Bonis Aktive!", `Ou resevwa ${bonusKliyan} HTG (2%) kòm rabè sou premye echanj ou!`);

            // 2. Bay Parenn nan
            const mappingSnap = await get(ref(db, `ars_mapping/${userData.sponsor_id}`));
            if (mappingSnap.exists()) {
                const sponsorUid = mappingSnap.val().uid;
                await update(ref(db, `users/${sponsorUid}/referral_data`), {
                    balance: increment(komisyonParenn),
                    total_earned: increment(komisyonParenn)
                });
                
                window.voyeNotifikasyon(sponsorUid, "Komisyon Resevwa!", `Ou fè ${komisyonParenn} HTG komisyon sou echanj ${userData.fullname} fè.`);
            }
        }
    } catch (err) { console.error("Erè Bonis:", err); }
};

// IV. NAVIGASYON & LISTENERS
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        loadUserData(user.uid);
        if (window.listenToMessages) window.listenToMessages(user.uid);
        localStorage.removeItem('pending_sponsor_code');
    } else {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('home-page').classList.add('hidden');
        setTimeout(() => { if (window.detecterSponsorURL) window.detecterSponsorURL(); }, 1000);
    }
});

function loadUserData(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('user-balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('side-name').innerText = data.fullname || "...";
        document.getElementById('side-id').innerText = data.arsID || "---";
        document.getElementById('side-email').innerText = data.email ? data.email.replace(/(.{3})(.*)(?=@)/, "$1***") : "...";
    });
}

window.toggleAuth = (type) => {
    if (type === 'signup') {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('signup-section').classList.remove('hidden');
    } else {
        document.getElementById('signup-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
    }
};

window.showPage = async (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj'];
    sections.forEach(id => { document.getElementById(id)?.classList.add('hidden'); });
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');
    
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    if (pageId === 'paj-parennaj' && window.initReferralDashboard) window.initReferralDashboard(auth.currentUser.uid);
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    if (pageId === 'paj-akey') startCarousel();
};

// V. LOJIK ECHANJ
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (Minit " + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");
    const transID = "ECH-" + Date.now();
    
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid, type: "Echanj", rezo: rezo, amount: parseFloat(montan), status: "En attente", timestamp: serverTimestamp()
    });
    
    window.voyeNotifikasyon(auth.currentUser.uid, "Tranzaksyon Voye", `Echanj ${montan} HTG ou a ap tann validasyon admin.`);
    
    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

// VI. UI AUTOMATION
window.toggleSidebar = () => { document.getElementById('sidebar').classList.toggle('active'); };

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
           
