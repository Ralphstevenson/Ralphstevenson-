/* ============================================================
   JS RETRÈ - ECHANJ PLUS V3 - KONEKTE AK GWO JS
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. KOUTE DONE FIREBASE (POU BALANS AK ID PARET)
// Nou mete sa deyò pou l kouri le pli vit ke Firebase pare
onAuthStateChanged(auth, (user) => {
    if (user) {
        kouteDoneFirebase(user.uid);
        konekteLojikBouton(); // Aktive bouton yo
    }
});

function kouteDoneFirebase(uid) {
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const balEl = document.getElementById('display-balance');
            const idEl = document.getElementById('display-ars-id');
            const balansDatabase = parseFloat(data.balance || 0);

            // Ranpli bwat ble yo (Si yo nan HTML la kounye a)
            if (balEl) balEl.innerText = balansDatabase.toFixed(2) + " HTG";
            if (idEl) idEl.innerText = data.arsID || "---";

            // Sekirite: Bloke bouton si montan an twòp
            const inputMontan = document.getElementById('retre-amount');
            const btnMain = document.getElementById('btn-konfime-retre');

            if (inputMontan && btnMain) {
                inputMontan.oninput = () => {
                    const m = parseFloat(inputMontan.value);
                    if (m > balansDatabase) {
                        btnMain.disabled = true;
                        btnMain.innerText = "Balans ensifizan";
                        btnMain.style.background = "#ccc";
                    } else if (m < 100 || isNaN(m)) {
                        btnMain.disabled = true;
                        btnMain.innerText = "Minimòm 100 HTG";
                    } else {
                        btnMain.disabled = false;
                        btnMain.innerText = "RETIRE KÒB LA";
                        btnMain.style.background = "var(--primary-blue)";
                    }
                };
            }
        }
    });
}

// 2. LOGIK BOUTON AK MODAL YO
function konekteLojikBouton() {
    const btnMain = document.getElementById('btn-konfime-retre');
    const btnNext = document.getElementById('next-to-step2');

    if (btnMain) {
        btnMain.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan) return alert("Ranpli tout chan yo!");

            // Ranpli recap la anvan modal la louvri
            const recapBox = document.getElementById('info-recap');
            if (recapBox) {
                recapBox.innerHTML = `
                    <p><b>Reseptè:</b> ${non}</p>
                    <p><b>Telefòn:</b> ${tel}</p>
                    <p><b>Metòd:</b> ${metod}</p>
                    <p><b>Montan:</b> ${montan} HTG</p>
                `;
            }
            document.getElementById('amount-recap').innerText = montan + " HTG";
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }

    if (btnNext) {
        btnNext.onclick = () => {
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-step2').classList.remove('hidden');
        };
    }
}

// 3. FINALIZASYON (SOVRE NAN FIREBASE)
window.finaliseRetre = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const montanInput = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanInput);

    document.getElementById('modal-step2').classList.add('hidden');

    try {
        const userRef = ref(db, `users/${user.uid}`);
        const snap = await get(userRef);
        const userData = snap.val();

        if (userData.balance < montan) return alert("Balans ou fin chanje, eseye ankò.");

        const transID = "RET-" + Date.now();
        const updates = {};
        
        // Tranzaksyon
        updates[`/transactions/${transID}`] = {
            uid: user.uid,
            arsID: userData.arsID,
            type: "Retrè",
            receiver: document.getElementById('retre-name').value,
            phone: document.getElementById('retre-phone').value,
            method: document.getElementById('retre-method').value,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        };
        // Soustrè kòb
        updates[`/users/${user.uid}/balance`] = userData.balance - montan;

        await update(ref(db), updates);
        
        // Siksè
        document.getElementById('modal-final').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('modal-final').classList.add('hidden');
            window.showPage('paj-akey'); // Retounen nan akèy
        }, 4000);

    } catch (erè) {
        alert("Gen yon erè: " + erè.message);
    }
};

// Fonksyon Global pou bouton "ANILE"
window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
};
   
