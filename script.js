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

window.kalkileEchanj = () => {
    const montanVal = document.getElementById('input-montan').value;
    const montan = parseFloat(montanVal);
    if (montan && montan >= 10) {
        const fre = montan * 0.165;
        const net = montan - fre;
        document.getElementById('res-fre').innerText = `- ${fre.toFixed(2)} HTG`;
        document.getElementById('res-net').innerText = `${net.toFixed(2)} HTG`;
    } else {
        document.getElementById('res-fre').innerText = "0.00 HTG";
        document.getElementById('res-net').innerText = "0.00 HTG";
    }
};

// Lojik Patenè / Theme
function adaptTheme() {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 6;
    document.documentElement.setAttribute('data-theme', isNight ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
    adaptTheme();
    startCarousel();
});



/* ==========================================
   JS ELITE - SISTÈM PARENNAJ ECHANJ PLUS
   ========================================== */

// 1. DETEKTE SPONSOR NAN URL (Eg: ?ref=ARS-123)
window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref && ref.startsWith('ARS-')) {
        // Sere kòd la nan memwa navigatè a
        localStorage.setItem('pending_sponsor_code', ref);
        
        // Ranpli input nan seksyon Auth la si l egziste
        const sInput = document.getElementById('sponsor-input');
        const badge = document.getElementById('badge-ref-status');
        if (sInput) {
            sInput.value = ref;
            if(badge) badge.style.display = "block"; // Montre ti vèt la
        }

        // Prepare ak Montre Modal Felisitasyon an
        const displaySponsor = document.getElementById('display-sponsor-id');
        if (displaySponsor) {
            displaySponsor.innerText = "Kòd: " + ref;
        }
        
        // Louvri modal la apre 1.5 segonn pou moun nan fin wè paj la
        setTimeout(() => {
            const modalRabe = document.getElementById('modal-rabe');
            if (modalRabe) modalRabe.classList.remove('hidden');
        }, 1500);
    }
};

// 2. CHANGER PAJ (SIDEBAR)
window.showPage = (pageId) => {
    // Kache tout seksyon
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Montre paj ki klike a
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        
        // Si se paj parennaj, mete ID itilizatè a nan input la
        if (pageId === 'paj-parennaj') {
            const myARS = localStorage.getItem('user_ars_id') || "ARS-CHACHE";
            document.getElementById('my-ref-code').value = myARS;
        }
    }

    // Fèmen Sidebar la otomatikman
    const sidebar = document.querySelector('.sidebar-pro');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
};

// 3. KOPIYE KÒD ARS
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    kodInput.select();
    kodInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(kodInput.value);
    
    alert("Kòd ou kopiye! Koulye a, pataje l pou w fè kòb.");
};

// 4. PATAJE SOU WHATSAPP
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `Bonjou! M ap envite w sou Echanj Plus. Sèvi ak kòd mwen an (${myCode}) pou w jwenn 2% rabè sou premye echanj ou. Enskri isit la: ${siteLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// 5. DEMANN TRANSFÈ KOMISYON (Lojik Sekirite)
window.demannTransfere = () => {
    const balansKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    const btn = document.getElementById('btn-transfer-komisyon');

    if (balansKomisyon < 50) {
        alert("Atansyon: Ou bezwen omwen 50 HTG nan komisyon pou w fè transfè sa a.");
        return;
    }

    const konfime = confirm(`Èske ou vle voye ${balansKomisyon} HTG nan balans prensipal ou?`);
    
    if (konfime) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Operasyon ap fèt...';

        // Simulation Firebase (W ap bezwen kòd Firestore la isit la)
        setTimeout(() => {
            alert("Transfè reyisi! Kòb la moute nan balans ou.");
            document.getElementById('komisyon-balans').innerText = "0.00";
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Transfere nan Balans Prensipal';
        }, 2000);
    }
};

// 6. AFICHE LIS EKIP LA (Done ki soti nan Firebase)
window.renderTeamList = (dataFromFirebase) => {
    const container = document.getElementById('container-lis-envite');
    const badge = document.getElementById('total-invites');

    if (!dataFromFirebase || dataFromFirebase.length === 0) {
        container.innerHTML = '<p class="empty-msg">Ou poko gen okenn moun nan ekip ou a.</p>';
        badge.innerText = "0";
        return;
    }

    badge.innerText = dataFromFirebase.length;
    container.innerHTML = ""; 

    dataFromFirebase.forEach(moun => {
        const item = document.createElement('div');
        item.className = 'invite-item';
        item.innerHTML = `
            <span class="user-id-ref">${moun.id}</span>
            <span class="status-first-trans ${moun.status === 'validé' ? 'done' : 'pending'}">
                ${moun.status === 'validé' ? 'Touche' : 'An tann'}
            </span>
        `;
        container.appendChild(item);
    });
};

// 7. FONKSYON POU TOOGLE MODAL YO
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// INITIALISATION LÈ PAJ LA LOUVRI
document.addEventListener('DOMContentLoaded', () => {
    window.detecterSponsorURL();
});
    
