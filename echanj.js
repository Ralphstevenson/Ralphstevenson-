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
    exchangeActive: true,
    digicelNumber: "50947111123",
    natcomNumber: "32160708"
};

// Koute paramèt ak to yo otomatikman nan Firebase
onValue(ref(db, 'settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        liveSettings.rateBuy = data.rateBuy || 0;
        liveSettings.rateSell = data.rateSell || 0;
        liveSettings.systemFee = data.systemFee !== undefined ? data.systemFee : 16.5;
        liveSettings.exchangeActive = data.exchangeActive !== undefined ? data.exchangeActive : true;
        liveSettings.digicelNumber = data.digicelNumber || "50947111123";
        liveSettings.natcomNumber = data.natcomNumber || "32160708";

        // Mizajou afichaj frè an tan reyèl sou paj la
        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${liveSettings.systemFee}% Frè`;
        });
        
        const sumFeePercent = document.getElementById('sum-fee-percent');
        if (sumFeePercent) sumFeePercent.innerText = liveSettings.systemFee;
    }
});

// Nou mete l an deyò pou l toujou disponib
window.openDialer = async (rezo) => {
    const user = auth.currentUser;
    if (!user) return alert("Ou dwe konekte anvan!");

    // 0. Tcheke si Admin an dezaktive sèvis Echanj la (ON / OFF)
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

        // 3. Kalkil Frè ak To an tan reyèl
        const pousantajSistem = liveSettings.systemFee / 100;
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
            fullname: userData.fullname || userData.username || "Kliyan",
            phone: userData.phone || "",
            type: "Echanj",
            rezo: rezo,
            amount_sent: mVal,
            applied_fee_percent: liveSettings.systemFee,
            fee_amount: parseFloat(freSistem.toFixed(2)),
            htg_to_receive: parseFloat(montanPouResevwa.toFixed(2)),
            status: "En attente",
            timestamp: serverTimestamp()
        };

        // SAVE NAN FIREBASE (Transactions, Admin Orders, ak Node User a pou Istorik)
        await set(ref(db, `transactions/${transID}`), transactionData);
        await set(ref(db, `admin_orders/${transID}`), transactionData);
        await set(ref(db, `users/${user.uid}/user_transactions/${transID}`), transactionData);

        // 6. Notifikasyon
        if (window.voyeNotifikasyon) {
            window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${mVal} minit anrejistre.`);
        }

        // 7. Genère USSD ak nimewo ki soti nan Admin lan
        const targetNumber = (rezo === 'digicel') ? liveSettings.digicelNumber : liveSettings.natcomNumber;
        const ussd = (rezo === 'digicel') 
            ? `*128*${targetNumber}*${mVal}#` 
            : `*123*88888888*${targetNumber}*${mVal}#`;
            
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
    
