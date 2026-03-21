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
// 2. KOUTE DONE (BALANS & VERIFIKASYON BOUTON)
// ==========================================
function kouteDoneFirebase() {
    if (auth.currentUser) {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const balEl = document.getElementById('display-balance');
                const idEl = document.getElementById('display-ars-id');
                const balansKounyeA = parseFloat(data.balance || 0);

                if (balEl) balEl.innerText = balansKounyeA.toFixed(2) + " HTG";
                if (idEl) idEl.innerText = data.arsID;

                // --- SISTÈM BLOKE BOUTON SI BALANS PA ASE ---
                const inputMontan = document.getElementById('retre-amount');
                const btnRetre = document.getElementById('btn-konfime-retre');

                if (inputMontan && btnRetre) {
                    inputMontan.oninput = () => {
                        const valè = parseFloat(inputMontan.value);
                        if (valè > balansKounyeA) {
                            btnRetre.disabled = true;
                            btnRetre.innerText = "Balans ensifizan";
                            btnRetre.style.opacity = "0.5";
                            btnRetre.style.cursor = "not-allowed";
                        } else if (valè < 100 || isNaN(valè)) {
                            btnRetre.disabled = true;
                            btnRetre.innerText = "Minimòm 100 HTG";
                        } else {
                            btnRetre.disabled = false;
                            btnRetre.innerText = "RETIRE KÒB LA";
                            btnRetre.style.opacity = "1";
                            btnRetre.style.cursor = "pointer";
                        }
                    };
                }
            }
        });
    }
}

// ==========================================
// 3. LOGIK MODAL YO
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
// 4. FINALIZASYON & SOUSTRÈ OTOMATIK
// ==========================================
window.finaliseRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    const arsID = document.getElementById('display-ars-id').innerText;
    const uid = auth.currentUser.uid;

    document.getElementById('modal-step2').classList.add('hidden');

    try {
        // 1. Double chèk sekirite nan Database
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const balansDatabase = parseFloat(userSnap.val().balance || 0);

        if (balansDatabase < montan) {
            alert("Fwod detekte: Ou pa gen ase kòb!");
            return;
        }

        // 2. Operasyon Atomik (Soustrè + Kreye Tranzaksyon)
        const nouvoBalans = balansDatabase - montan;
        const transID = "RET-" + Date.now();
        
        const updates = {};
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
        updates[`/users/${uid}/balance`] = nouvoBalans;

        await update(ref(db), updates);

        // 3. Montre Siksè
        document.getElementById('modal-final').classList.remove('hidden');

        setTimeout(() => {
            window.showPage('paj-akey');
            document.getElementById('modal-final').classList.add('hidden');
            document.getElementById('retre-amount').value = "";
        }, 5000);

    } catch (erè) {
        console.error("Erè:", erè);
        alert("Sistèm nan gen yon pwoblèm tcheke koneksyon ou.");
    }
};
            
