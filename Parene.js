/* ============================================================
   JS PARENNAJ ELITE - ECHANJ PLUS V3 (Mizajou)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;

    const refDataPath = `users/${uid}/referral_data`;
    
    onValue(ref(db, refDataPath), (snapshot) => {
        const data = snapshot.val() || { balance: 0, total_invites: 0, invite_list: {} };
        
        // Mizajou UI Balans ak Kantite moun
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        
        if(balEl) balEl.innerText = (data.balance || 0).toFixed(2);
        if(countEl) countEl.innerText = data.total_invites || 0;
        
        // Chaje kòd ARS depi nan profil la
        get(ref(db, `users/${uid}/arsID`)).then((arsSnap) => {
            const arsID = arsSnap.val() || "---";
            const inputCode = document.getElementById('my-ref-code');
            if(inputCode) inputCode.value = arsID;
        });

        chajeLisEnvite(data.invite_list);
    });
};

// 2. TABLO ENVITE (Estil Pwofesyonèl)
function chajeLisEnvite(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `
            <div class="empty-msg">
                <i class="fas fa-user-plus" style="display:block; font-size:30px; margin-bottom:10px; color: #ccc;"></i>
                <p>Ou poko gen okenn moun nan ekip ou a.</p>
            </div>`;
        return;
    }

    let html = '<div class="referral-list-grid">';
    Object.values(inviteList).reverse().forEach(invite => {
        const isValid = invite.status === "Success";
        const statusClass = isValid ? "status-success" : "status-pending";
        const statusText = isValid ? "Validé" : "En attente";
        
        html += `
            <div class="ist-item">
                <div class="ist-info">
                    <div class="ist-icon"><i class="fas fa-user-circle"></i></div>
                    <div class="ist-details">
                        <b style="color: var(--text-main); font-size: 14px;">${invite.name}</b>
                        <small style="color: var(--text-soft);">ID: ${invite.arsID || 'Atant...'}</small>
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

// 3. KOPIYE KÒD LA (Ak Animasyon Ikòn)
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    const btnIcon = document.querySelector(".copy-btn i");

    if (!copyText || copyText.value === "---") return;

    copyText.select();
    navigator.clipboard.writeText(copyText.value);

    // Chanje ikòn nan pou 2 segonn
    if (btnIcon) {
        btnIcon.className = "fas fa-check";
        btnIcon.style.color = "#109121";
        setTimeout(() => {
            btnIcon.className = "fas fa-copy";
            btnIcon.style.color = "";
        }, 2000);
    }
};

// 4. PATAJE MODÈN
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    if (myCode === "---") return alert("Kòd ou an ap chaje...");

    const link = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const msg = `🚀 *ECHANJ PLUS* \n\nChanje minit Digicel/Natcom pou kòb kach (MonCash/NatCash) rapid! \n\n🎁 Itilize kòd mwen an pou jwenn *2% Rabè* sou premye echanj ou: \n👉 Kòd: *${myCode}* \n\nKlike la pou kòmanse: \n🔗 ${link}`;

    let url = "";
    if (platform === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    else if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`;
    else if (platform === 'sms') url = `sms:?body=${encodeURIComponent(msg)}`;

    if (url) window.open(url, '_blank');
};

// 5. TRANSFERE KOMISYON (Sekirize)
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    const balanceText = document.getElementById('komisyon-balans')?.innerText || "0";
    const montant = parseFloat(balanceText);

    if (!uid) return;
    if (montant < 50) return alert("❌ Ou bezwen omwen 50.00 HTG pou w transfere.");

    const konfimasyon = confirm(`Voye ${montant.toFixed(2)} HTG nan Balans Prensipal ou?`);
    if (!konfimasyon) return;

    try {
        const userRef = ref(db, `users/${uid}`);
        
        // Nou verifye balans lan yon dènye fwa nan database la pou sekirite
        const snap = await get(ref(db, `users/${uid}/referral_data/balance`));
        const currentBalance = snap.val() || 0;

        if (currentBalance < montant) {
            alert("Erè: Balans ou pa ase.");
            return;
        }

        const updates = {};
        updates[`users/${uid}/referral_data/balance`] = 0;
        updates[`users/${uid}/balance`] = increment(montant);

        await update(ref(db), updates);

        if (window.voyeNotifikasyon) {
            window.voyeNotifikasyon(uid, "Pwofi Parennaj", `Ou transfere ${montant.toFixed(2)} HTG nan balans prensipal ou.`);
        }

        alert("✅ Transfè reyisi!");
    } catch (err) {
        console.error(err);
        alert("Gen yon pwoblèm. Eseye ankò.");
    }
};
   
