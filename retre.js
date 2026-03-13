import { auth, db } from './script.js';
import { ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CHAJE HTML LA RAPID (Injection)
async function enjekteHtmlRetre() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    try {
        const repons = await fetch('retre.html');
        if (!repons.ok) throw new Error("Fichye retre.html pa jwenn");
        const html = await repons.text();
        
        // Nou mete HTML la nan seksyon an
        seksyonVid.innerHTML = html;

        // Yon fwa li fin chaje, nou konekte bouton an ak done yo
        konekteBoutonRetre();
        kouteDoneFirebase();
    } catch (erè) {
        console.error("Poblèm chajman:", erè);
        seksyonVid.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Erè nan chaje fòm retrè a.</p>";
    }
}

// 2. MIZAJOU DONE YO (Balans & ARS-ID)
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

// 3. LOJIK BOUTON KONFIME A
function konekteBoutonRetre() {
    const btn = document.getElementById('btn-konfime-retre');
    if (!btn) return;

    btn.onclick = () => {
        const non = document.getElementById('retre-name').value.trim();
        const tel = document.getElementById('retre-phone').value.trim();
        const metod = document.getElementById('retre-method').value;
        const montan = parseFloat(document.getElementById('retre-amount').value);
        
        // Rale balans nan UI a
        const balansText = document.getElementById('display-balance').innerText;
        const balansUI = parseFloat(balansText) || 0;

        if (!non || !tel || isNaN(montan) || montan < 100) {
            alert("Ranpli tout chan yo (Min 100 HTG)");
            return;
        }

        if (montan > balansUI) {
            alert("Kòb sou kont ou pa ase.");
            return;
        }

        // Louvri Modal ki nan Index.html
        const preview = document.getElementById('retre-preview-data');
        if (preview) {
            preview.innerHTML = `
                <div style="background:#f4f5f7; padding:10px; border-radius:8px;">
                    <p><b>Resevwa:</b> ${non}</p>
                    <p><b>Nimewo:</b> ${tel}</p>
                    <p><b>Montan:</b> ${montan} HTG</p>
                </div>`;
            document.getElementById('modal-confirm-retre').classList.remove('hidden');
        }
    };
}

// 4. SUBMIT FINAL (Rann li disponib pou modal la)
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

        document.getElementById('modal-success').classList.remove('hidden');
        
        // Reset fòm
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";

        setTimeout(() => {
            document.getElementById('modal-success').classList.add('hidden');
            location.reload(); // Reload se fason ki pi sèten pou V1 tounen nan akey
        }, 4000);

    } catch (e) {
        alert("Erè koneksyon.");
    }
};

// Kòmanse enjeksyònman an imedyatman
enjekteHtmlRetre();
                              
