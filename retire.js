import { auth, db } from './script.js';
import { ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// A. CHAJE HTML LA TOUT SWIT
async function initRetre() {
    const seksyon = document.getElementById('paj-retre');
    if (!seksyon) return;

    try {
        const response = await fetch('retre.html');
        const html = await response.text();
        seksyon.innerHTML = html;
        
        // Apre HTML fin chaje, konekte bouton yo
        konekteLojikBouton();
        kouteDoneFirebase();
    } catch (err) {
        console.error("Erè chajman retre.html:", err);
    }
}

// B. RANN FONKSYON YO GLOBAL (Paske se yon Module)
window.openRetreConfirm = function() {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    
    // Rale balans ki afiche a
    const balansUI = parseFloat(document.getElementById('display-balance').innerText) || 0;

    if (!non || !tel || isNaN(montan) || montan < 100) {
        alert("Tanpri ranpli tout chan yo (Min 100 HTG)");
        return;
    }

    if (montan > balansUI) {
        alert("Balans ou pa ase!");
        return;
    }

    // Afiche nan modal Index.html la
    const preview = document.getElementById('retre-preview-data');
    if (preview) {
        preview.innerHTML = `
            <div style="text-align:left; background:#f4f5f7; padding:10px; border-radius:10px;">
                <p><b>Non:</b> ${non}</p>
                <p><b>Telefòn:</b> ${tel}</p>
                <p><b>Montan:</b> ${montan} HTG</p>
            </div>`;
        document.getElementById('modal-confirm-retre').classList.remove('hidden');
    }
};

// C. MIZAJOU DONE FIREBASE
function kouteDoneFirebase() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            onValue(ref(db, `users/${user.uid}`), (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const b = document.getElementById('display-balance');
                    const i = document.getElementById('display-ars-id');
                    if (b) b.innerText = `${data.balance.toFixed(2)} HTG`;
                    if (i) i.innerText = data.arsID || "---";
                }
            });
        }
    });
}

function konekteLojikBouton() {
    const btn = document.getElementById('btn-konfime-retre');
    if (btn) {
        // Nou konekte ID a ak fonksyon window a
        btn.onclick = window.openRetreConfirm;
    }
}

// LANSE TOUT BAGAY
initRetre();

