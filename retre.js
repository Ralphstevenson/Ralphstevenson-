import { auth, db } from './script.js';
import { ref, set, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. FONKSYON POU CHAJE HTML LA (Sa a se kò a)
window.enjekteHtmlRetre = async function() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    // Si HTML la deja la, nou jis asire bouton yo konekte
    if (seksyonVid.innerHTML.trim() !== "") {
        konekteBoutonRetre();
        kouteDoneFirebase();
        return;
    }

    try {
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;

        // Yon fwa HTML la nan paj la, nou aktive lojik yo
        konekteBoutonRetre();
        kouteDoneFirebase();
    } catch (erè) {
        console.error("Erè nan chaje retre.html:", erè);
    }
};

// 2. KOUTE DONE POU BALANS AK ID PARET DINAMIK
function kouteDoneFirebase() {
    if (auth.currentUser) {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const balEl = document.getElementById('display-balance');
                const idEl = document.getElementById('display-ars-id');
                if (balEl) balEl.innerText = data.balance.toFixed(2) + " HTG";
                if (idEl) idEl.innerText = data.arsID;
            }
        });
    }
}

// 3. KONEKTE BOUTON AK MODAL YO
function konekteBoutonRetre() {
    const btnPrensipal = document.getElementById('btn-konfime-retre');
    const btnNext = document.getElementById('next-to-step2');
    
    if (btnPrensipal) {
        btnPrensipal.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan) return alert("Ranpli tout chan yo!");

            document.getElementById('info-recap').innerHTML = `
                <b>Reseptè:</b> ${non}<br>
                <b>Telefòn:</b> ${tel}<br>
                <b>Metòd:</b> ${metod}
            `;
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }

    if (btnNext) {
        btnNext.onclick = () => {
            const montan = document.getElementById('retre-amount').value;
            document.getElementById('amount-recap').innerText = montan + " HTG";
            document.getElementById('modal-step1').classList.add('hidden');
            document.getElementById('modal-step2').classList.remove('hidden');
        };
    }
}

// 4. FONKSYON GLOBAL POU BOUTON HTML YO KA JWENN YO
window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
};

window.finaliseRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    const arsID = document.getElementById('display-ars-id').innerText;

    document.getElementById('modal-step2').classList.add('hidden');

    try {
        const transID = "RET-" + Date.now();
        await set(ref(db, `transactions/${transID}`), {
            uid: auth.currentUser.uid,
            arsID: arsID,
            type: "Retrè",
            receiver: non,
            phone: tel,
            method: metod,
            amount: montan,
            status: "En attente",
            timestamp: serverTimestamp()
        });

        document.getElementById('modal-final').classList.remove('hidden');

        setTimeout(() => {
            window.showPage('paj-akey');
            document.getElementById('modal-final').classList.add('hidden');
        }, 5000);

    } catch (e) {
        alert("Erè: " + e.message);
    }
};
        
