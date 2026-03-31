/* ============================================================
   JS RETRÈ - ECHANJ PLUS V3.2 - SEKIRITE PIN MODAL ENTEGRE
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. KOUTE DONE FIREBASE (BALANS AK SEKIRITE)
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
            const balEl = document.getElementById('display-balance');
            const idEl = document.getElementById('display-ars-id');
            const balansDatabase = parseFloat(data.balance || 0);

            if (balEl) balEl.innerText = balansDatabase.toFixed(2) + " HTG";
            if (idEl) idEl.innerText = data.arsID || "---";

            // Sove done PIN yo nan window pou verifikasyon rapid
            window.userAppData = {
                hasPin: !!data.transactionPin,
                correctPin: data.transactionPin || ""
            };

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
                        btnMain.style.background = "#109121";
                    }
                };
            }
        }
    });
}

// 2. LOGIK BOUTON AK VERIFIKASYON PIN
function konekteLojikBouton() {
    const btnMain = document.getElementById('btn-konfime-retre');
    const btnNextToPin = document.getElementById('next-to-step2'); // Sa a ap louvri Modal PIN
    const btnVerifyPin = document.getElementById('btn-verify-pin-retre');

    if (btnMain) {
        btnMain.onclick = () => {
            // Tcheke si PIN nan kreye anvan
            if (!window.userAppData.hasPin) {
                alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè retrè.");
                window.showPage('paj-parametre'); 
                return;
            }

            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan) return alert("Ranpli tout chan yo!");

            const recapBox = document.getElementById('info-recap');
            if (recapBox) {
                recapBox.innerHTML = `
                    <p><b>Reseptè:</b> ${non}</p>
                    <p><b>Telefòn:</b> ${tel}</p>
                    <p><b>Metòd:</b> ${document.getElementById('retre-method').value}</p>
                    <p><b>Montan:</b> ${montan} HTG</p>
                `;
            }
            document.getElementById('amount-recap').innerText = montan + " HTG";
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }

    // Lè kliyan an klike "OK, YO BON" nan Step 1
    if (btnNextToPin) {
        btnNextToPin.onclick = () => {
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-pin-retre').classList.remove('hidden');
        };
    }

    // Lè kliyan an klike "VERIFYE PIN" nan Modal PIN la
    if (btnVerifyPin) {
        btnVerifyPin.onclick = () => {
            const pinInput = document.getElementById('pin-retre-input');
            const pinAntre = pinInput.value;
            
            if (pinAntre === window.userAppData.correctPin) {
                // Si PIN lan bon, debloke dènye etap la
                document.getElementById('modal-pin-retre').classList.add('hidden');
                document.getElementById('modal-step2').classList.remove('hidden');
                pinInput.value = ""; // Netwaye input la
            } else {
                alert("❌ PIN enkòrèk. Eseye ankò.");
                pinInput.value = "";
            }
        };
    }
}

// 3. FINALIZASYON ETA FINAL LA
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
        
        updates[`/users/${user.uid}/balance`] = userData.balance - montan;

        await update(ref(db), updates);
        
        // Netwaye fòm nan
        document.getElementById('retre-name').value = "";
        document.getElementById('retre-phone').value = "";
        document.getElementById('retre-amount').value = "";

        // Montre siksè
        document.getElementById('modal-final').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('modal-final').classList.add('hidden');
            window.showPage('paj-akey'); 
        }, 4000);

    } catch (erè) {
        alert("Gen yon erè: " + erè.message);
    }
};

// Fonksyon pou fèmen tout modal yo (Anile)
window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-pin-retre').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
    document.getElementById('modal-final').classList.add('hidden');
    const pinInput = document.getElementById('pin-retre-input');
    if(pinInput) pinInput.value = "";
};
                       
