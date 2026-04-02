/* ============================================================
   JS ECHANJ - ECHANJ PLUS V3.2 - SEKIRITE PIN & GMAIL
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.openDialer = async (rezo) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Ou dwe konekte pou w fè yon echanj.");

    try {
        // 1. Tcheke done itilizatè a (PIN ak Info)
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();

        if (!userData || !userData.transactionPin) {
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
            if (window.showPage) window.showPage('paj-parametre');
            return;
        }

        // 2. Mande montan an
        const montan = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
        if (!montan || isNaN(montan) || parseFloat(montan) < 100) {
            return alert("Minimòm echanj se 100 HTG.");
        }

        // 3. Mande PIN pou konfime
        const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime echanj sa a:");
        if (pinAntre !== userData.transactionPin) {
            return alert("❌ PIN enkòrèk. Aksyon anile.");
        }

        // 4. Si tout bagay bon, sove tranzaksyon an
        const transID = "ECH-" + Date.now();
        await set(ref(db, `transactions/${transID}`), {
            uid: uid,
            arsID: userData.arsID || "---",
            type: "Echanj",
            rezo: rezo,
            amount: parseFloat(montan),
            status: "En attente",
            timestamp: serverTimestamp()
        });

        // 5. Deklanche Gmail ak Notifikasyon lokal
        if (window.voyeNotifikasyon) {
            window.voyeNotifikasyon(uid, "Tranzaksyon", `Echanj ${montan} HTG ap tann validasyon.`);
        }
        
        if (window.voyeGmail) {
            window.voyeGmail('echanj', { 
                amount: montan, 
                rezo: rezo, 
                name: userData.fullname 
            });
        }

        // 6. Lanse kòd USSD a otomatikman
        const ussd = rezo === 'digicel' 
            ? `*128*50947111123*${montan}#` 
            : `*123*88888888*32160708*${montan}#`;
            
        window.location.href = `tel:${encodeURIComponent(ussd)}`;

    } catch (error) {
        console.error("Erè Echanj:", error);
        alert("Gen yon pwoblèm ki rive: " + error.message);
    }
};

