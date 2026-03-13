import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// Inisyalize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Nou kreye yon varyab global pou kenbe done itilizatè a
export let userData = null;

// ==========================================
// II. GESTYON AUTH & DONE DIRÈK
// ==========================================

onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        // Itilizatè a konekte
        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // Chaje Paj Akèy la imedyatman si anyen poko chaje
        if (window.showPage) {
            const akeySec = document.getElementById('paj-akey');
            if (akeySec && akeySec.innerHTML.trim() === "") {
                window.showPage('paj-akey');
            }
        }

        // Koute done itilizatè a (Balans, ARS-ID, elatriye)
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snap) => {
            userData = snap.val();
            if (userData) {
                // Si itilizatè a poko gen ARS-ID, nou kreye youn
                if (!userData.arsID) {
                    const newID = "ARS-" + Math.floor(100000 + Math.random() * 900000);
                    update(userRef, { arsID: newID });
                    return;
                }
                updateAllUIComponents(userData);
            }
        });

    } else {
        // Itilizatè a dekonekte
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// ==========================================
// III. MISYON: METE DONE NAN TOUT PAJ YO
// ==========================================
function updateAllUIComponents(data) {
    const formatBalans = `${data.balance.toFixed(2)} HTG`;

    // 1. Sidebar
    if (document.getElementById('side-name')) document.getElementById('side-name').innerText = data.fullname;
    if (document.getElementById('side-id')) document.getElementById('side-id').innerText = data.arsID;
    if (document.getElementById('side-email')) {
        let [u, d] = data.email.split("@");
        document.getElementById('side-email').innerText = u.substring(0,2) + "***@" + d;
    }

    // 2. Paj Akèy (Lè li chaje)
    const elBalansAkey = document.getElementById('user-balance');
    if (elBalansAkey) elBalansAkey.innerText = data.balance.toFixed(2);

    // 3. Paj Retrè (Lè li chaje)
    const elBalansRetre = document.getElementById('retre-display-balance');
    const elIdRetre = document.getElementById('display-ars-id');
    if (elBalansRetre) elBalansRetre.innerText = formatBalans;
    if (elIdRetre) elIdRetre.innerText = data.arsID;
}

// ==========================================
// IV. FONKSYON LOGIN / SIGNUP (Globale)
// ==========================================

window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert("Ranpli tout chan yo!");

    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè: " + err.message));
};

window.handleSignup = () => {
    const name = document.getElementById('sign-name').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value.trim();

    if (!name || !email || pass.length < 6) return alert("Verifye enfòmasyon yo!");

    createUserWithEmailAndPassword(auth, email, pass).then((res) => {
        set(ref(db, `users/${res.user.uid}`), {
            fullname: name,
            email: email,
            phone: phone,
            balance: 0,
            arsID: "",
            createdAt: serverTimestamp()
        });
    }).catch(err => alert(err.message));
};

window.handleLogout = () => signOut(auth);

window.toggleAuth = (type) => {
    document.getElementById('login-section').classList.toggle('hidden', type === 'signup');
    document.getElementById('signup-section').classList.toggle('hidden', type === 'login');
};
                        
