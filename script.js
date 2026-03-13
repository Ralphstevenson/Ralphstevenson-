 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Lojik 1: Konfigirasyon Sekirite SSL/Firebase
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
            alert("Verifye email ou anvan ou konekte! Tcheke bwat mesaj ou.");
            signOut(auth);
            return;
        }

        authPage.classList.add('hidden');
        homePage.classList.remove('hidden');

        // Lojik 8: Anrejistre Last-Login
        update(ref(db, `users/${user.uid}`), { lastLogin: serverTimestamp() });

        // Deklanche Lojik 10 (Balans) ak Lojik 7 (ARS-ID)
        kouteDoneItilizatè(user.uid);

        // Lojik 5: Auto-Logout apre 30 minit
        resetInactivityTimer();

        // Navigasyon otomatik sou akey
        if (window.showPage) window.showPage('paj-akey');

    } else {
        authPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
});

// Lojik 9: Netwayaj (Trim) & Lojik 2: Modpas Fò
window.handleSignup = async () => {
    const non = document.getElementById('sign-name').value.trim(); // Trim
    const email = document.getElementById('sign-email').value.trim();
    const pass = document.getElementById('sign-pass').value;
    const phone = document.getElementById('sign-phone').value.trim();
    const terms = document.getElementById('accept-terms').checked;

    if (!terms) return alert("Ou dwe asepte kondisyon yo.");
    // Lojik 2: Majiskil nan kòmansman
    if (pass[0] !== pass[0].toUpperCase()) return alert("Modpas la dwe kòmanse ak yon lèt Majiskil!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        
        // Lojik 7: Jenere ARS-ID Otomatik
        const arsID = "ARS-" + Math.floor(100000 + Math.random() * 900000);
        
        await set(ref(db, `users/${res.user.uid}`), {
            fullname: non,
            email: email,
            phone: phone,
            arsID: arsID,
            balance: 0,
            points: 0,
            status: "active",
            createdAt: serverTimestamp()
        });

        await sendEmailVerification(res.user);
        alert("Enskripsyon reyisi! 👋 Yon mesaj verifikasyon voye nan email ou.");
        signOut(auth);
    } catch (e) { alert("Erè: " + e.message); }
};

window.handleLogin = () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Email oswa Modpas pa bon"));
};

// ==========================================
// II. GESTYON DONE REYÈL (Lojik 10-14)
// ==========================================

function kouteDoneItilizatè(uid) {
    onValue(ref(db, `users/${uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        // Lojik 7: Si ansyen kont lan pat gen ID, jenere youn
        if (!data.arsID) {
            const nouvoID = "ARS-" + Math.floor(100000 + Math.random() * 900000);
            update(ref(db, `users/${uid}`), { arsID: nouvoID });
        }

        // Lojik 6: Maskay Email pou vi prive
        let [u, d] = data.email.split("@");
        const emailMasked = u.substring(0, 3) + "***@" + d;

        // Pénétrasyon Done nan UI a
        updateElement('side-name', data.fullname);
        updateElement('side-id', data.arsID);
        updateElement('side-email', emailMasked);
        updateElement('side-phone', data.phone || "Nimewo pa disponib");
        updateElement('user-balance', data.balance.toFixed(2));
        updateElement('retre-display-balance', data.balance.toFixed(2) + " HTG");
    });
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// ==========================================
// III. SIPÒ & AUTOMATISATION (25-29)
// ==========================================

// Lojik 28: Night Mode Otomatik (6h PM - 6h AM)
function checkNightMode() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }
}
checkNightMode();

// Lojik 5: Auto-Logout System
let logoutTimer;
function resetInactivityTimer() {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        alert("Ou pase 30 minit san ou pa fè anyen, sistèm nan dekonekte ou pou sekirite.");
        signOut(auth);
    }, 1800000); // 30 minit
}

// Lojik 29: Carousel Otomatik (4 segonn)
window.startCarousel = () => {
    const slides = document.querySelector('.slides');
    if (!slides) return;
    let index = 0;
    setInterval(() => {
        index = (index + 1) % 3; // sipoze gen 3 slides
        slides.style.transform = `translateX(-${index * 100}%)`;
    }, 4000);
};

window.handleLogout = () => signOut(auth);
                                          
