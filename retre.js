// Ajoute "get" ak "update" nan enpòtasyon Firebase ou yo anlè a
import { ref, set, serverTimestamp, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.finaliseRetre = async () => {
    const non = document.getElementById('retre-name').value;
    const tel = document.getElementById('retre-phone').value;
    const metod = document.getElementById('retre-method').value;
    const montan = parseFloat(document.getElementById('retre-amount').value);
    const arsID = document.getElementById('display-ars-id').innerText;
    const uid = auth.currentUser.uid;

    // 1. Validasyon de baz
    if (!non || !tel || isNaN(montan) || montan < 100) {
        alert("Tanpri ranpli tout chan yo kòrèkteman (Minimòm 100 HTG)");
        return;
    }

    document.getElementById('modal-step2').classList.add('hidden');

    try {
        // 2. Tcheke balans kliyan an anvan nou fè anyen
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();
        const balansKounye a = parseFloat(userData.balance || 0);

        if (balansKounye a < montan) {
            alert("Ou pa gen ase kòb pou retrè sa a!");
            return;
        }

        // 3. KALKILE NOUVO BALANS LAN
        const nouvoBalans = balansKounye a - montan;

        // 4. EKRI NAN DATABASE LAN (Tranzaksyon + Mizajou Balans)
        const transID = "RET-" + Date.now();
        
        // Nou fè de (2) operasyon an menm tan pou evite erè
        const updates = {};
        // Kreye tranzaksyon an
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
        // Soustrè kòb la nan kont kliyan an
        updates[`/users/${uid}/balance`] = nouvoBalans;

        await update(ref(db), updates);

        // 5. Montre siksè
        document.getElementById('modal-final').classList.remove('hidden');

        setTimeout(() => {
            window.showPage('paj-akey');
            document.getElementById('modal-final').classList.add('hidden');
        }, 5000);

    } catch (erè) {
        console.error("Erè nan retrè a:", erè);
        alert("Yon erè rive. Retrè a pa fèt.");
    }
};
            
