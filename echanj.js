/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.6 - INTEGRATED PREMIUM MODAL
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done tranzaksyon k ap fèt la pou n ka itilize l nan plizyè fonksyon
let tranzaksyonKouran = null;

// 1. FONKSYON POU LOUVRI MODAL LA AK KALKIL YO
window.openDialer = async (rezo) => {
    const user = auth.currentUser;
    if (!user) return alert("🔴 Ou dwe konekte anvan!");

    try {
        // Rekipere enfòmasyon itilizatè a
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        if (!userData || !userData.transactionPin) {
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
            if (window.showPage) window.showPage('paj-parametre');
            return;
        }

        // Mande montan minit nan yon ti bwat prompt
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
        if (!montanMinit) return; // Si l anile

        const mVal = parseFloat(montanMinit);
        if (isNaN(mVal) || mVal < 100) {
            return alert("❌ Minimòm echanj se 100 HTG.");
        }

        // Kalkil Frè (16.5%)
        const pousantajSistem = 0.165; 
        const freSistem = mVal * pousantajSistem;
        let montanPouResevwa = mVal - freSistem;
        let genRabe = false;

        // Tcheke si itilizatè a gen parenn ak premye echanj pou rabè 9.5 HTG nan flash info a
        if (userData.referredBy && (!userData.totalEchanj || userData.totalEchanj === 0)) {
            montanPouResevwa += 9.5;
            genRabe = true;
        }

        // Sove done yo nan memwa pou lè l klike konfime
        tranzaksyonKouran = {
            uid: user.uid,
            userData: userData,
            rezo: rezo,
            amount_sent: mVal,
            fre: freSistem,
            rabe: genRabe ? 9.5 : 0,
            htg_to_receive: parseFloat(montanPouResevwa.toFixed(2))
        };

        // ENTEGRAASYON AK HTML: Mete done yo nan Modal HTML la
        document.getElementById('sum-minit').innerText = `${mVal.toFixed(2)} HTG`;
        document.getElementById('sum-fre').innerText = `-${freSistem.toFixed(2)} HTG`;
        
        const rabeBox = document.getElementById('box-rabe-premium');
        if (genRabe) {
            document.getElementById('sum-rabe').innerText = `+9.50 HTG`;
            rabeBox.classList.remove('hidden');
        } else {
            rabeBox.classList.add('hidden');
        }

        document.getElementById('sum-total').innerText = `${montanPouResevwa.toFixed(2)} HTG`;

        // Louvri Modal la nan retire klas 'hidden' nan HTML la
        document.getElementById('modal-confirm-echanj').classList.remove('hidden');

    } catch (error) {
        console.error("DETAY ERÈ A:", error);
        alert("Gen yon pwoblèm ak koneksyon Database la. Verifye entènèt ou.");
    }
};

// 2. FONKSYON POU ANILE/FEMEN MODAL LA
window.femenModalEchanj = () => {
    document.getElementById('modal-confirm-echanj').classList.add('hidden');
    tranzaksyonKouran = null;
};

// 3. FONKSYON LÈ KLIYAN AN KLIKE "KONFIME AK PIN" NAN MODAL LA
document.addEventListener("DOMContentLoaded", () => {
    const btnKonfime = document.getElementById('btn-konfime-final');
    if (btnKonfime) {
        btnKonfime.addEventListener('click', async () => {
            if (!tranzaksyonKouran) return alert("Pa gen tranzaksyon ki ankou.");

            // Mande PIN pou sekirite
            const pinAntre = prompt("Antre PIN 4 chif ou an pou konfime echanj la:");
            if (!pinAntre) return;
            
            if (pinAntre !== tranzaksyonKouran.userData.transactionPin) {
                return alert("❌ PIN enkòrèk. Aksyon anile.");
            }

            try {
                const transID = "ECH-" + Date.now();
                const transactionData = {
                    transID: transID,
                    uid: tranzaksyonKouran.uid,
                    arsID: tranzaksyonKouran.userData.arsID || "---",
                    fullname: tranzaksyonKouran.userData.fullname || "Kliyan",
                    type: "Echanj",
                    rezo: tranzaksyonKouran.rezo,
                    amount_sent: tranzaksyonKouran.amount_sent,
                    fre_sistem: parseFloat(tranzaksyonKouran.fre.toFixed(2)),
                    rabe_applied: tranzaksyonKouran.rabe,
                    htg_to_receive: tranzaksyonKouran.htg_to_receive,
                    status: "En attente",
                    timestamp: serverTimestamp()
                };

                // SAVE NAN FIREBASE
                await set(ref(db, `transactions/${transID}`), transactionData);
                await set(ref(db, `admin_orders/${transID}`), transactionData);

                // Mete ajou total echanj itilizatè a (opsyonèl pou bloke rabè a pwochen fwa)
                const nouvoTotal = (tranzaksyonKouran.userData.totalEchanj || 0) + 1;
                await set(ref(db, `users/${tranzaksyonKouran.uid}/totalEchanj`), nouvoTotal);

                // Notifikasyon push nan sistèm nan
                if (window.voyeNotifikasyon) {
                    window.voyeNotifikasyon(tranzaksyonKouran.uid, "Tranzaksyon", `Echanj ${tranzaksyonKouran.amount_sent} minit anrejistre.`);
                }

                // Femen modal la depi tout bagay bon
                window.femenModalEchanj();

                // Prepare Kòd USSD a
                const ussd = tranzaksyonKouran.rezo === 'digicel' 
                    ? `*128*50947111123*${tranzaksyonKouran.amount_sent}#` 
                    : `*123*88888888*32160708*${tranzaksyonKouran.amount_sent}#`;
                    
                alert("🎉 Bravo! Tranzaksyon anrejistre. Klike OK pou w voye minit yo otomatikman.");
                window.location.href = `tel:${encodeURIComponent(ussd)}`;

            } catch (error) {
                console.error("Erè pandan konfimasyon:", error);
                alert("Gen yon erè ki rive pandan n ap sove echanj la.");
            }
        });
    }
});

// Fonksyon pou inisyalize
export function initEchanj(uid) {
    console.log("Echanj Ready ak Modal Premium ✅");
    }
           
