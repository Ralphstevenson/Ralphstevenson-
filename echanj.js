/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.6 - REALTIME SETTINGS INTEGRATED
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Varyab pou gade paramèt sistèm yo an tan reyèl
let liveSettings = {
    rateBuy: 0,
    rateSell: 0,
    systemFee: 16.5,
    exchangeActive: true
};

// Koute paramèt ak to yo otomatikman
onValue(ref(db, 'settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        liveSettings.rateBuy = data.rateBuy || 0;
        liveSettings.rateSell = data.rateSell || 0;
        liveSettings.systemFee = data.systemFee !== undefined ? data.systemFee : 16.5;
        liveSettings.exchangeActive = data.exchangeActive !== undefined ? data.exchangeActive : true;
    }
});

// Nou mete l an deyò pou l toujou disponib
window.openDialer = async (rezo) => {
    const user = auth.currentUser;
    if (!user) return alert("Ou dwe konekte anvan!");

    // 0. Tcheke si Admin an dezaktive sèvis Echanj la
    if (!liveSettings.exchangeActive) {
        return alert("⚠️ Sèvis echanj la tanporèman pa disponib pou kounye a. Tanpri retounen pita!");
    }

    try {
        // 1. Rekipere enfòmasyon itilizatè a
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        if (!userData || !userData.transactionPin) {
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
            if (window.showPage) window.showPage('paj-parametre');
            return;
        }

        // 2. Mande montan minit
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
        if (!montanMinit) return; // Si l anile

        const mVal = parseFloat(montanMinit);
        if (isNaN(mVal) || mVal < 100) {
            return alert("❌ Minimòm echanj se 100 HTG.");
        }

        // 3. Kalkil Frè ak To an tan reyèl (Rale nan settings Firebase)
        const pousantajSistem = liveSettings.systemFee / 100; // e.g. 16.5% -> 0.165
        const freSistem = mVal * pousantajSistem;
        let montanPouResevwa = mVal - freSistem;

        // 4. Chèk PIN
        const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime:");
        if (!pinAntre) return;
        if (pinAntre !== userData.transactionPin) {
            return alert("❌ PIN enkòrèk. Aksyon anile.");
        }

        // 5. Kreye Tranzaksyon
        const transID = "ECH-" + Date.now();
        const transactionData = {
            transID: transID,
            uid: user.uid,
            arsID: userData.arsID || "---",
            fullname: userData.fullname || "Kliyan",
            type: "Echanj",
            rezo: rezo,
            amount_sent: mVal,
            applied_fee_percent: liveSettings.systemFee,
            fee_amount: parseFloat(freSistem.toFixed(2)),
            htg_to_receive: parseFloat(montanPouResevwa.toFixed(2)),
            status: "En attente",
            timestamp: serverTimestamp()
        };

        // SAVE NAN FIREBASE
        await set(ref(db, `transactions/${transID}`), transactionData);
        await set(ref(db, `admin_orders/${transID}`), transactionData);

        // 6. Notifikasyon
        if (window.voyeNotifikasyon) {
            window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${mVal} minit anrejistre.`);
        }

        // 7. USSD
        const ussd = rezo === 'digicel' 
            ? `*128*50947111123*${mVal}#` 
            : `*123*88888888*32160708*${mVal}#`;
            
        alert("Bravo! Tranzaksyon anrejistre. Klike OK pou w voye minit yo.");
        window.location.href = `tel:${encodeURIComponent(ussd)}`;

    } catch (error) {
        console.error("DETAY ERÈ A:", error);
        alert("Gen yon pwoblèm ak koneksyon Database la. Verifye entènèt ou.");
    }
};

// Fonksyon pou inisyalize
export function initEchanj(uid) {
    console.log("Echanj Ready ✅");
    }
