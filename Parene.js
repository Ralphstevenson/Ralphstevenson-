/* ============================================================
   JS PARENE ELITE V4.5 - ECHANJ PLUS (SYSTEM SYNC 2026)
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
            // Netwaye piske HTG a deja nan HTML la apa
            balEl.innerText = Number(refData.balance || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
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

// 2. FONKSYON POU KOPIYE KÒD LA (Mizajou ak Nouvo Bouton an)
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    const btn = document.getElementById('btn-copy-ref');
    if (!codeInput || codeInput.value.includes("...")) return;

    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // Pou aparèy mobil yo

    navigator.clipboard.writeText(codeInput.value).then(() => {
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> OK';
            btn.style.background = "#16a34a"; // Koulè vèt lè l kopye

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = ""; // Retounen nan gradyan CSS la otomatikman
            }, 2000);
        }
    }).catch(err => {
        console.error("Erè nan kopye kòd la: ", err);
    });
};

// 3. TRANSFÈ KOMISYON (Voye kòb sou balans prensipal)
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const balEl = document.getElementById('komisyon-balans');
    if (!balEl) return;

    // Rekipere montan an san lèt oswa vigil
    const balRaw = balEl.innerText.replace(/[^\d.]/g, '');
    const montant = parseFloat(balRaw);

    if (isNaN(montant) || montant < 50) {
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
            alert("Erè nan transfè a: " + err.message);
        }
    }
};

// 4. MIZAJOU LIS MOUN YO (Konpatib ak nouvo kat blan an)
function updateInviteList(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #94a3b8;">
                <i class="fas fa-user-clock" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                <p style="margin: 0; font-size: 12px;">Poko gen okenn aktivite nan ekip ou a.</p>
            </div>`;
        return;
    }

    let html = '';
    const sortedList = Object.values(inviteList).reverse();

    sortedList.forEach(invite => {
        const isSuccess = invite.status === "Success" || invite.status === "Validé";
        html += `
            <div class="invite-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom: 1px solid #f1f5f9;">
                <div>
                    <b style="display:block; font-size:13px; color:#1e293b;">${invite.name || 'Itilizatè'}</b>
                    <small style="color:#64748b; font-size:11px;">ID: ${invite.arsID || '---'}</small>
                </div>
                <span style="font-size:10px; padding:4px 10px; border-radius:20px; background:${isSuccess ? '#dcfce7' : '#fef3c7'}; color:${isSuccess ? '#166534' : '#854d0e'}; font-weight:bold; text-transform: uppercase;">
                    ${isSuccess ? 'VALIDÉ' : 'ATANT'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}

// 5. FONKSYON PATAJE LYEN RAPID SOU REZO YO
window.patajeLien = (platform) => {
    const codeInput = document.getElementById('my-ref-code');
    const myCode = (codeInput && !codeInput.value.includes("...")) ? codeInput.value : "mwen";
    
    // Tèks mesaj la ak lyen aplikasyon w lan
    const mesay = `Alo! Enskri sou Echanj Plus avèk kòd envitasyon mwen an: *${myCode}* pou w ka vann minit Digicel/Natcom epi resevwa kòb ou sou MonCash oswa NatCash byen rapid!`;
    const urlAplikasyon = window.location.href; // Oswa mete lyen sit ou a fix si w vle (egz: "https://echanjplus.com")
    
    const textKòde = encodeURIComponent(`${mesay} \nEnskri la a: ${urlAplikasyon}`);
    let lyenPataje = "";

    switch(platform) {
        case 'whatsapp':
            lyenPataje = `https://api.whatsapp.com/send?text=${textKòde}`;
            break;
        case 'facebook':
            lyenPataje = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlAplikasyon)}&quote=${encodeURIComponent(mesay)}`;
            break;
        case 'telegram':
            lyenPataje = `https://t.me/share/url?url=${encodeURIComponent(urlAplikasyon)}&text=${encodeURIComponent(mesay)}`;
            break;
        case 'sms':
            lyenPataje = `sms:?body=${textKòde}`;
            break;
    }

    if (lyenPataje !== "") {
        window.open(lyenPataje, '_blank');
    }
};
   
