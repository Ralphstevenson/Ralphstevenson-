/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.3 - MODAL & OTOMATIK SYNC
   ============================================================ */
import { auth, db } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon pou fèmen modal la
window.femenModalEchanj = () => {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
};

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
        const pousantajSistem = 0.165; // 16.5% frè
        const freSistem = mVal * pousantajSistem;
        let montanPouResevwa = mVal - freSistem;
        let rabeAplike = 0;

        // Tcheke si se 1er fwa epi si l gen parenn pou rabè 9.5 HTG an
        const isFirstExchange = !userData.first_exchange_done;
        const hasReferral = !!userData.referredBy;

        if (hasReferral && isFirstExchange) {
            rabeAplike = 9.5;
            montanPouResevwa += rabeAplike;
            document.getElementById('box-rabe-premium').classList.remove('hidden');
        } else {
            document.getElementById('box-rabe-premium').classList.add('hidden');
        }

        // 3. RANPLI DONE YO NAN MODAL LA (UI)
        document.getElementById('sum-minit').innerText = mVal.toFixed(2) + " Minit";
        document.getElementById('sum-fre').innerText = "-" + freSistem.toFixed(2) + " HTG";
        document.getElementById('sum-total').innerText = montanPouResevwa.toFixed(2) + " HTG";

        // 4. MONTRÈ MODAL LA
        document.getElementById('modal-confirm-echanj').classList.remove('hidden');

        // 5. LÈ MOUN LAN KLIKE SOU "KONFIME AK PIN" NAN MODAL LA
        document.getElementById('btn-konfime-final').onclick = async () => {
            
            // Fèmen modal la anvan mande PIN
            femenModalEchanj();

            const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime:");
            if (pinAntre !== userData.transactionPin) {
                return alert("❌ PIN enkòrèk. Aksyon anile.");
            }

            // 6. Sove tranzaksyon an ak tout chif kalkile yo
            const transID = "ECH-" + Date.now();
            const transactionData = {
                uid: uid,
                arsID: userData.arsID || "---",
                fullname: userData.fullname || "Itilizatè",
                type: "Echanj",
                rezo: rezo,
                amount_sent: mVal,
                htg_to_receive: parseFloat(montanPouResevwa.toFixed(2)), // Sa k monte sou balans li
                status: "En attente",
                has_referral: hasReferral,
                is_first_time: isFirstExchange,
                timestamp: serverTimestamp()
            };

            // Sove nan Firebase
            await set(ref(db, `transactions/${transID}`), transactionData);
            await set(ref(db, `admin_orders/${transID}`), transactionData);

            // 7. Notifikasyon ak Gmail
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

            // 8. Lanse kòd USSD a otomatikman
            const ussd = rezo === 'digicel' 
                ? `*128*50947111123*${mVal}#` 
                : `*123*88888888*32160708*${mVal}#`;
                
            window.location.href = `tel:${encodeURIComponent(ussd)}`;
        };

    } catch (error) {
        console.error("Erè Echanj:", error);
        alert("Gen yon pwoblèm: " + error.message);
    }
};
