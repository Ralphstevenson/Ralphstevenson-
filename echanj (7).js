/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.6 - FIXED TECHNICAL ERROR
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Nou mete l an deyò pou l toujou disponib
window.openDialer = async (rezo) => {
    const user = auth.currentUser;
    if (!user) return alert("Ou dwe konekte anvan!");

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

        // 3. Kalkil Frè (16.5%)
        const pousantajSistem = 0.165; 
        const freSistem = mVal * pousantajSistem;
        let montanPouResevwa = mVal - freSistem;

        // 4. Chèk PIN
        const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime:");
        if (!pinAntre) return;
        if (pinAntre !== userData.transactionPin) {
            return alert("❌ PIN enkòrèk. Aksyon anile.");
        }

        // 5. Kreye Tranzaksyon (Nou itilize try/catch isit la pou evite erè a)
        const transID = "ECH-" + Date.now();
        const transactionData = {
            transID: transID,
            uid: user.uid,
            arsID: userData.arsID || "---",
            fullname: userData.fullname || "Kliyan",
            type: "Echanj",
            rezo: rezo,
            amount_sent: mVal,
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

// Fonksyon pou inisyalize (opsyonèl si w vle l)
export function initEchanj(uid) {
    console.log("Echanj Ready ✅");
            }
           
