/* ============================================================
   JS RETRÈ V3.5 - KOREKSYON BALANS AN TAN REYÈL
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

            // --- KOREKSYON BALANS NAN KAT NWA A ---
            // Nou chèche ID ki nan screenshot la (asire w li rele konsa nan HTML)
            const balansKatNwa = document.getElementById('display-retre-balance'); 
            const idKontKatNwa = document.getElementById('display-ars-id');

            if (balansKatNwa) {
                balansKatNwa.innerText = balansDatabase.toLocaleString('en-US', {minimumFractionDigits: 2}) + " HTG";
                balansKatNwa.style.color = "#2ecc71"; // Force vèt la si l te blan
            }
            
            if (idKontKatNwa) {
                idKontKatNwa.innerText = data.arsID || "ARS-000000";
            }

            // Sove done pou lòt fonksyon yo
            window.userRealBalance = balansDatabase;
            window.userAppData = {
                hasPin: !!data.transactionPin,
                correctPin: data.transactionPin || "",
                fullname: data.fullname || "Itilizatè",
                currentBalance: balansDatabase
            };

            // Re-fè verifikasyon input la depi balans lan chanje
            verifieInputMontan(balansDatabase);
        }
    });
}

// 2. VERIFIKASYON DINAMIK POU BOUTON AN
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
            btnMain.style.background = "#0052cc"; // Koulè ble bouton ou an
        }
    };
}

// 3. FINALIZASYON TRANZAKSYON
window.finaliseRetre = async () => {
    const user = auth.currentUser;
    if (!user || !window.userAppData) return;

    const montan = parseFloat(document.getElementById('retre-amount').value);
    const metòd = document.getElementById('retre-method').value;
    const telefòn = document.getElementById('retre-phone').value;
    const nonReseptè = document.getElementById('retre-name').value;

    if (window.userAppData.currentBalance < montan) {
        alert("Balans ensifizan.");
        return;
    }

    try {
        const transID = "RET-" + Math.floor(Math.random() * 1000000);
        const updates = {};
        
        updates[`/transactions/${transID}`] = {
            id: transID,
            uid: user.uid,
            type: "Retrè",
            receiver: nonReseptè,
            phone: telefòn,
            method: metòd,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        };
        
        // Retire kòb la nan balans lan
        updates[`/users/${user.uid}/balance`] = increment(-montan);

        await update(ref(db), updates);

        // Notifikasyon Gmail
        if (typeof window.voyeGmail === 'function') {
            window.voyeGmail('retre', { amount: montan, method: metòd, phone: telefòn, name: window.userAppData.fullname });
        }
        
        // Reset ak siksè
        document.getElementById('modal-step2')?.classList.add('hidden');
        document.getElementById('modal-final')?.classList.remove('hidden');

        // Netwaye fòm
        document.getElementById('retre-amount').value = "";
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";

    } catch (e) {
        alert("Erè: " + e.message);
    }
};

// ... Fonksyon konekteLojikBouton ak closeAllModals rete menm jan ...
               
