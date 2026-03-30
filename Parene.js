/* ============================================================
   LOJIK PARENE.JS - ECHANJ PLUS V3.2 (PREMIUM SYNC)
   ============================================================ */
import { auth, db } from './script.js'; 
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. FONKSYON PRENSIPAL POU DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;
    
    const userRef = ref(db, `users/${uid}`);

    // Nou koute done yo an tan reyèl
    onValue(userRef, async (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // A. Mizajou Balans Komisyon ak Statistik
        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        
        if (balEl) balEl.innerText = (refData.balance || 0).toFixed(2);
        if (countEl) countEl.innerText = refData.total_invites || 0;

        // B. INSTANT-SYNC POU ID KLIYAN (Pran nan Sidebar)
        const inputCode = document.getElementById('my-ref-code');
        const sideID = document.getElementById('side-id')?.innerText;

        if (inputCode) {
            // Si sidebar a gen ID a deja (jan ou di a), nou fòse l monte
            if (sideID && sideID !== "---" && sideID !== "") {
                inputCode.value = sideID;
            } else {
                // Si sidebar a ta gen yon pwoblèm, nou pran l nan Firebase dirèkteman
                inputCode.value = userData.arsID || "ARS-ATANT";
            }
        }

        // C. JERE NON PARENN MWEN
        const mySponsorEl = document.getElementById('my-sponsor');
        if (mySponsorEl) {
            const sponsorID = userData.referredBy || userData.sponsor_id; 
            if (sponsorID) {
                try {
                    const sponsorSnap = await get(ref(db, `users/${sponsorID}/fullname`));
                    const full = sponsorSnap.val() || "Sistèm";
                    mySponsorEl.innerText = full.split(' ')[0]; // Afiche sèlman premye non an
                } catch (e) {
                    mySponsorEl.innerText = "Sistèm";
                }
            } else {
                mySponsorEl.innerText = "Okenn";
            }
        }

        // D. CHAJE LIS MOUN ENVITE YO
        chajeLisEnvite(refData.invite_list);
    });
};

// 2. LIS ENVITE YO (STYLE PREMIUM)
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:30px; font-size:12px;">Poko gen okenn aktivite nan ekip ou a.</p>`;
        return;
    }

    let html = '';
    Object.values(inviteList).reverse().forEach(invite => {
        const isSuccess = invite.status === "Success";
        html += `
            <div class="ist-item-glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:rgba(0,0,0,0.02); border-radius:16px; margin-bottom:10px; border: 1px solid rgba(0,0,0,0.04);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:35px; height:35px; background:#109121; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fas fa-user" style="font-size:14px;"></i>
                    </div>
                    <div>
                        <b style="display:block; font-size:14px; color:#1e293b;">${invite.name}</b>
                        <small style="font-size:11px; color:#64748b;">ID: ${invite.arsID || '---'}</small>
                    </div>
                </div>
                <span style="font-size:10px; font-weight:900; padding:4px 8px; border-radius:6px; background:${isSuccess ? '#dcfce7' : '#fef9c3'}; color:${isSuccess ? '#166534' : '#854d0e'}; text-transform:uppercase;">
                    ${isSuccess ? 'Validé' : 'Atant'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}

// 3. KOPIYE KÒD (STYLE TEKNISYEN)
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    if (!codeInput || codeInput.value.includes("...")) return;

    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // Pou mobil
    navigator.clipboard.writeText(codeInput.value).then(() => {
        alert("✅ Kòd " + codeInput.value + " kopye!");
    });
};

// 4. PATAJE LYEN (AVÈK KÒD ARS LA)
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `🚀 *ECHANJ PLUS* \nChanje minit pou kòb kach rapid ak sekirite! \n\n🎁 Kòd kado: *${myCode}* \nEnskri isit la: ${link}`;

    let url = "";
    switch(platform) {
        case 'whatsapp': url = `https://wa.me/?text=${encodeURIComponent(msg)}`; break;
        case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`; break;
        case 'telegram': url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`; break;
        case 'sms': url = `sms:?body=${encodeURIComponent(msg)}`; break;
    }
    if (url) window.open(url, '_blank');
};

// 5. TRANSFÈ KOMISYON NAN BALANS PRENSIPAL
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const montant = parseFloat(document.getElementById('komisyon-balans').innerText);

    if (montant < 50) {
        alert("❌ Minimòm transfè se 50.00 HTG.");
        return;
    }

    if (confirm(`Èske w vle voye ${montant.toFixed(2)} HTG nan Balans Prensipal ou?`)) {
        try {
            const updates = {};
            updates[`users/${uid}/referral_data/balance`] = 0;
            updates[`users/${uid}/balance`] = increment(montant);

            await update(ref(db), updates);
            alert("✅ Transfè fèt ak siksè! Balans ou mete ajou.");
        } catch (err) {
            console.error(err);
            alert("Erè teknik. Eseye ankò pita.");
        }
    }
};
   
