import { auth, db } from './script.js';
import { ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// A. FONKSYON POU CHAJE HTML RETRE A (Injection)
async function enjekteHtmlRetre() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    try {
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;

        // Yon fwa HTML la chaje, nou aktive koute done yo
        kouteDoneFirebase();
        konekteBoutonRetre();
    } catch (erè) {
        console.error("Erè nan chaje retre.html:", erè);
    }
}

// B. MIZAJOU BALANS AK ID (Lojik 7 & 10)
function kouteDoneFirebase() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userRef = ref(db, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
                const done = snapshot.val();
                if (done) {
                    const balanceEl = document.getElementById('display-balance');
                    const idEl = document.getElementById('display-ars-id');
                    
                    if (balanceEl) balanceEl.innerText = `${done.balance.toFixed(2)} HTG`;
                    if (idEl) idEl.innerText = done.arsID || "---";
                }
            });
        }
    });
}

// C. LOJIK BOUTON KONFIME A
function konekteBoutonRetre() {
    const btn = document.getElementById('btn-konfime-retre');
    if (!btn) return;

    btn.onclick = () => {
        const non = document.getElementById('retre-name').value.trim();
        const tel = document.getElementById('retre-phone').value.trim();
        const metod = document.getElementById('retre-method').value;
        const montan = parseFloat(document.getElementById('retre-amount').value);
        const balansUI = parseFloat(document.getElementById('display-balance').innerText);

        // Lojik 14: Limit 100 HTG
        if (!non || !tel || isNaN(montan) || montan < 100) {
            alert("Tanpri ranpli tout chan yo (Min 100 HTG)");
            return;
        }

        // Lojik 10: Balans Reyèl
        if (montan > balansUI) {
            alert("Kòb sou kont ou an pa ase pou montan sa a.");
            return;
        }

        // Louvri Modal Konfimasyon ki nan Index.html
        const preview = document.getElementById('retre-preview-data');
        if (preview) {
            preview.innerHTML = `
                <div style="background: #f4f5f7; padding: 15px; border-radius: 12px; border-left: 5px solid #0052cc;">
                    <p style="margin:5px 0;"><strong>Resevwa:</strong> ${non}</p>
                    <p style="margin:5px 0;"><strong>Nimewo:</strong> ${tel}</p>
                    <p style="margin:5px 0;"><strong>Metòd:</strong> ${metod}</p>
                    <p style="margin:5px 0; color:#0052cc; font-weight:bold;"><strong>Montan:</strong> ${montan} HTG</p>
                </div>`;
            document.getElementById('modal-confirm-retre').classList.remove('hidden');
        }
    };
}

// D. SOUMÈT TRANZAKSYON (Lojik 16)
window.submitRetre = async () => {
    const non = document.getElementById('retre-name').value.trim();
    const tel = document.getElementById('retre-phone').value.trim();
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    const arsID = document.getElementById('display-ars-id').innerText;

    document.getElementById('modal-confirm-retre').classList.add('hidden');

    try {
        const transID = "RET-" + Date.now();
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            arsID: arsID,
            type: "Retrè",
            receiver: non,
            phone: tel,
            method: metod,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        });

        // Montre Modal Siksè
        document.getElementById('modal-success').classList.remove('hidden');

        // Netwaye fòm
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";

        // Retounen nan akey apre 5 segond
        setTimeout(() => {
            document.getElementById('modal-success').classList.add('hidden');
            if (typeof window.showPage === 'function') {
                window.showPage('paj-akey', document.querySelector('.nav-item'));
            }
        }, 5000);

    } catch (e) {
        alert("Erè nan voye demann lan. Verifye koneksyon ou.");
    }
};

// LANSE PWOSESIS LA
enjekteHtmlRetre();
      
