/* ============================================================
   JS PARENE ELITE V4.2 - ECHANJ PLUS (SYSTEM SYNC)
   ============================================================ */
import { auth, db } from './script.js'; 
import { ref, onValue, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. LANSE SISTÈM NAN LÈ MOUN LAN KONEKTE
onAuthStateChanged(auth, (user) => {
    if (user) {
        initReferralDashboard(user.uid);
    }
});

function initReferralDashboard(uid) {
    const userRef = ref(db, `users/${uid}`);

    // Koute done yo an tan reyèl pou balans ak ID
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // A. Mizajou Balans ak Statistik
        const refData = userData.referral_data || { balance: 0, total_invites: 0, invite_list: {} };
        
        const balEl = document.getElementById('komisyon-balans');
        const countEl = document.getElementById('total-invites');
        const inputCode = document.getElementById('my-ref-code');
        const mySponsorEl = document.getElementById('my-sponsor');

        // Mete montan an (ex: 1,250.00)
        if (balEl) {
            balEl.innerText = Number(refData.balance || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        if (countEl) countEl.innerText = refData.total_invites || 0;

        // B. SYNC KÒD ARS LA (Pran l nan database la pou sekirite)
        if (inputCode) {
            inputCode.value = userData.arsID || "ARS-CHÈCHE...";
        }

        // C. AFICHE NON PARENN LAN (Sponsor)
        if (mySponsorEl) {
            mySponsorEl.innerText = userData.referredBy || "Sistèm";
        }

        // D. CHAJE LIS MOUN YO
        updateInviteList(refData.invite_list);
    });
}

// 2. FONKSYON POU KOPIYE KÒD LA (AVÈK FEEDBACK VIZYÈL)
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    if (!codeInput || codeInput.value.includes("...")) return;

    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // Pou mobil

    navigator.clipboard.writeText(codeInput.value).then(() => {
        const btn = document.querySelector('.copy-premium-btn');
        const originalIcon = btn.innerHTML;
        
        // Feedback vizyèl: chanje icon an an "Check"
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = "#2ecc71"; 

        setTimeout(() => {
            btn.innerHTML = originalIcon;
            btn.style.background = "#109121";
        }, 2000);
    }).catch(err => {
        alert("Erè nan kopye: " + err);
    });
};

// 3. PATAJE LYEN AN (DINAMIK)
window.patajeLien = (platform) => {
    const myCode = document.getElementById('my-ref-code').value;
    const siteUrl = "https://echanjplus064.netlify.app"; // URL sit ou a
    const link = `${siteUrl}/register.html?ref=${myCode}`;
    const msg = `🚀 *ECHANJ PLUS - ELITE* \nFè echanj minit pou kòb kach rapid! \n\n🎁 Sèvi ak kòd mwen an pou *2% Rabè*: *${myCode}* \n\nKlike la pou enskri: ${link}`;

    let url = "";
    switch(platform) {
        case 'whatsapp': url = `https://wa.me/?text=${encodeURIComponent(msg)}`; break;
        case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`; break;
        case 'telegram': url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`; break;
        case 'sms': url = `sms:?body=${encodeURIComponent(msg)}`; break;
    }
    if (url) window.open(url, '_blank');
};

// 4. TRANSFÈ KOMISYON (LOGIK TRANZAKSYON)
window.demannTransfere = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Rekipere montan an san vigil
    const balRaw = document.getElementById('komisyon-balans').innerText.replace(/,/g, '');
    const montant = parseFloat(balRaw);

    if (montant < 50) {
        alert("❌ Minimòm transfè se 50.00 HTG.");
        return;
    }

    if (confirm(`Èske w vle voye ${montant.toFixed(2)} HTG sou Balans Prensipal ou?`)) {
        try {
            const updates = {};
            // Retire nan komisyon, ajoute nan balans prensipal
            updates[`users/${user.uid}/referral_data/balance`] = 0;
            updates[`users/${user.uid}/balance`] = increment(montant);

            await update(ref(db), updates);
            alert("✅ Transfè fèt! Kòb la disponib sou balans prensipal ou kounye a.");
        } catch (err) {
            alert("Erè: " + err.message);
        }
    }
};

// 5. MIZAJOU LIS MOUN YO (UI)
function updateInviteList(inviteList) {
    const container = document.getElementById('container-lis-envite');
    if (!container) return;

    if (!inviteList || Object.keys(inviteList).length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; color:#94a3b8;">
                <p style="font-size:12px;">Poko gen aktivite nan ekip ou a.</p>
            </div>`;
        return;
    }

    let html = '';
    // Nou envèse lis la pou dènye moun ki enskri parèt anlè
    const sortedList = Object.values(inviteList).reverse();

    sortedList.forEach(invite => {
        const isSuccess = invite.status === "Success" || invite.status === "Validé";
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f8fafc; border-radius:14px; margin-bottom:10px; border:1px solid #e2e8f0;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; background:#109121; color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <b style="display:block; font-size:13px; color:#1e293b;">${invite.name || 'Itilizatè'}</b>
                        <small style="font-size:10px; color:#64748b;">ID: ${invite.arsID || '---'}</small>
                    </div>
                </div>
                <span style="font-size:9px; font-weight:800; padding:3px 8px; border-radius:6px; background:${isSuccess ? '#dcfce7' : '#fef9c3'}; color:${isSuccess ? '#166534' : '#854d0e'};">
                    ${isSuccess ? 'VALIDÉ' : 'ATANT'}
                </span>
            </div>`;
    });
    container.innerHTML = html;
}
   
