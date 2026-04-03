/* ============================================================
   JS RETRÈ V3.6 - KOREKSYON FINAL BALANS & ID
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

            // --- KOREKSYON ID YO ---
            const balansEl = document.getElementById('display-balance'); // Matche ak HTML ou
            const idKontEl = document.getElementById('display-ars-id'); // Matche ak HTML ou

            if (balansEl) {
                balansEl.innerText = balansDatabase.toLocaleString('en-US', {minimumFractionDigits: 2}) + " HTG";
            }
            if (idKontEl) {
                idKontEl.innerText = data.arsID || "ARS-000000";
            }

            window.userAppData = {
                hasPin: !!data.transactionPin,
                correctPin: data.transactionPin || "",
                fullname: data.fullname || "Itilizatè",
                currentBalance: balansDatabase
            };

            verifieInputMontan(balansDatabase);
        }
    });
}

function verifieInputMontan(balans) {
    const inputMontan = document.getElementById('retre-amount');
    const btnMain = document.getElementById('btn-konfime-retre');
    if (!inputMontan || !btnMain) return;

    inputMontan.oninput = () => {
        const m = parseFloat(inputMontan.value);
        if (m > balans) {
            btnMain.disabled = true;
            btnMain.innerText = "Balans ensifizan";
            btnMain.style.background = "#ff5630"; 
        } else if (m < 100 || isNaN(m)) {
            btnMain.disabled = true;
            btnMain.innerText = "Minimòm 100 HTG";
            btnMain.style.background = "#ccc";
        } else {
            btnMain.disabled = false;
            btnMain.innerText = "RETIRE KÒB LA";
            btnMain.style.background = "#109121"; 
        }
    };
}

window.finaliseRetre = async () => {
    const user = auth.currentUser;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    
    if (window.userAppData.currentBalance < montan) return alert("Balans ensifizan!");

    try {
        const transID = "RET-" + Math.floor(Math.random() * 1000000);
        const updates = {};
        updates[`/transactions/${transID}`] = {
            id: transID, uid: user.uid, type: "Retrè",
            receiver: document.getElementById('retre-name').value,
            phone: document.getElementById('retre-phone').value,
            method: document.getElementById('retre-method').value,
            amount: montan, status: "En attente", timestamp: serverTimestamp()
        };
        updates[`/users/${user.uid}/balance`] = increment(-montan);

        await update(ref(db), updates);
        
        document.getElementById('modal-step2')?.classList.add('hidden');
        document.getElementById('modal-final')?.classList.remove('hidden');
        
        setTimeout(() => {
            location.reload(); // Reload pou asire tout UI a fre
        }, 3000);
    } catch (e) { alert(e.message); }
};
           
