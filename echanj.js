/* ============================================================
   ECHANJ PLUS - CLIENT ECHANJ CORE
   ============================================================ */
import { ref, get, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global Variables
let currentSystemFee = 16.5; // Pa defo 16.5%
let isExchangeActive = true;
let selectedOperator = '';
let recipientDigicelNumber = "50947111123";
let recipientNatcomNumber = "32160708";

export function initEchanjKliyan(db, currentUser) {
    if (!db) return;

    // 1. Chaje ak koute paramèt nan Firebase
    listenToSettings(db);

    // 2. Bouton Konfime ak PIN anndan Modal Echanj
    const btnKonfime = document.getElementById('btn-konfime-final');
    if (btnKonfime) {
        btnKonfime.onclick = () => {
            fèEchanjFinal(db, currentUser);
        };
    }
}

// KOUTE PARAMÈT FOUNISE DEPI NAN FIREBASE
function listenToSettings(db) {
    onValue(ref(db, 'settings'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            currentSystemFee = data.systemFee !== undefined ? parseFloat(data.systemFee) : 16.5;
            isExchangeActive = data.exchangeActive !== undefined ? data.exchangeActive : true;
            recipientDigicelNumber = data.digicelNumber || "50947111123";
            recipientNatcomNumber = data.natcomNumber || "32160708";
        } else {
            // Si settings yo vide, mete pa defo sou active
            isExchangeActive = true;
            currentSystemFee = 16.5;
        }

        // Mizajou baliz UI Frè nan paj la
        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${currentSystemFee}% Frè`;
        });
        
        const sumFeeEl = document.getElementById('sum-fee-percent');
        if (sumFeeEl) sumFeeEl.innerText = currentSystemFee;
    });
}

// FONKSYON KI OUVÈ DIALER AN LÈ KLIYAN KLIKE SOU DIGICEL / NATCOM
window.openDialer = function(operator) {
    if (!isExchangeActive) {
        alert("⚠️ Sèvis echanj la tanporèman pa disponib pou kounye a. Tanpri retounen pita!");
        return;
    }

    selectedOperator = operator;
    const numberToCall = (operator === 'digicel') ? recipientDigicelNumber : recipientNatcomNumber;

    const amountStr = prompt(`Antre kantite minit (${operator.toUpperCase()}) w ap voye pou echanje:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        alert("❌ Tanpri antre yon montan ki valab!");
        return;
    }

    // Kalkil Frè ak Total pou Resevwa
    const freHTG = (amount * currentSystemFee) / 100;
    const totalToReceive = amount - freHTG;

    // Montre rezime a nan Modal la
    document.getElementById('sum-minit').innerText = `${amount.toFixed(2)} HTG`;
    document.getElementById('sum-fre').innerText = `-${freHTG.toFixed(2)} HTG`;
    document.getElementById('sum-total').innerText = `${totalToReceive.toFixed(2)} HTG`;

    // Netwaye ti bwat input PIN an anvan nou ouvè modal la
    const pinInput = document.getElementById('input-pin-echanj');
    if (pinInput) pinInput.value = '';

    // Storke done tanporè yo
    window.currentPendingExchange = {
        amount: amount,
        feePercent: currentSystemFee,
        feeHTG: freHTG,
        toReceive: totalToReceive,
        rezo: operator,
        recipientNumber: numberToCall
    };

    // Ouvè Modal Konfimasyon an
    const modal = document.getElementById('modal-confirm-echanj');
    if (modal) modal.classList.remove('hidden');
};

// FONKSYON POU FÈMEN MODAL ECHANJ
window.femenModalEchanj = function() {
    const modal = document.getElementById('modal-confirm-echanj');
    if (modal) modal.classList.add('hidden');
    
    // Netwaye PIN la lè modal la fèmen
    const pinInput = document.getElementById('input-pin-echanj');
    if (pinInput) pinInput.value = '';
};

// FONKSYON POU KREYE TRANSAKSYON NAN FIREBASE
async function fèEchanjFinal(db, currentUser) {
    if (!window.currentPendingExchange) return;
    if (!currentUser) {
        alert("❌ Ou dwe konekte pou w reyalize operasyon sa a!");
        return;
    }

    // Li PIN an depi nan bwat input ki nan modal la
    const pinInputEl = document.getElementById('input-pin-echanj');
    const pinInput = pinInputEl ? pinInputEl.value.trim() : "";

    if (!pinInput || pinInput.length < 4) {
        alert("❌ Tanpri antre PIN sekirite 4 chif ou an nan bwat la!");
        if (pinInputEl) pinInputEl.focus();
        return;
    }

    // 1. Verifye PIN nan baz done a
    try {
        const userSnap = await get(ref(db, `users/${currentUser.uid}`));
        if (userSnap.exists()) {
            const userData = userSnap.val();
            if (userData.pin && userData.pin.toString() !== pinInput.toString()) {
                alert("❌ Kòd PIN sa a pa egzak!");
                return;
            }
        }

        const data = window.currentPendingExchange;
        const txRef = push(ref(db, 'transactions'));

        const newTransaction = {
            uid: currentUser.uid,
            fullname: userSnap.exists() ? (userSnap.val().full_name || userSnap.val().fullname || 'Kliyan ARS') : 'Kliyan ARS',
            ars_id: userSnap.exists() ? (userSnap.val().arsID || userSnap.val().ars_id || 'N/A') : 'N/A',
            amount: data.amount,
            fee: data.feeHTG,
            to_receive: data.toReceive,
            rezo: data.rezo,
            type: "echanj",
            status: "pending",
            timestamp: Date.now()
        };

        await set(txRef, newTransaction);

        // Netwaye epi fèmen modal
        window.femenModalEchanj();
        alert(`✅ Demann echanj ${data.amount} HTG anrejistre ak siksè!\n\nKounye a, nou pral redireksyone w pou fè transfè minit an sou nimewo ${data.recipientNumber}.`);

        // Redireksyon sou telefòn pou kòd USSD transfè a
        window.location.href = `tel:${data.recipientNumber}`;

    } catch (err) {
        alert("❌ Erè nan anrejistreman echanj la: " + err.message);
    }
}

// POPUPS DETAY FEATURES (Kalkilatris, Parennaj, Resi)
window.openFeatureModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};

window.closeFeatureModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
};

window.closeFeatureModalOnOverlay = function(event, id) {
    if (event.target.id === id) {
        window.closeFeatureModal(id);
    }
};
