/* ============================================================
   JS RETRÈ V3.9 - KOREKSYON SEKIRITE AK PIN (FINAL)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"; // Enpòtasyon 'update' korèk
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. KOUTE DONE FIREBASE
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
            
            // Mete done nan HTML
            const balansEl = document.getElementById('display-balance');
            const idKontEl = document.getElementById('display-ars-id');
            if (balansEl) balansEl.innerText = balansDatabase.toLocaleString('en-US', {minimumFractionDigits: 2}) + " HTG";
            if (idKontEl) idKontEl.innerText = data.arsID || "ARS-000000";

            // KOREKSYON: Nou vize 'pin' egzakteman jan l ye nan Rules Firebase ou yo
            window.userAppData = {
                hasPin: !!data.pin,
                correctPin: data.pin || "",
                fullname: data.fullname || "Itilizatè",
                currentBalance: balansDatabase
            };
            verifieInputMontan(balansDatabase);
        }
    });
}

// 2. LOGIK BOUTON YO
function konekteLojikBouton() {
    const btnMain = document.getElementById('btn-konfime-retre'); 
    const btnNextToPin = document.getElementById('next-to-step2'); 
    const btnVerifyPin = document.getElementById('btn-verify-pin-retre'); 

    if (btnMain) {
        btnMain.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const montan = document.getElementById('retre-amount').value;
            const metòd = document.getElementById('retre-method').value;

            if (!non || !tel || !montan) {
                alert("🔴 Tanpri ranpli tout chan yo!");
                return;
            }

            if (!window.userAppData.hasPin) {
                alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan.");
                return;
            }

            const recapBox = document.getElementById('info-recap');
            if (recapBox) {
                recapBox.innerHTML = `
                    <p><b>Reseptè:</b> ${non}</p>
                    <p><b>Telefòn:</b> ${tel}</p>
                    <p><b>Metòd:</b> ${metòd}</p>
                    <p><b>Montan:</b> ${montan} HTG</p>
                `;
            }
            document.getElementById('modal-step1')?.classList.remove('hidden');
        };
    }

    if (btnNextToPin) {
        btnNextToPin.onclick = () => {
            document.getElementById('modal-step1')?.classList.add('hidden');
            document.getElementById('modal-pin-retre')?.classList.remove('hidden');
        };
    }

    if (btnVerifyPin) {
        btnVerifyPin.onclick = () => {
            const pinInput = document.getElementById('pin-retre-input');
            // Konparezon sekirite ak jaden 'pin' lan
            if (pinInput.value === String(window.userAppData.correctPin)) {
                document.getElementById('modal-pin-retre')?.classList.add('hidden');
                
                const amountRecap = document.getElementById('amount-recap');
                if (amountRecap) amountRecap.innerText = document.getElementById('retre-amount').value + " HTG";
                
                document.getElementById('modal-step2')?.classList.remove('hidden');
                pinInput.value = "";
            } else {
                alert("❌ PIN enkòrèk!");
                pinInput.value = "";
            }
        };
    }
}

// 3. FONKSYON FINAL KI EKZEKITE NAN FIREBASE
window.finaliseRetre = async () => {
    const user = auth.currentUser;
    const montan = parseFloat(document.getElementById('retre-amount').value);

    document.getElementById('modal-step2')?.classList.add('hidden');

    try {
        const transID = "RET-" + Math.floor(Math.random() * 1000000);
        const updates = {};
        
        // KOREKSYON SEKIRITE: Nou voye demand lan nan 'transactions' sèlman.
        // Nou retire liy ki t ap modifye 'balance' lan dirèkteman paske Rules yo bloke sa!
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

        // Egzekite sou Firebase
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

        // Siksè Final
        document.getElementById('modal-final')?.classList.remove('hidden');
        
        // Netwaye fòm nan
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
    const modals = ['modal-step1', 'modal-pin-retre', 'modal-step2', 'modal-final'];
    modals.forEach(m => document.getElementById(m)?.classList.add('hidden'));
};

function verifieInputMontan(balans) {
    const input = document.getElementById('retre-amount');
    const btn = document.getElementById('btn-konfime-retre');
    if(!input || !btn) return;
    input.oninput = () => {
        const m = parseFloat(input.value);
        if (m > balans) {
            btn.disabled = true; btn.innerText = "Balans ensifizan"; btn.style.background = "#ff5630";
        } else if (m < 100 || isNaN(m)) {
            btn.disabled = true; btn.innerText = "Minimòm 100 HTG"; btn.style.background = "#ccc";
        } else {
            btn.disabled = false; btn.innerText = "RETIRE KÒB LA"; btn.style.background = "#109121";
        }
    };
                                                     }
           
