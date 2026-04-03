/* ============================================================
   JS RETRÈ - ECHANJ PLUS V3.2 - KOREKSYON BALANS
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
            // Asire nou pran balans lan kòm yon chif (Number)
            const balansDatabase = Number(data.balance || 0);

            // Mizajou global pou tout aplikasyon an wè menm chif la
            window.userRealBalance = balansDatabase;
            
            // Si fonksyon UI a egziste nan script.js, nou rele l
            if (typeof window.updateBalanceUI === 'function') {
                window.updateBalanceUI();
            }
            
            const idEl = document.getElementById('display-ars-id');
            if (idEl) idEl.innerText = data.arsID || "---";

            // Sove done pou lòt pati nan script la
            window.userAppData = {
                hasPin: !!data.transactionPin,
                correctPin: data.transactionPin || "",
                fullname: data.fullname || "Itilizatè",
                gmailEnabled: data.settings ? data.settings.gmail_enabled : true,
                currentBalance: balansDatabase // Nou sove l isit la tou
            };

            // Verifikasyon bouton an tan reyèl
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
            btnMain.style.background = "#ff5630"; // Wouj erè
        } else if (m < 100 || isNaN(m)) {
            btnMain.disabled = true;
            btnMain.innerText = "Minimòm 100 HTG";
            btnMain.style.background = "#ccc";
        } else {
            btnMain.disabled = false;
            btnMain.innerText = "RETIRE KÒB LA";
            btnMain.style.background = "#109121"; // Vèt siksè
        }
    };
}

// 3. FINALIZASYON AK DEKLANCHMAN GMAIL (KORÈK)
window.finaliseRetre = async () => {
    const user = auth.currentUser;
    if (!user || !window.userAppData) return;

    const montanStr = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanStr);
    const metòd = document.getElementById('retre-method').value;
    const telefòn = document.getElementById('retre-phone').value;
    const nonReseptè = document.getElementById('retre-name').value;

    // Verifikasyon sekirite anvan nou lanse requête la
    if (window.userAppData.currentBalance < montan) {
        alert("Erè: Balans ou ensifizan.");
        return closeAllModals();
    }

    document.getElementById('modal-step2')?.classList.add('hidden');

    try {
        const transID = "RET-" + Math.floor(Math.random() * 1000000);
        const updates = {};
        
        // 1. Kreye Tranzaksyon an
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
        
        // 2. RETIRE KÒB LA (itilize increment ak valè negatif pou retire)
        updates[`/users/${user.uid}/balance`] = increment(-montan);

        await update(ref(db), updates);

        // Notifikasyon Gmail (Si fonksyon an la)
        if (typeof window.voyeGmail === 'function') {
            window.voyeGmail('retre', {
                amount: montan,
                method: metòd,
                phone: telefòn,
                name: window.userAppData.fullname
            });
        }
        
        // Netwaye fòm nan
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";

        // Montre siksè
        document.getElementById('modal-final')?.classList.remove('hidden');
        
        // Redireksyon apre 3 segonn
        setTimeout(() => {
            closeAllModals();
            if (window.showPage) window.showPage('paj-akey'); 
        }, 3000);

    } catch (erè) {
        console.error(erè);
        alert("Gen yon pwoblèm teknik. Kontakte sipò.");
    }
};

// ... rès fonksyon konekteLojikBouton ak closeAllModals yo rete menm jan
        
