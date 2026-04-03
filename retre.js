/* ============================================================
   JS RETRÈ FINAL - ECHANJ PLUS V3.7
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. KOUTE DONE FIREBASE LÈ MOUN LAN KONEKTE
onAuthStateChanged(auth, (user) => {
    if (user) {
        kouteDoneFirebase(user.uid);
        konekteLojikBouton(); 
    }
});

function kouteDoneFirebase(uid) {
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const balansDatabase = Number(data.balance || 0);

            // Mete balans lan nan UI a
            const balansEl = document.getElementById('display-balance');
            const idKontEl = document.getElementById('display-ars-id');

            if (balansEl) {
                balansEl.innerText = balansDatabase.toLocaleString('en-US', {minimumFractionDigits: 2}) + " HTG";
            }
            if (idKontEl) {
                idKontEl.innerText = data.arsID || "ARS-000000";
            }

            // Sove done enpòtan yo nan window pou lòt fonksyon ka wè yo
            window.userAppData = {
                hasPin: !!data.transactionPin,
                correctPin: data.transactionPin || "",
                fullname: data.fullname || "Itilizatè",
                currentBalance: balansDatabase
            };

            // Toujou verifye input la si balans lan chanje nan database la
            verifieInputMontan(balansDatabase);
        }
    });
}

// 2. VERIFIKASYON INPUT AK KOULÈ BOUTON
function verifieInputMontan(balans) {
    const inputMontan = document.getElementById('retre-amount');
    const btnMain = document.getElementById('btn-konfime-retre');
    if (!inputMontan || !btnMain) return;

    inputMontan.oninput = () => {
        const m = parseFloat(inputMontan.value);
        if (m > balans) {
            btnMain.disabled = true;
            btnMain.innerText = "Balans ensifizan";
            btnMain.style.background = "#ff5630"; // Wouj
        } else if (m < 100 || isNaN(m)) {
            btnMain.disabled = true;
            btnMain.innerText = "Minimòm 100 HTG";
            btnMain.style.background = "#ccc"; // Gri
        } else {
            btnMain.disabled = false;
            btnMain.innerText = "RETIRE KÒB LA";
            btnMain.style.background = "#109121"; // Vèt
        }
    };
}

// 3. LOGIK BOUTON AK MODAL YO
function konekteLojikBouton() {
    const btnMain = document.getElementById('btn-konfime-retre');
    const btnNextToPin = document.getElementById('next-to-step2');
    const btnVerifyPin = document.getElementById('btn-verify-pin-retre');

    // Louvri premye modal verifikasyon an
    if (btnMain) {
        btnMain.onclick = () => {
            if (!window.userAppData.hasPin) {
                alert("Ou dwe kreye yon PIN nan Paramètres anvan.");
                return;
            }
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan) return alert("Tanpri ranpli tout fòm nan.");

            document.getElementById('info-recap').innerHTML = `
                <p><b>Reseptè:</b> ${non}</p>
                <p><b>Telefòn:</b> ${tel}</p>
                <p><b>Metòd:</b> ${document.getElementById('retre-method').value}</p>
                <p><b>Montan:</b> ${montan} HTG</p>
            `;
            document.getElementById('modal-step1')?.classList.remove('hidden');
        };
    }

    // Pase nan pati PIN lan
    if (btnNextToPin) {
        btnNextToPin.onclick = () => {
            document.getElementById('modal-step1')?.classList.add('hidden');
            document.getElementById('modal-pin-retre')?.classList.remove('hidden');
        };
    }

    // Verifye PIN nan
    if (btnVerifyPin) {
        btnVerifyPin.onclick = () => {
            const pinAntre = document.getElementById('pin-retre-input').value;
            if (pinAntre === window.userAppData.correctPin) {
                document.getElementById('modal-pin-retre')?.classList.add('hidden');
                document.getElementById('amount-recap').innerText = document.getElementById('retre-amount').value + " HTG";
                document.getElementById('modal-step2')?.classList.remove('hidden');
            } else {
                alert("PIN enkòrèk!");
            }
        };
    }
}

// 4. FINALIZASYON TRANZAKSYON (FIREBASE)
window.finaliseRetre = async () => {
    const user = auth.currentUser;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    // Sekirite dènye minit
    if (window.userAppData.currentBalance < montan) {
        alert("Balans ou vin ensifizan.");
        return location.reload();
    }

    try {
        const transID = "RET-" + Math.floor(Math.random() * 1000000);
        const updates = {};

        // Prepare done tranzaksyon
        updates[`/transactions/${transID}`] = {
            id: transID,
            uid: user.uid,
            type: "Retrè",
            receiver: document.getElementById('retre-name').value,
            phone: document.getElementById('retre-phone').value,
            method: document.getElementById('retre-method').value,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        };

        // Retire kòb la nan balans lan (Sistèm increment la pi an sekirite)
        updates[`/users/${user.uid}/balance`] = increment(-montan);

        await update(ref(db), updates);

        // Notifikasyon Gmail
        if (typeof window.voyeGmail === 'function') {
            window.voyeGmail('retre', { 
                amount: montan, 
                method: document.getElementById('retre-method').value, 
                phone: document.getElementById('retre-phone').value, 
                name: window.userAppData.fullname 
            });
        }

        // Montre siksè
        document.getElementById('modal-step2')?.classList.add('hidden');
        document.getElementById('modal-final')?.classList.remove('hidden');

        // Reset fòm nan
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";

        setTimeout(() => {
            document.getElementById('modal-final')?.classList.add('hidden');
            if (window.showPage) window.showPage('paj-akey');
        }, 4000);

    } catch (e) {
        alert("Erè: " + e.message);
    }
};

window.closeAllModals = () => {
    ['modal-step1', 'modal-pin-retre', 'modal-step2', 'modal-final'].forEach(m => {
        document.getElementById(m)?.classList.add('hidden');
    });
};
