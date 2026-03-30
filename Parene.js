/* ============================================================
   JS PARENNAJ PREMIUM - ECHANJ PLUS V3
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. FONKSYON POU LANSE DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;
    
    // Nou kòmanse koute done yo an tan reyèl
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, async (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // A. Mizajou Balans ak Kantite Envite (Pwofesyonèl)
        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        
        if (balEl) balEl.innerText = (refData.balance || 0).toFixed(2);
        if (countEl) countEl.innerText = refData.total_invites || 0;

        // B. JERE KÒD ARS LA (Rale l nan Sidebar oswa Firebase)
        // Nou priyorize tèks ki nan sidebar la pou vitès, si li pa la nou pran l nan Firebase
        const arsSidebar = document.getElementById('sidebar-ars-id')?.innerText; 
        const inputCode = document.getElementById('my-ref-code');
        
        if (inputCode) {
            inputCode.value = arsSidebar || userData.arsID || "ARS-LOADING...";
        }

        // C. PARENN MWEN (Moun ki te envite w la)
        const mySponsorEl = document.getElementById('my-sponsor');
        if (mySponsorEl) {
            const referredBy = userData.referredBy;
            if (referredBy) {
                try {
                    const sponsorSnap = await get(ref(db, `users/${referredBy}/fullname`));
                    const full = sponsorSnap.val() || "Sistèm";
                    mySponsorEl.innerText = full.split(' ')[0]; // Pran premye non an sèlman
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

// 2. LIS ENVITE YO (STYLE PREMIUM)
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; opacity:0.5;">
                <i class="fas fa-user-group" style="font-size:30px; margin-bottom:10px;"></i>
                <p style="font-size:13px;">Ou poko gen moun nan ekip ou a.</p>
            </div>`;
        return;
    }

    let html = '<div class="premium-list-wrapper">';
    Object.values(inviteList).reverse().forEach(invite => {
        const isSuccess = invite.status === "Success";
        html += `
            <div class="ist-item-glass">
                <div class="user-info">
                    <div class="user-avatar-small"><i class="fas fa-user-circle"></i></div>
                    <div class="user-det">
                        <b>${invite.name}</b>
                        <small>ID: ${invite.arsID || 'Atant'}</small>
                    </div>
                </div>
                <span class="status-badge-elite ${isSuccess ? 'success' : 'pending'}">
                    ${isSuccess ? 'Validé' : 'En attente'}
                </span>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 3. KOPIYE KÒD (Serye)
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    if (!codeInput || codeInput.value.includes("LOADING")) return;

    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // Pou mobil
    navigator.clipboard.writeText(codeInput.value).then(() => {
        // Ou ka ajoute yon "Toast" oswa yon ti alèt pwofesyonèl
        alert("✅ Kòd " + codeInput.value + " kopye!");
    });
};

// 4. PATAJE MODÈN (Avèk kòd ARS la)
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

// 5. TRANSFÈ KOMISYON (Firebase Update)
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const balText = document.getElementById('komisyon-balans')?.innerText || "0";
    const montant = parseFloat(balText);

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
        
