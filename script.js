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

// Login
window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Tanpri ranpli tout chan yo!");

    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè: Email oswa Modpas pa bon."));
};

// Signup
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

// Logout
window.handleLogout = () => signOut(auth);

// ==========================================
// III. NAVIGASYON (BRANCHMAN PWOFESYONÈL)
// ==========================================

window.showPage = async (pageId, navElement) => {
    // 1. Kache tout seksyon
    const sections = ['paj-akey', 'paj-echanj', 'paj-retre', 'paj-trans', 'chat-container'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // 2. Montre paj ki klike a
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // 3. BRANCHMAN RETRÈ (Lojik Enjeksyònman)
    if (pageId === 'paj-retre') {
        if (window.enjekteHtmlRetre) {
            await window.enjekteHtmlRetre();
        }
    }

    // 4. Update klas active nan navbar
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (navElement) navElement.classList.add('active');

    // 5. Relanse Carousel si se akey
    if (pageId === 'paj-akey') startCarousel();
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('active');
};

// ==========================================
// IV. LOJIK SISTÈM (DONE YO)
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('home-page').classList.remove('hidden');
        
        loadUserData(user.uid);
        loadTransactions(user.uid);
        
        // Chat listener
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

        // Mete done yo nan UI a
        const balEl = document.getElementById('user-balance');
        if (balEl) balEl.innerText = data.balance.toFixed(2);
        
        document.getElementById('side-name').innerText = data.fullname;
        document.getElementById('side-id').innerText = data.arsID;
        
        // Maskay email (Lojik 6)
        document.getElementById('side-email').innerText = data.email.replace(/(.{3})(.*)(?=@)/, "$1***");
    });
}

function loadTransactions(uid) {
    onValue(ref(db, `transactions`), (snap) => {
        const list = document.getElementById('transaction-list');
        if (!list) return;
        list.innerHTML = "";
        
        const data = snap.val();
        if (data) {
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp); 

            myTrans.forEach(t => {
                const statusClass = `status-${t.status.toLowerCase().replace(" ", "-")}`;
                list.innerHTML += `
                    <div class="transaction-item" style="border-left: 5px solid var(--${t.status === 'Validé' ? 'success' : (t.status === 'Refusé' ? 'danger' : 'warning')})">
                        <div><b>${t.type} ${t.rezo || ''}</b><br><small>${new Date(t.timestamp).toLocaleString()}</small></div>
                        <div style="text-align:right"><b>${t.amount} HTG</b><br><span class="status-badge ${statusClass}">${t.status}</span></div>
                    </div>`;
            });
        }
    });
}

// Lojik Echanj
window.openDialer = async (rezo) => {
    const montan = prompt("Konbyen minit w ap vann (Minit " + rezo + ")?");
    if (!montan || montan < 100) return alert("Minimòm se 100 HTG.");

    const transID = "ECH-" + Date.now();
    await set(ref(db, `transactions/${transID}`), {
        uid: auth.currentUser.uid,
        type: "Echanj",
        rezo: rezo,
        amount: montan,
        status: "En attente",
        timestamp: serverTimestamp()
    });

    const ussd = rezo === 'digicel' ? `*128*50947111123*${montan}#` : `*123*88888888*32160708*${montan}#`;
    window.location.href = `tel:${encodeURIComponent(ussd)}`;
};

// ==========================================
// V. UI AUTOMATION
// ==========================================

let slideIndex = 0;
window.startCarousel = () => {
    const slides = document.querySelector('.slides');
    if (!slides) return;
    
    // Clear any existing interval to prevent speed-up
    if (window.carouselInterval) clearInterval(window.carouselInterval);
    
    window.carouselInterval = setInterval(() => {
        slideIndex = (slideIndex + 1) % 3; // 3 slides
        slides.style.transform = `translateX(-${slideIndex * 100}%)`;
    }, 4000);
};

// Night Mode (6h PM)
if (new Date().getHours() >= 18 || new Date().getHours() < 6) {
    document.body.classList.add('night-mode');
}
