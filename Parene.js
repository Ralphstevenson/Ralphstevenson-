import { auth, db } from './script.js';
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD
window.initReferralDashboard = (uid) => {
    if (!uid) return;
    
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, async (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // A. Mizajou Balans Komisyon & Ekip (Soti nan referral_data)
        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        document.getElementById('komisyon-balans').innerText = (refData.balance || 0).toFixed(2);
        document.getElementById('total-invites').innerText = refData.total_invites || 0;

        // B. Mizajou Kòd ARS (Soti nan users/uid/arsID)
        const inputCode = document.getElementById('my-ref-code');
        if (inputCode) inputCode.value = userData.arsID || "---";

        // C. Chaje Non Parenn (Moun ki te envite l la)
        const referredBy = userData.referredBy; 
        if (referredBy) {
            try {
                const sponsorSnap = await get(ref(db, `users/${referredBy}/fullname`));
                const sponsorName = sponsorSnap.val() ? sponsorSnap.val().split(' ')[0] : "Sistèm";
                document.getElementById('my-sponsor').innerText = sponsorName;
            } catch (e) {
                document.getElementById('my-sponsor').innerText = "Sistèm";
            }
        } else {
            document.getElementById('my-sponsor').innerText = "Okenn";
        }

        // D. Chaje Lis Envite yo
        chajeLisEnvite(refData.invite_list);
    });
};

// 2. LIS MOUN ENVITE
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px;">Poko gen moun nan ekip la.</p>`;
        return;
    }

    let html = '';
    Object.values(inviteList).reverse().forEach(invite => {
        const isSuccess = invite.status === "Success";
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(0,0,0,0.03); border-radius:12px; margin-bottom:8px; border: 1px solid rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-user-circle" style="font-size:22px; color:#109121;"></i>
                    <b style="font-size:13px;">${invite.name}</b>
                </div>
                <span style="font-size:10px; font-weight:800; color:${isSuccess ? '#109121' : '#f39c12'};">
                    ${isSuccess ? 'Validé' : 'En attente'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}

// 3. KOPIYE KÒD
window.kopiyeKod = () => {
    const code = document.getElementById('my-ref-code');
    code.select();
    navigator.clipboard.writeText(code.value);
    alert("✅ Kòd " + code.value + " kopye!");
};

// 4. PATAJE MODÈN
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `🚀 *ECHANJ PLUS* \nChanje minit pou kòb kach rapid! \n🎁 Kòd mwen: *${myCode}* \nEnskri la: ${link}`;

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
    const komisyon = parseFloat(document.getElementById('komisyon-balans').innerText);

    if (komisyon < 50) return alert("❌ Ou bezwen omwen 50.00 HTG.");

    if (confirm(`Èske ou vle voye ${komisyon.toFixed(2)} HTG nan Balans Prensipal?`)) {
        try {
            const updates = {};
            updates[`users/${uid}/referral_data/balance`] = 0;
            updates[`users/${uid}/balance`] = increment(komisyon); // Balans prensipal

            await update(ref(db), updates);
            alert("✅ Transfè reyisi!");
        } catch (err) {
            alert("Erè teknik.");
        }
    }
};
