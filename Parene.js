/* ============================================================
   JS PARENNAJ ELITE - ECHANJ PLUS V3 (NETWAYE)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;

    const refDataPath = `users/${uid}/referral_data`;
    
    onValue(ref(db, refDataPath), (snapshot) => {
        const data = snapshot.val() || { balance: 0, total_invites: 0, invite_list: {} };
        
        // Mizajou UI Balans Komisyon anndan paj parennaj la
        const komisyonEl = document.getElementById('komisyon-balans');
        const inviteEl = document.getElementById('total-invites');
        
        if (komisyonEl) komisyonEl.innerText = (data.balance || 0).toFixed(2);
        if (inviteEl) inviteEl.innerText = data.total_invites || 0;
        
        // Chaje kòd ARS itilizatè a
        get(ref(db, `users/${uid}/arsID`)).then((arsSnap) => {
            const arsID = arsSnap.val() || "---";
            const inputCode = document.getElementById('my-ref-code');
            if (inputCode) inputCode.value = arsID;
        });

        // Chaje Lis Envite yo
        chajeLisEnvite(data.invite_list);
    });
};

// 2. TABLO ENVITE
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `<div class="empty-msg"><p>Ou poko gen okenn moun nan ekip ou a.</p></div>`;
        return;
    }

    let html = '<div class="referral-list">';
    Object.values(inviteList).reverse().forEach(invite => {
        const statusClass = invite.status === "Success" ? "status-success" : "status-pending";
        const statusText = invite.status === "Success" ? "Validé" : "En attente";
        
        html += `
            <div class="ist-item">
                <div class="ist-info">
                    <div class="ist-icon"><i class="fas fa-user-circle"></i></div>
                    <div class="ist-details">
                        <b>${invite.name}</b>
                        <small>ID: ${invite.arsID || 'Atant...'}</small>
                    </div>
                </div>
                <div class="ist-amount">
                    <span class="badge-status ${statusClass}">${statusText}</span>
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// 3. KOPIYE KÒD LA
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    if (!copyText) return;
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("✅ Kòd " + copyText.value + " kopiye!");
};

// 4. PATAJE LIEN
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `*ECHANJ PLUS* 🚀\nChanje minit pou kòb kach!\n\n🎁 Kòd mwen: *${myCode}*\nEnskri la: ${link}`;

    let url = "";
    if (platform === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
    
    if (url) window.open(url, '_blank');
};

// 5. TRANSFERE KOMISYON
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const balanceVal = document.getElementById('komisyon-balans')?.innerText || "0";
    const montant = parseFloat(balanceVal);

    if (montant < 50) return alert("❌ Minimòm transfè se 50 HTG.");

    if (confirm(`Èske ou vle voye ${montant.toFixed(2)} HTG nan Balans Prensipal ou?`)) {
        try {
            const updates = {};
            updates[`users/${uid}/referral_data/balance`] = 0;
            updates[`users/${uid}/balance`] = increment(montant);
            await update(ref(db), updates);
            alert("✅ Transfè reyisi!");
        } catch (err) {
            alert("Erè teknik.");
        }
    }
};
                           
