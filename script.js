/* ============================================================
   GWO JS (SÈVO SANTRAL) - ECHANJ PLUS V3 - KONPLE NET (KORIJE)
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

// --- II. SISTÈM NOTIFIKASYON (KLÒCH) ---
let currentNotifTab = 'koneksyon'; 

window.voyeNotifikasyon = async (uid, tit, mesaj) => {
    const notifRef = push(ref(db, `notifications/${uid}`));
    await set(notifRef, {
        title: tit,
        message: mesaj,
        date: new Date().toLocaleString('fr-FR'),
        read: false,
        timestamp: serverTimestamp()
    });
};

window.toggleNotifPanel = () => {
    document.getElementById('notif-panel').classList.toggle('active');
};

window.switchNotifTab = (tab) => {
    currentNotifTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    chajeNotifikasyonUI();
};

function chajeNotifikasyonUI() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    onValue(ref(db, `notifications/${uid}`), (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('notif-content');
        const badge = document.getElementById('notif-badge');
        
        if (!data) {
            container.innerHTML = '<p class="empty-msg">Pa gen notifikasyon.</p>';
            badge.classList.add('hidden');
            return;
        }

        const notifList = Object.values(data).reverse();
        
        // FILTRAJ KORIJE: Nou asire nou kouvri plis mo kle
        const filtred = notifList.filter(n => {
            const t = n.title.toLowerCase();
            const m = n.message.toLowerCase(); // Nou gade nan mesaj la tou
            
            if (currentNotifTab === 'koneksyon') {
                return t.includes("byenveni") || t.includes("retou") || t.includes("konekte") || t.includes("koneksyon");
            } else {
                // Lis mo kle pou tranzaksyon yo pi laj
                return t.includes("tranzaksyon") || t.includes("bonis") || t.includes("komisyon") || 
                       t.includes("echanj") || t.includes("retrè") || t.includes("voye") || 
                       m.includes("htg") || t.includes("validasyon");
            }
        });

        const unreadCount = notifList.filter(n => n.read === false).length;
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        container.innerHTML = filtred.length === 0 
            ? `<p class="empty-msg">Pa gen anyen nan ${currentNotifTab}.</p>`
            : filtred.map(n => `
                <div class="notif-item">
                    <div class="notif-icon"><i class="fas fa-bell"></i></div>
                    <div class="notif-text">
                        <b>${n.title}</b>
                        <p>${n.message}</p>
                        <small>${n.date}</small>
                    </div>
                </div>`).join('');
    });
}

// --- III. OTANTIFIKASYON (LOGIN / SIGNUP) ---
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout chan yo!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then((u) => {
            window.voyeNotifikasyon(u.user.uid, "Koneksyon Reyisi", "Ou konekte ak siksè sou kont Echanj Plus ou.");
        })
        .catch(() => alert("Erè: Email oswa Modpas pa bon."));
};

window.handleSignup = async () => {
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const name = document.getElementById('sign-name').value.trim();
    const phone = document.getElementById('sign-phone').value.trim();
    const sponsorInput = document.getElementById('sponsor-input')?.value.trim();

    if (pass.length < 6 || !/[A-Z]/.test(pass)) return alert("Modpas la dwe gen 6 karaktè ak yon Majiskil.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        const arsID = "ARS-" + Math.floor(1000 + Math.random() * 9000); 

        await set(ref(db, `users/${uid}`), {
            fullname: name, email: email, phone: phone, arsID: arsID,
            balance: 0.00, status: "active", sponsor_id: sponsorInput || null,
            bonus_claimed: false, createdAt: serverTimestamp()
        });

        await set(ref(db, `ars_mapping/${arsID}`), { uid: uid });
        
        if (sponsorInput) {
            const mappingSnap = await get(ref(db, `ars_mapping/${sponsorInput}`));
            if (mappingSnap.exists()) {
                const sponsorUid = mappingSnap.val().uid;
                const inviteRef = push(ref(db, `users/${sponsorUid}/referral_data/invite_list`));
                await set(inviteRef, { uid, name, arsID, date: new Date().toLocaleDateString(), status: "Pending" });
                await update(ref(db, `users/${sponsorUid}/referral_data`), { total_invites: increment(1) });
                window.voyeNotifikasyon(sponsorUid, "Nouvo Envite Tranzaksyon", `${name} enskri ak kòd ou.`);
            }
        }
        window.voyeNotifikasyon(uid, "Byenveni Koneksyon", `Byenveni ${name}! Kòd ou se ${arsID}.`);
    } catch (err) { alert("Erè: " + err.message); }
};

// --- IV. DISTRIBISYON BONIS (ADMIN) ---
window.distribyeBonisOtomatik = async (uid, montantHTG) => {
    try {
        const userSnap = await get(ref(db, `users/${uid}`));
        const userData = userSnap.val();
        if (userData.sponsor_id && !userData.bonus_claimed) {
            const bonusKliyan = montantHTG * 0.02;
            const komisyonParenn = montantHTG * 0.045;

            await update(ref(db, `users/${uid}`), { balance: increment(bonusKliyan), bonus_claimed: true });
            window.voyeNotifikasyon(uid, "Bonis Tranzaksyon", `Ou resevwa ${bonusKliyan.toFixed(2)} HTG (2%) rabè.`);

            const mappingSnap = await get(ref(db, `ars_mapping/${userData.sponsor_id}`));
            if (mappingSnap.exists()) {
                const sUid = mappingSnap.val().uid;
                await update(ref(db, `users/${sUid}/referral_data`), { balance: increment(komisyonParenn), total_earned: increment(komisyonParenn) });
                window.voyeNotifikasyon(sUid, "Komisyon Tranzaksyon", `Ou fè ${komisyonParenn.toFixed(2)} HTG sou ${userData.fullname}.`);
            }
        }
    } catch (err) { console.error(err); }
};

// --- V. NAVIGASYON & LISTENERS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        loadUserData(user.uid);
        chajeNotifikasyonUI(); // Lanse sistèm notifikasyon an
        if (window.listenToMessages) window.listenToMessages(user.uid);
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

window.handleLogout = () => { if (confirm("Dekonekte?")) signOut(auth); };

window.showPage = (pageId, navElement) => {
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container', 'paj-parennaj'];
    sections.forEach(id => { document.getElementById(id)?.classList.add('hidden'); });
    document.getElementById(pageId)?.classList.remove('hidden');
    
    if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    if (pageId === 'paj-parennaj' && window.initReferralDashboard) window.initReferralDashboard(auth.currentUser.uid);
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    if (pageId === 'paj-akey') startCarousel();
};

// --- VI. LOJIK ECHANJ ---
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (" + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");
    const transID = "ECH-" + Date.now();
    
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid, type: "Echanj", rezo, amount: parseFloat(montan), status: "En attente", timestamp: serverTimestamp()
    });
    
    window.voyeNotifikasyon(auth.currentUser.uid, "Tranzaksyon Voye", `Echanj ${montan} HTG ap tann validasyon.`);
    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('active');

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
       
