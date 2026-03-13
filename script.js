import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIGURATION FIREBASE
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
// I. OTANTIFIKASYON & SEKIRITE (Lojik 1-9)
// ==========================================

onAuthStateChanged(auth, (user) => {
    const authPage = document.getElementById('auth-page');
    const homePage = document.getElementById('home-page');

    if (user) {
        // Lojik 3: Verifikasyon Email
        if (!user.emailVerified) {
            alert("Tanpri verifye email ou nan bwat mesaj ou anvan ou konekte.");
            signOut(auth);
            return;
        }

        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // Lojik 8: Last Login
        update(ref(db, `users/${user.uid}`), { lastLogin: serverTimestamp() });

        // Kòmanse koute done yo (Lojik 10)
        kouteDoneItilizatè(user.uid);

        // Chaje paj akey la otomatikman
        if (window.showPage) window.showPage('paj-akey');

    } else {
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// Lojik 9: Netwayaj (Trim) & Lojik 2: Modpas Fò
window.handleSignup = async () => {
    const non = document.getElementById('sign-name').value.trim();
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value.trim();
    const refCode = document.getElementById('sign-ref').value.trim();
    const terms = document.getElementById('accept-terms').checked;

    if (!terms) return alert("Ou dwe asepte kondisyon yo.");
    if (pass[0] !== pass[0].toUpperCase()) return alert("Modpas la dwe kòmanse ak yon lèt majiskil (Lojik 2).");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        // Lojik 7: Jenere ARS-ID
        const arsID = "ARS-" + Math.floor(100000 + Math.random() * 900000);
        
        await set(ref(db, `users/${res.user.uid}`), {
            fullname: non,
            email: email,
            phone: phone,
            arsID: arsID,
            referBy: refCode || "none",
            balance: 0,
            points: 0,
            status: "active",
            createdAt: serverTimestamp()
        });

        await sendEmailVerification(res.user);
        alert("Bravo! Tcheke email ou pou verifye kont ou an.");
        signOut(auth);
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Email oswa Modpas pa bon"));
};

// ==========================================
// II. GESTYON DONE REYÈL (Lojik 10-14)
// ==========================================

function kouteDoneItilizatè(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Lojik 6: Maskay Email
        let [u, d] = data.email.split("@");
        const emailMasked = u.substring(0, 3) + "***@" + d;

        // Mete done nan tout ID ki disponib yo (Penetrasyon Done)
        updateElement('side-name', data.fullname);
        updateElement('side-id', data.arsID);
        updateElement('side-email', emailMasked);
        updateElement('user-balance', data.balance.toFixed(2));
        updateElement('retre-display-balance', data.balance.toFixed(2) + " HTG");
        updateElement('display-ars-id', data.arsID);
    });
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// Lojik 29: Night Mode Otomatik
if (new Date().getHours() >= 18 || new Date().getHours() < 6) {
    document.body.classList.add('night-mode');
               }
  
