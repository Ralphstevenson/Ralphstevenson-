/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.2 - OTOMATIK RABÈ & KOMISYON
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.openDialer = async (rezo) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Ou dwe konekte pou w fè yon echanj.");

    try {
        // 1. Tcheke done itilizatè a (PIN, Info, ak Lojik Parenn)
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();

        if (!userData || !userData.transactionPin) {
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
            if (window.showPage) window.showPage('paj-parametre');
            return;
        }

        // 2. Mande montan minit y ap vann nan
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
        if (!montanMinit || isNaN(montanMinit) || parseFloat(montanMinit) < 100) {
            return alert("Minimòm echanj se 100 HTG.");
        }

        const mVal = parseFloat(montanMinit);

        // --- LOJIK KALKIL OTOMATIK ---
        const pousantajSistem = 0.165; // 16.5% frè sistèm nan
        let montanPouResevwa = mVal - (mVal * pousantajSistem);
        let rabeAplike = 0;

        // Tcheke si se 1er fwa epi si l gen parenn pou rabè 9.5 HTG an
        if (userData.referredBy && !userData.first_exchange_done) {
            rabeAplike = 9.5;
            montanPouResevwa += rabeAplike;
        }

        // 3. Konfimasyon Vizyèl pou Kliyan an
        const konfime = confirm(
            `RECHIME ECHANJ OU:\n` +
            `--------------------------\n` +
            `Voye: ${mVal} Minit\n` +
            `Frè Sistèm (16.5%): -${(mVal * pousantajSistem).toFixed(2)} HTG\n` +
            (rabeAplike > 0 ? `Rabè Byenveni: +${rabeAplike} HTG\n` : "") +
            `--------------------------\n` +
            `W AP RESEVWA: ${montanPouResevwa.toFixed(2)} HTG\n\n` +
            `Èske w vle kontinye?`
        );

        if (!konfime) return;

        // 4. Mande PIN pou sekirite final
        const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime:");
        if (pinAntre !== userData.transactionPin) {
            return alert("❌ PIN enkòrèk. Aksyon anile.");
        }

        // 5. Sove tranzaksyon an ak tout chif yo pou Admin lan
        const transID = "ECH-" + Date.now();
        const transactionData = {
            uid: uid,
            arsID: userData.arsID || "---",
            fullname: userData.fullname || "Itilizatè",
            type: "Echanj",
            rezo: rezo,
            amount_sent: mVal, // Minit li voye a
            htg_to_receive: parseFloat(montanPouResevwa.toFixed(2)), // Sa l dwe jwenn nan
            status: "En attente",
            has_referral: !!userData.referredBy,
            is_first_time: !userData.first_exchange_done,
            timestamp: serverTimestamp()
        };

        // Sove nan branch tranzaksyon ak admin_orders
        await set(ref(db, `transactions/${transID}`), transactionData);
        await set(ref(db, `admin_orders/${transID}`), transactionData);

        // 6. Notifikasyon ak Gmail
        if (window.voyeNotifikasyon) {
            window.voyeNotifikasyon(uid, "Tranzaksyon", `Echanj ${mVal} Minit ap tann validasyon.`);
        }
        
        if (window.voyeGmail) {
            window.voyeGmail('echanj', { 
                amount: montanPouResevwa.toFixed(2), 
                rezo: rezo, 
                name: userData.fullname 
            });
        }

        // 7. Lanse kòd USSD a otomatikman
        const ussd = rezo === 'digicel' 
            ? `*128*50947111123*${mVal}#` 
            : `*123*88888888*32160708*${mVal}#`;
            
        window.location.href = `tel:${encodeURIComponent(ussd)}`;

    } catch (error) {
        console.error("Erè Echanj:", error);
        alert("Gen yon pwoblèm: " + error.message);
    }
};
