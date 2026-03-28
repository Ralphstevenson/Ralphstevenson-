/* ============================================================
   JS RETRÈ - ECHANJ PLUS V3 - KONEKTE AK GWO JS (FIXED)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // NOU AJOUTE SA

// 1. CHAJE PAJ HTML LA
window.enjekteHtmlRetre = async function() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    try {
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;

        // --- KLE A SE ISIT LA ---
        // Nou koute si Auth la pare anvan nou chache done
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Koneksyon etabli pou:", user.uid);
                kouteDoneFirebase(user.uid); 
                konekteBoutonRetre();
            } else {
                console.warn("Itilizatè a poko konekte nan Firebase");
            }
        });

    } catch (erè) {
        console.error("Erè nan chaje retre.html:", erè);
    }
};

// 2. KOUTE DONE (POU BALANS AK ID)
function kouteDoneFirebase(uid) {
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const balEl = document.getElementById('display-balance');
            const idEl = document.getElementById('display-ars-id');
            const balansKounyeA = parseFloat(data.balance || 0);

            if (balEl) balEl.innerText = balansKounyeA.toFixed(2) + " HTG";
            if (idEl) idEl.innerText = data.arsID || "---";

            // Lojik bouton an (Bloke/Debloke)
            const inputMontan = document.getElementById('retre-amount');
            const btnRetre = document.getElementById('btn-konfime-retre');

            if (inputMontan && btnRetre) {
                inputMontan.oninput = () => {
                    const valè = parseFloat(inputMontan.value);
                    if (valè > balansKounyeA) {
                        btnRetre.disabled = true;
                        btnRetre.innerText = "Balans ensifizan";
                        btnRetre.style.opacity = "0.5";
                    } else if (valè < 100 || isNaN(valè)) {
                        btnRetre.disabled = true;
                        btnRetre.innerText = "Minimòm 100 HTG";
                    } else {
                        btnRetre.disabled = false;
                        btnRetre.innerText = "RETIRE KÒB LA";
                        btnRetre.style.opacity = "1";
                    }
                };
            }
        }
    });
}

// 3. LOGIK MODAL YO
function konekteBoutonRetre() {
    const btnKonfime = document.getElementById('btn-konfime-retre');
    const nextBtn = document.getElementById('next-to-step2');

    if (btnKonfime) {
        btnKonfime.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan || montan < 100) {
                return alert("Tanpri ranpli tout chan yo byen!");
            }

            document.getElementById('info-recap').innerHTML = `
                <p><b>Reseptè:</b> ${non}</p>
                <p><b>Telefòn:</b> ${tel}</p>
                <p><b>Metòd:</b> ${metod}</p>
                <p><b>Montan:</b> ${montan} HTG</p>
            `;
            document.getElementById('amount-recap').innerText = montan + " HTG";
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-step2').classList.remove('hidden');
        };
    }
}

// 4. FINALIZASYON
window.finaliseRetre = async () => {
    const uid = auth.currentUser?.uid;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    if(!uid) return;

    document.getElementById('modal-step2').classList.add('hidden');

    try {
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const data = userSnap.val();
        const balansDatabase = parseFloat(data.balance || 0);

        if (balansDatabase < montan) return alert("Balans ou ensifizan!");

        const transID = "RET-" + Date.now();
        const updates = {};
        updates[`/transactions/${transID}`] = {
            uid: uid, arsID: data.arsID, type: "Retrè",
            receiver: document.getElementById('retre-name').value,
            phone: document.getElementById('retre-phone').value,
            method: document.getElementById('retre-method').value,
            amount: montan, status: "En attente", timestamp: serverTimestamp()
        };
        updates[`/users/${uid}/balance`] = balansDatabase - montan;

        await update(ref(db), updates);
        document.getElementById('modal-final').classList.remove('hidden');

        setTimeout(() => {
            window.showPage('paj-akey');
            document.getElementById('modal-final').classList.add('hidden');
        }, 4000);
    } catch (err) { alert("Erè teknik, eseye ankò."); }
};

window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
};
            
