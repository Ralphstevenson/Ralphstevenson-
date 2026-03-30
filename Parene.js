/* ============================================================
   JS PARENNAJ ELITE - ECHANJ PLUS V3
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, get, update, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;

    const refDataPath = `users/${uid}/referral_data`;
    
    onValue(ref(db, refDataPath), (snapshot) => {
        const data = snapshot.val() || { balance: 0, total_invites: 0, invite_list: {} };
        
        // Mizajou UI Balans ak Kantite moun
        document.getElementById('komisyon-balans').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('total-invites').innerText = data.total_invites || 0;
        
        // Chaje kÃ²d ARS itilizatÃ¨ a depi nan profil li
        get(ref(db, `users/${uid}/arsID`)).then((arsSnap) => {
            const arsID = arsSnap.val() || "Chaje...";
            document.getElementById('my-ref-code').value = arsID;
        });

        // Chaje Lis Envite yo ak ID yo
        chajeLisEnvite(data.invite_list);
    });
};

// 2. TABLO ENVITE (Montre Non ak ID)
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `
            <div class="empty-msg">
                <i class="fas fa-user-plus" style="display:block; font-size:30px; margin-bottom:10px;"></i>
                <p>Ou poko gen okenn moun nan ekip ou a.</p>
            </div>`;
        return;
    }

    let html = '<div class="referral-list">';
    Object.values(inviteList).reverse().forEach(invite => {
        const statusClass = invite.status === "Success" ? "status-success" : "status-pending";
        const statusText = invite.status === "Success" ? "ValidÃ©" : "En attente";
        
        html += `
            <div class="ist-item">
                <div class="ist-info">
                    <div class="ist-icon"><i class="fas fa-user-circle"></i></div>
                    <div class="ist-details">
                        <b>${invite.name}</b>
                        <small>ID: ${invite.arsID || 'An atant...'}</small>
                        <span class="ref-date">${invite.date || ''}</span>
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

// 3. KOPIYE KÃ’D LA
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("âœ… KÃ²d " + copyText.value + " kopiye!");
};

// 4. LOJIK MULTI-PATAJE (WhatsApp, FB, Telegram, SMS)
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `*ECHANJ PLUS* ðŸš€\nFÃ¨ kÃ²b ak minit telefÃ²n ou rapid!\n\nðŸŽ KÃ²d mwen: *${myCode}*\n(2% RabÃ¨ pou ou)\n\nEnskri la: ${link}`;

    let url = "";
    switch(platform) {
        case 'whatsapp':
            url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            break;
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
            break;
        case 'telegram':
            url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
            break;
        case 'sms':
            url = `sms:?body=${encodeURIComponent(msg)}`;
            break;
    }
    if (url) window.open(url, '_blank');
};

// 5. TRANSFERE NAN BALANS PRENSIPAL (Ak Notifikasyon)
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const montant = parseFloat(document.getElementById('komisyon-balans').innerText);

    if (montant < 50) return alert("âŒ Ou bezwen omwen 50 HTG pou w transfere.");

    if (confirm(`Ãˆske ou vle voye ${montant.toFixed(2)} HTG nan Balans Prensipal ou?`)) {
        try {
            const updates = {};
            // 1. Reset balans komisyon an
            updates[`users/${uid}/referral_data/balance`] = 0;
            // 2. Ogmante balans prensipal la
            updates[`users/${uid}/balance`] = increment(montant);

            await update(ref(db), updates);

            // 3. Voye mesaj nan klÃ²ch la
            if (window.voyeNotifikasyon) {
                window.voyeNotifikasyon(uid, "TransfÃ¨ Reyisi", `Ou transfere ${montant} HTG sot nan komisyon parennaj.`);
            }

            alert("âœ… TransfÃ¨ fÃ¨t ak siksÃ¨!");
        } catch (err) {
            alert("ErÃ¨ teknik. Eseye ankÃ².");
        }
    }
};
