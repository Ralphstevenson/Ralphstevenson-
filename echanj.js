/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.5 - LUXURY LOGIC & PIN
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon prensipal ki lanse tout lojik echanj la
export function initEchanj(uid) {
    console.log("Modil Echanj aktive pou:", uid);

    // Nou itilize window.openDialer pou bouton HTML yo ka jwenn li
    window.openDialer = async (rezo) => {
        try {
            // 1. Tcheke enfòmasyon itilizatè a (PIN ak Status)
            const userSnap = await get(ref(db, `users/${uid}`));
            const userData = userSnap.val();

            if (!userData || !userData.transactionPin) {
                alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
                if (window.showPage) window.showPage('paj-parametre');
                return;
            }

            // 2. Mande montan minit y ap vann nan
            const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
            const mVal = parseFloat(montanMinit);

            if (!montanMinit || isNaN(mVal) || mVal < 100) {
                return alert("❌ Minimòm echanj se 100 HTG.");
            }

            // 3. LOJIK KALKIL FRÈ (16.5%)
            const pousantajSistem = 0.165; // Frè 16.5%
            const freSistem = mVal * pousantajSistem;
            let montanPouResevwa = mVal - freSistem;

            // 4. CHÈK PIN SEKIRITE
            const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime echanj la:");
            if (pinAntre !== userData.transactionPin) {
                return alert("❌ PIN enkòrèk. Aksyon anile.");
            }

            // 5. KREYE TRANZAKSYON AN
            const transID = "ECH-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
            const transactionData = {
                transID: transID,
                uid: uid,
                arsID: userData.arsID || "---",
                fullname: userData.fullname || "Kliyan",
                type: "Echanj",
                rezo: rezo,
                amount_sent: mVal,
                htg_to_receive: parseFloat(montanPouResevwa.toFixed(2)),
                status: "En attente",
                timestamp: serverTimestamp()
            };

            // 6. ANREJISTRE NAN FIREBASE (Nan 2 kote pou sekirite)
            await set(ref(db, `transactions/${transID}`), transactionData);
            await set(ref(db, `admin_orders/${transID}`), transactionData);

            // 7. NOTIFIKASYON REAL-TIME
            if (window.voyeNotifikasyon) {
                window.voyeNotifikasyon(uid, "Tranzaksyon", `Echanj ${mVal} minit ${rezo} anrejistre. N ap valide li.`);
            }

            // 8. LANSE KÒD USSD A OTOMATIKMAN
            // Nimewo sèvè a (Egzanp): 47111123
            const ussd = rezo === 'digicel' 
                ? `*128*50947111123*${mVal}#` 
                : `*123*88888888*32160708*${mVal}#`;
                
            alert("Klike OK pou w voye minit yo otomatikman.");
            window.location.href = `tel:${encodeURIComponent(ussd)}`;

        } catch (error) {
            console.error("Erè Echanj:", error);
            alert("Gen yon pwoblèm teknik. Eseye ankò.");
        }
    };
}
