import { auth, db } from './script.js';
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CHAJMAN DONE PARENNAJ
window.initReferralDashboard = (uid) => {
    if (!uid) return;
    const refPath = `users/${uid}/referral_data`;

    onValue(ref(db, refPath), (snapshot) => {
        const data = snapshot.val() || { balance: 0, total_invites: 0, invite_list: {} };
        
        if(document.getElementById('komisyon-balans')) 
            document.getElementById('komisyon-balans').innerText = (data.balance || 0).toFixed(2);
        
        if(document.getElementById('total-invites')) 
            document.getElementById('total-invites').innerText = data.total_invites || 0;

        get(ref(db, `users/${uid}/arsID`)).then(s => {
            if(document.getElementById('my-ref-code')) 
                document.getElementById('my-ref-code').value = s.val() || "---";
        });

        chajeLisEnvite(data.invite_list);
    });
};

// 2. LIS ENVITE YO
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;"><p>Poko gen moun.</p></div>`;
        return;
    }

    let html = '';
    Object.values(inviteList).reverse().forEach(invite => {
        const isSuccess = invite.status === "Success";
        html += `
            <div class="ist-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-user-circle" style="font-size:25px; color:#cbd5e1;"></i>
                    <div style="display:flex; flex-direction:column;">
                        <b style="font-size:14px;">${invite.name}</b>
                        <small style="font-size:11px; color:#64748b;">ID: ${invite.arsID || 'Atant'}</small>
                    </div>
                </div>
                <span class="${isSuccess ? 'status-success' : 'status-pending'}">
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
    const code = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${code}`;
    const msg = `🚀 *ECHANJ PLUS* \nChanje minit pou kòb kach rapid! \n🎁 Kòd mwen: *${code}* \nEnskri la: ${link}`;

    let url = "";
    if (platform === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
    else if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    
    if (url) window.open(url, '_blank');
};

// 5. TRANSFÈ KOMISYON
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const bal = parseFloat(document.getElementById('komisyon-balans').innerText);

    if (bal < 50) return alert("❌ Minimòm transfè se 50.00 HTG");

    if (confirm(`Voye ${bal.toFixed(2)} HTG nan balans prensipal?`)) {
        try {
            const up = {};
            up[`users/${uid}/referral_data/balance`] = 0;
            up[`users/${uid}/balance`] = increment(bal);
            await update(ref(db), up);
            alert("✅ Transfè reyisi!");
        } catch (e) { alert("Erè."); }
    }
};
