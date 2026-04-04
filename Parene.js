/* ============================================================
   JS PARENE ELITE V4.5 - ECHANJ PLUS (SYSTEM SYNC)
   ============================================================ */
import { auth, db } from './script.js'; 
import { ref, onValue, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. LANSE SISTÈM NAN (Inisyalizasyon Modil)
export function initParennaj(uid) {
    console.log("Modil Parennaj aktive pou:", uid);
    const userRef = ref(db, `users/${uid}`);

    // Koute done yo an tan reyèl pou balans komisyon ak lis envite
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        
        // Mizajou Statistik nan UI a
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        const inputCode = document.getElementById('my-ref-code');
        const mySponsorEl = document.getElementById('my-sponsor');

        if (balEl) {
            balEl.innerText = Number(refData.balance || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + " HTG";
        }
        
        if (countEl) countEl.innerText = refData.total_invites || 0;

        // Mete kòd ARS la nan input pou kopye
        if (inputCode) inputCode.value = userData.arsID || "ARS-CHÈCHE...";

        // Afiche kiyès ki te parennen itilizatè sa a
        if (mySponsorEl) mySponsorEl.innerText = userData.referredBy || "Sistèm";

        // Chaje lis moun yo anba nan paj la
        updateInviteList(refData.invite_list);
    });
}

// 2. FONKSYON POU KOPIYE KÒD LA
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    if (!codeInput || codeInput.value.includes("...")) return;

    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // Pou mobil

    navigator.clipboard.writeText(codeInput.value).then(() => {
        const btn = document.querySelector('.copy-premium-btn');
        if (btn) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.style.background = "#28a745"; // Vèt Echanj Plus la

            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.background = "#000000"; // Retounen nan nwa pwofesyonèl
            }, 2000);
        }
    });
};

// 3. TRANSFÈ KOMISYON (Voye kòb sou balans prensipal)
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Rekipere montan an san lèt oswa vigil
    const balRaw = document.getElementById('komisyon-balans').innerText.replace(/[^\d.]/g, '');
    const montant = parseFloat(balRaw);

    if (montant < 50) {
        alert("❌ Minimòm transfè se 50.00 HTG.");
        return;
    }

    if (confirm(`Èske w vle voye ${montant.toFixed(2)} HTG sou Balans Prensipal ou?`)) {
        try {
            const updates = {};
            // Retire nan komisyon, ajoute nan balans prensipal
            updates[`users/${uid}/referral_data/balance`] = 0;
            updates[`users/${uid}/balance`] = increment(montant);

            await update(ref(db), updates);
            
            if (window.voyeNotifikasyon) {
                window.voyeNotifikasyon(uid, "Parennaj", `Ou transfere ${montant.toFixed(2)} HTG nan balans ou.`);
            }
            alert("✅ Transfè fèt ak siksè!");
        } catch (err) {
            alert("Erè: " + err.message);
        }
    }
};

// 4. MIZAJOU LIS MOUN YO (UI Pwofesyonèl)
function updateInviteList(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:#999;">Poko gen moun nan ekip ou a.</p>`;
        return;
    }

    let html = '';
    const sortedList = Object.values(inviteList).reverse();

    sortedList.forEach(invite => {
        const isSuccess = invite.status === "Success" || invite.status === "Validé";
        html += `
            <div class="invite-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#fff; border-radius:12px; margin-bottom:8px; border: 1px solid #eee;">
                <div>
                    <b style="display:block; font-size:14px;">${invite.name || 'Itilizatè'}</b>
                    <small style="color:#777;">ID: ${invite.arsID || '---'}</small>
                </div>
                <span style="font-size:10px; padding:4px 10px; border-radius:20px; background:${isSuccess ? '#dcfce7' : '#fff9c4'}; color:${isSuccess ? '#166534' : '#854d0e'}; font-weight:bold;">
                    ${isSuccess ? 'VALIDÉ' : 'ATANT'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}
   
