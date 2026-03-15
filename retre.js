import { auth, db } from './script.js';
import { ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon pou kache tout modal yo (Anile)
window.closeAllModals = () => {
    document.getElementById('modal-step1').classList.add('hidden');
    document.getElementById('modal-step2').classList.add('hidden');
};

function konekteBoutonRetre() {
    const btnPrensipal = document.getElementById('btn-konfime-retre');
    
    if (btnPrensipal) {
        btnPrensipal.onclick = () => {
            const non = document.getElementById('retre-name').value;
            const tel = document.getElementById('retre-phone').value;
            const metod = document.getElementById('retre-method').value;
            const montan = document.getElementById('retre-amount').value;

            if (!non || !tel || !montan) return alert("Ranpli tout chan yo!");

            // 1. Prepare Recap pou premye modal la
            document.getElementById('info-recap').innerHTML = `
                <b>Reseptè:</b> ${non}<br>
                <b>Telefòn:</b> ${tel}<br>
                <b>Metòd:</b> ${metod}
            `;
            
            // 2. Montre Modal 1
            document.getElementById('modal-step1').classList.remove('hidden');
        };
    }

    // Bouton OK nan Modal 1 k ap mennen nan Modal 2
    document.getElementById('next-to-step2').onclick = () => {
        const montan = document.getElementById('retre-amount').value;
        document.getElementById('amount-recap').innerText = montan + " HTG";
        
        document.getElementById('modal-step1').classList.add('hidden');
        document.getElementById('modal-step2').classList.remove('hidden');
    };
}

// Fonksyon final ki voye done yo nan Firebase
window.finaliseRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    const arsID = document.getElementById('display-ars-id').innerText;

    // Kache Modal 2
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

        // Montre Lordicon Final
        document.getElementById('modal-final').classList.remove('hidden');

        // Tann 5 segonn pou tounen nan akey
        setTimeout(() => {
            if(window.showPage) {
                window.showPage('paj-akey');
                document.getElementById('modal-final').classList.add('hidden');
            } else {
                location.reload();
            }
        }, 5000);

    } catch (e) {
        alert("Erè: " + e.message);
    }
};

// Rele fonksyon chajman an
enjekteHtmlRetre();
    
