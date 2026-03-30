/* ============================================================
   JS PARENNAJ PREMIUM - ECHANJ PLUS V3.2 (SYNC SIDEBAR)
   ============================================================ */
import { auth, db } from './script.js'; // Enpòte depi nan Gwo JS ou a
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD PARENNAJ
window.initReferralDashboard = (uid) => {
    if (!uid) return;
    
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, async (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // A. Mizajou Balans Komisyon & Ekip
        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        
        if (balEl) balEl.innerText = (refData.balance || 0).toFixed(2);
        if (countEl) countEl.innerText = refData.total_invites || 0;

        // B. SYNC AK SIDEBAR (ID ARS LA)
        // Nou pran tèks ki nan "side-id" Sidebar a jan sa parèt nan Gwo JS ou a
        const arsIDReal = document.getElementById('side-id')?.innerText;
        const inputCode = document.getElementById('my-ref-code');
        
        if (inputCode) {
            // Si Sidebar a gen "---", nou pran l nan Firebase dirèkteman
            inputCode.value = (arsIDReal && arsIDReal !== "---") ? arsIDReal : (userData.arsID || "ARS-...");
        }

        // C. PARENN MWEN (Moun ki te envite w la)
        const mySponsorEl = document.getElementById('my-sponsor');
        if (mySponsorEl) {
            const referredBy = userData.referredBy || userData.sponsor_id; // Tcheke tou de non yo
            if (referredBy) {
                try {
                    const sponsorSnap = await get(ref(db, `users/${referredBy}/fullname`));
                    const full = sponsorSnap.val() || "Sistèm";
                    mySponsorEl.innerText = full.split(' ')[0]; 
                } catch (e) {
                    mySponsorEl.innerText = "Sistèm";
                }
            } else {
                mySponsorEl.innerText = "Okenn";
            }
        }

        // D. CHAJE LIS EKIP LA
        chajeLisEnvite(refData.invite_list);
    });
};

// 2. LIS ENVITE YO (STYLE GLASS LIST)
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
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:rgba(0,0,0,0.02); border-radius:16px; margin-bottom:10px; border: 1px solid rgba(0,0,0,0.04);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:35px; height:35px; background:#109121; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fas fa-user" style="font-size:14px;"></i>
                    </div>
                    <div>
                        <b style="display:block; font-size:14px; color:#1e293b;">${invite.name}</b>
                        <small style="font-size:11px; color:#64748b;">${invite.arsID || 'Partner'}</small>
                    </div>
                </div>
                <span style="font-size:10px; font-weight:900; padding:4px 8px; border-radius:6px; background:${isSuccess ? '#dcfce7' : '#fef9c3'}; color:${isSuccess ? '#166534' : '#854d0e'};">
                    ${isSuccess ? 'VALIDÉ' : 'ATANT'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}

// 3. KOPIYE KÒD
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    if (!codeInput || codeInput.value.includes("...")) return;

    codeInput.select();
    navigator.clipboard.writeText(codeInput.value);
    
    // Ti animasyon sou bouton an oswa alèt
    alert("✅ Kòd " + codeInput.value + " kopye!");
};

// 4. PATAJE MODÈN
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `🚀 *ECHANJ PLUS* \nChanje minit pou kòb kach rapid! \n\n🎁 Kòd pa m nan: *${myCode}* \nEnskri la: ${link}`;

    let url = "";
    if (platform === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    else if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
    else if (platform === 'sms') url = `sms:?body=${encodeURIComponent(msg)}`;
    
    if (url) window.open(url, '_blank');
};

// 5. TRANSFÈ KOMISYON
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const montan = parseFloat(document.getElementById('komisyon-balans').innerText);

    if (montant < 50) return alert("❌ Ou bezwen omwen 50.00 HTG.");

    if (confirm(`Voye ${montant.toFixed(2)} HTG nan Balans Prensipal?`)) {
        try {
            const updates = {};
            updates[`users/${uid}/referral_data/balance`] = 0;
            updates[`users/${uid}/balance`] = increment(montant);
            await update(ref(db), updates);
            alert("✅ Transfè reyisi!");
        } catch (err) { alert("Erè teknik."); }
    }
};
   
