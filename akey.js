// ==========================================================================
// KÒD JS KONPLÈ POU PAJ AKÈY (ECHANJ PLUS 2026) - DÈNE DIREK NAN FIREBASE
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Konfigirasyon Firebase ou a
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

// 2. Inisyalize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 3. Koute si yon itilizatè konekte pou chaje enfòmasyon pèsonèl li yo
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        // Chaje Balans an tan reyèl
        kouteBalansItilizatè(uid);
        // Chaje 3 dènye tranzaksyon pèsonèl itilizatè a
        sarajDènyeAktivite(uid);
    } else {
        // Redireksyon oswa reset si moun nan dekonekte
        const balanceEl = document.getElementById("user-balance");
        if (balanceEl) balanceEl.innerText = "0.00";
    }
});

// --- FONKSYON 1: KOUTE BALANS ITILIZATÈ ---
function kouteBalansItilizatè(uid) {
    const balanceRef = ref(db, `users/${uid}/balance`);
    onValue(balanceRef, (snapshot) => {
        const balanceEl = document.getElementById("user-balance");
        if (balanceEl) {
            if (snapshot.exists()) {
                const balance = snapshot.val();
                balanceEl.innerText = parseFloat(balance).toFixed(2);
            } else {
                balanceEl.innerText = "0.00";
            }
        }
    });
}

// --- FONKSYON 2: KANTITE TRANZAKSYON JODI A (GLOBAL) ---
const toutTransRef = ref(db, 'transactions');
onValue(toutTransRef, (snapshot) => {
    const liveStatEl = document.getElementById("live-stat-count");
    if (!liveStatEl) return;

    if (snapshot.exists()) {
        const done = snapshot.val();
        let kontèJodiA = 0;
        
        // Jwenn dat jodi a nan fòma YYYY-MM-DD
        const jodiA = new Date().toISOString().split('T')[0];

        Object.values(done).forEach(trans => {
            if (trans.date && trans.date.includes(jodiA)) {
                kontèJodiA++;
            }
        });

        // Si pa gen tranzaksyon jodi a, bay yon simulation baz pwofesyonèl pou sit la pa vid (Ex: 35 + chif o azar)
        liveStatEl.innerText = kontèJodiA > 0 ? kontèJodiA : Math.floor(Math.random() * 15) + 35;
    } else {
        liveStatEl.innerText = "42"; // Valè simulation si branch lan vid nèt
    }
});

// --- FONKSYON 3: ESTATI PÒTAY PEMAN YO (SYSTEM STATUS) ---
const statusRef = ref(db, 'system_status');
onValue(statusRef, (snapshot) => {
    const moncashTxt = document.getElementById("moncash-status");
    const moncashDot = document.getElementById("moncash-dot");
    const natcashTxt = document.getElementById("natcash-status");
    const natcashDot = document.getElementById("natcash-dot");

    if (snapshot.exists()) {
        const status = snapshot.val();

        // Jere MonCash
        if (status.moncash && moncashTxt && moncashDot) {
            moncashTxt.innerText = status.moncash;
            if (status.moncash.toLowerCase() === "operasyonèl" || status.moncash.toLowerCase() === "en ligne") {
                moncashTxt.style.color = "#2e7d32";
                moncashDot.className = "dot-status status-active";
            } else {
                moncashTxt.style.color = "#c62828";
                moncashDot.className = "dot-status status-down";
            }
        }

        // Jere NatCash
        if (status.natcash && natcashTxt && natcashDot) {
            natcashTxt.innerText = status.natcash;
            if (status.natcash.toLowerCase() === "operasyonèl" || status.natcash.toLowerCase() === "en ligne") {
                natcashTxt.style.color = "#2e7d32";
                natcashDot.className = "dot-status status-active";
            } else {
                natcashTxt.style.color = "#c62828";
                natcashDot.className = "dot-status status-down";
            }
        }
    } else {
        // Valè default si mèt sit la poko kreye branch lan nan Firebase dashboard li
        if(moncashTxt && moncashDot) {
            moncashTxt.innerText = "Operasyonèl";
            moncashTxt.style.color = "#2e7d32";
            moncashDot.className = "dot-status status-active";
        }
        if(natcashTxt && natcashDot) {
            natcashTxt.innerText = "Operasyonèl";
            natcashTxt.style.color = "#2e7d32";
            natcashDot.className = "dot-status status-active";
        }
    }
});

// --- FONKSYON 4: CHAJE DÈNYE AKTIVITE RAPID (3 DÈNYE TRANZAKSYON) ---
function sarajDènyeAktivite(uid) {
    const keryTrans = query(ref(db, `users/${uid}/transactions`), limitToLast(3));
    const recentActivityDiv = document.getElementById("home-recent-activity");

    onValue(keryTrans, (snapshot) => {
        if (!recentActivityDiv) return;
        recentActivityDiv.innerHTML = ""; // Efase "Ap chaje..." a

        if (snapshot.exists()) {
            const done = snapshot.val();
            // Ranvèse lis la pou pi nouvo a parèt an premye
            const lisTranzaksyon = Object.values(done).reverse();

            lisTranzaksyon.forEach(trans => {
                let badgeColor = trans.status === "Validé" ? "#2e7d32" : (trans.status === "En attente" ? "#ffb300" : "#c62828");
                let icon = trans.type === "Echanj" ? "fa-sync-alt" : "fa-wallet";

                const liyHtml = `
                    <div class="rate-row" style="border-bottom: 1px solid #f9f9f9; padding: 10px 0;">
                        <span class="provider-name" style="font-size: 12px;">
                            <i class="fas ${icon}" style="color: #109121; font-size: 14px;"></i> 
                            ${trans.type} - ${trans.provider || 'Sistèm'}
                        </span>
                        <span style="font-size: 12px; text-align: right;">
                            <b>${trans.amount} HTG</b><br>
                            <small style="color: ${badgeColor}; font-weight: bold;">● ${trans.status}</small>
                        </span>
                    </div>
                `;
                recentActivityDiv.innerHTML += liyHtml;
            });
        } else {
            recentActivityDiv.innerHTML = `<p class="empty-msg-mini">Ou poko fè okenn tranzaksyon.</p>`;
        }
    });
}

// --- FONKSYON 5: ACCORDION FAQ (SANT ÈD) ---
window.toggleFaq = function(element) {
    element.classList.toggle('open');
    const answer = element.querySelector('.faq-answer');
    if (answer) {
        answer.classList.toggle('hidden');
    }
};
