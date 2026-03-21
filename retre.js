import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. CHAJE PAJ HTML LA
// ==========================================
window.enjekteHtmlRetre = async function() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    if (seksyonVid.innerHTML.trim() !== "") {
        konekteBoutonRetre();
        kouteDoneFirebase();
        return;
    }

    try {
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;
        konekteBoutonRetre();
        kouteDoneFirebase();
    } catch (erè) {
        console.error("Erè nan chaje retre.html:", erè);
    }
};

// ==========================================
// 2. KOUTE DONE (BALANS & ID)
// ==========================================
function kouteDoneFirebase() {
    if (auth.currentUser) {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const balEl = document.getElementById('display-balance');
                const idEl = document.getElementById('display-ars-id');
                if (balEl) balEl.innerText = parseFloat(data.balance).toFixed(2) + " HTG";
                if (idEl) idEl.innerText = data.arsID;
            }
        });
    }
}

// ==========================================
// 3. LOGIK BOUTON YO
// ==========================================
function konekteBoutonRetre() {
    const btn = document.getElementById('btn-konfime-retre');
    const nextBtn = document.getElementById('next-to-step2');

    if (nextBtn) {
        nextBtn.onclick = () => {
            const montan = document.getElementById('retre-amount').value;
            document.getElementById('amount-recap').innerText = montan + " HTG";
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-step2').classList.remove('hidden');
        };
    }

    if (btn) {
        btn.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan || montan < 100) {
                alert("Tanpri ranpli tout chan yo byen (Minimòm 100 HTG)");
                return;
            }

            const recap = `
                <p><b>Reseptè:</b> ${non}</p>
                <p><b>Telefòn:</b> ${tel}</p>
                <p><b>Metòd:</b> ${metod}</p>
                <p><b>Montan:</b> ${montan} HTG</p>
            `;
            document.getElementById('info-recap').innerHTML = recap;
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }
}

window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
};

// ==========================================
// 4. FONKSYON SOUSTRÈ OTOMATIK (PRO)
// ==========================================
window.finaliseRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montanInput = document.getElementById('retre-amount').value;
    const montan = parseFloat(montanInput);
    const arsID = document.getElementById('display-ars-id').innerText;
    const uid = auth.currentUser.uid;

    // Fèmen modal etap 2 a
    document.getElementById('modal-step2').classList.add('hidden');

    try {
        // A. Tcheke balans lan nan Database la pou sekirite
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        
        if (!userSnap.exists()) return alert("Itilizatè pa jwenn!");

        const userData = userSnap.val();
        const balansKounyeA = parseFloat(userData.balance || 0);

        // B. Verifikasyon si kòb la ase
        if (balansKounyeA < montan) {
            alert(`Ou pa gen ase kòb! Balans ou se ${balansKounyeA} HTG`);
            return;
        }

        // C. Kalkile nouvo balans
        const nouvoBalans = balansKounyeA - montan;

        // D. Prepare operasyon ATOMIK (De aksyon an menm tan)
        const transID = "RET-" + Date.now();
        const updates = {};
        
        // 1. Kreye tranzaksyon an
        updates[`/transactions/${transID}`] = {
            uid: uid,
            arsID: arsID,
            type: "Retrè",
            receiver: non,
            phone: tel,
            method: metod,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        };

        // 2. Soustrè kòb la nan balans lan otomatikman
        updates[`/users/${uid}/balance`] = nouvoBalans;

        // E. Voye tout nan Firebase
        await update(ref(db), updates);

        // F. Montre modal siksè
        document.getElementById('modal-final').classList.remove('hidden');

        setTimeout(() => {
            window.showPage('paj-akey');
            document.getElementById('modal-final').classList.add('hidden');
            // Reset fòm nan
            document.getElementById('retre-amount').value = "";
        }, 5000);

    } catch (erè) {
        console.error("Erè nan retrè a:", erè);
        alert("Yon erè rive. Eseye ankò.");
    }
};
