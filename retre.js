import { auth, db } from './script.js';
import { ref, get, update, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. CHAJE PAJ HTML LA
// ==========================================
window.enjekteHtmlRetre = async function() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    // Si HTML la deja la, nou sèlman rekonekte lojik yo
    if (seksyonVid.innerHTML.trim() !== "") {
        kouteDoneFirebase();
        konekteBoutonRetre();
        return;
    }

    try {
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;
        
        // Deklanche lojik yo apre HTML fin chaje
        kouteDoneFirebase();
        konekteBoutonRetre();
    } catch (erè) {
        console.error("Erè nan chaje retre.html:", erè);
    }
};

// ==========================================
// 2. KOUTE DONE (BALANS & ID KONT)
// ==========================================
function kouteDoneFirebase() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Nou itilize .balance (menm jan ak Gwo JS la)
            const balansKounyeA = parseFloat(data.balance || 0);
            
            // Mizajou UI anwo a (Si eleman sa yo nan retre.html)
            const balEl = document.getElementById('display-balance');
            const idEl = document.getElementById('display-ars-id');

            if (balEl) balEl.innerText = balansKounyeA.toFixed(2) + " HTG";
            if (idEl) idEl.innerText = data.arsID || "---";

            // --- SISTÈM BLOKE BOUTON ---
            const inputMontan = document.getElementById('retre-amount');
            const btnPwofesyonel = document.getElementById('btn-konfime-retre');

            if (inputMontan && btnPwofesyonel) {
                inputMontan.oninput = () => {
                    const valè = parseFloat(inputMontan.value);
                    if (valè > balansKounyeA) {
                        btnPwofesyonel.disabled = true;
                        btnPwofesyonel.innerText = "Balans ensifizan";
                        btnPwofesyonel.style.opacity = "0.5";
                    } else if (valè < 100 || isNaN(valè)) {
                        btnPwofesyonel.disabled = true;
                        btnPwofesyonel.innerText = "Minimòm 100 HTG";
                    } else {
                        btnPwofesyonel.disabled = false;
                        btnPwofesyonel.innerText = "RETIRE KÒB LA";
                        btnPwofesyonel.style.opacity = "1";
                    }
                };
            }
        }
    });
}

// ==========================================
// 3. LOGIK BOUTON AK MODAL
// ==========================================
function konekteBoutonRetre() {
    const btnKonfime = document.getElementById('btn-konfime-retre');
    
    if (btnKonfime) {
        btnKonfime.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan || montan < 100) {
                alert("Ranpli tout chan yo (Minimòm 100 HTG)");
                return;
            }

            // Ranpli Recap la
            const recapHtml = `
                <p><b>Reseptè:</b> ${non}</p>
                <p><b>Telefòn:</b> ${tel}</p>
                <p><b>Metòd:</b> ${metod}</p>
                <p><b>Montan:</b> ${montan} HTG</p>
            `;
            const infoRecap = document.getElementById('info-recap');
            if(infoRecap) infoRecap.innerHTML = recapHtml;

            // Montre Modal Step 1
            const modal1 = document.getElementById('modal-step1');
            if(modal1) modal1.classList.remove('hidden');
        };
    }

    // Bouton pou pase nan Step 2 (Konfimasyon final)
    const nextBtn = document.getElementById('next-to-step2');
    if (nextBtn) {
        nextBtn.onclick = () => {
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-step2').classList.remove('hidden');
        };
    }
}

// ==========================================
// 4. FINALIZASYON & TRANZAKSYON FIREBASE
// ==========================================
window.finaliseRetre = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    
    // Nou kache modal la pandan n ap travay
    document.getElementById('modal-step2').classList.add('hidden');

    try {
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const data = userSnap.val();
        const balansDatabase = parseFloat(data.balance || 0);

        if (balansDatabase < montan) {
            alert("Erè: Balans ou ensifizan!");
            return;
        }

        const transID = "RET-" + Date.now();
        const updates = {};
        
        // 1. Kreye Tranzaksyon an
        updates[`/transactions/${transID}`] = {
            uid: uid,
            arsID: data.arsID || "N/A",
            type: "Retrè",
            receiver: non,
            phone: tel,
            method: metod,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        };

        // 2. Soustrè kòb la (Mizajou balans)
        updates[`/users/${uid}/balance`] = balansDatabase - montan;

        await update(ref(db), updates);

        // 3. Montre Siksè Final
        const modalFinal = document.getElementById('modal-final');
        if(modalFinal) modalFinal.classList.remove('hidden');

        setTimeout(() => {
            if(modalFinal) modalFinal.classList.add('hidden');
            if(window.showPage) window.showPage('paj-akey');
            // Netwaye fòm lan
            document.getElementById('retre-amount').value = "";
            document.getElementById('retre-name').value = "";
        }, 4000);

    } catch (erè) {
        console.error("Erè nan finalizasyon:", erè);
        alert("Gen yon pwoblèm teknik. Eseye ankò.");
    }
};

window.closeAllModals = () => {
    document.getElementById('modal-step1')?.classList.add('hidden');
    document.getElementById('modal-step2')?.classList.add('hidden');
    document.getElementById('modal-final')?.classList.add('hidden');
};
                    
