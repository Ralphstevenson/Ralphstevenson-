/* ============================================================
   JS PARENNAJ - ECHANJ PLUS V3 - KONPLE NET
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. INISYALIZASYON DASHBOARD LA
window.initReferralDashboard = (uid) => {
    if (!uid) return;

    const refDataPath = `users/${uid}/referral_data`;
    
    // Koute chanjman nan balans komisyon ak total envite
    onValue(ref(db, refDataPath), (snapshot) => {
        const data = snapshot.val() || { balance: 0, total_invites: 0, invite_list: {} };
        
        // Mizajou UI
        document.getElementById('komisyon-balans').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('total-invites').innerText = data.total_invites || 0;
        
        // Chaje kòd ARS itilizatè a
        get(ref(db, `users/${uid}/arsID`)).then((arsSnap) => {
            const arsID = arsSnap.val() || "ARS-0000";
            document.getElementById('my-ref-code').value = arsID;
        });

        // Chaje Lis Envite yo
        chajeLisEnvite(data.invite_list);
    });
};

// 2. CHAJE LIS ENVITE YO NAN TABLO A
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
    Object.values(inviteList).reverse().forEach(user => {
        const statusClass = user.status === "Success" ? "status-success" : "status-pending";
        const statusText = user.status === "Success" ? "Validé" : "En attente";
        
        html += `
            <div class="ist-item">
                <div class="ist-info">
                    <div class="ist-icon"><i class="fas fa-user"></i></div>
                    <div class="ist-details">
                        <b>${user.name}</b>
                        <small>${user.date || '---'}</small>
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

// 3. KOPIYE KÒD ARS
window.kopiyeKod = () => {
    const copyText = document.getElementById("my-ref-code");
    copyText.select();
    copyText.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(copyText.value);
    
    alert("Kòd kopiye: " + copyText.value);
};

// 4. PATAJE SOU WHATSAPP
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const text = `*Bonjou!* 👋\n\nMwen invite'w sou *Echanj Plus*.\nSèvi ak kòd mwen an (*${myCode}*) pou'w ka jwenn *2% rabè* sou premye echanj ou.\n\nEnskri la: ${siteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
};

// 5. TRANSFERE KOMISYON NAN BALANS PRENSIPAL
window.demannTransfere = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const komisyonElem = document.getElementById('komisyon-balans');
    const montantKomisyon = parseFloat(komisyonElem.innerText);

    if (montantKomisyon < 50) {
        return alert("Ou bezwen omwen 50 HTG komisyon pou w ka transfere.");
    }

    if (confirm(`Èske ou vle transfere ${montantKomisyon} HTG nan balans prensipal ou?`)) {
        try {
            const userRef = ref(db, `users/${uid}`);
            const refDataPath = `users/${uid}/referral_data`;

            const snap = await get(userRef);
            const userData = snap.val();
            const balansAktyel = parseFloat(userData.balance || 0);

            // Operasyon an de tan: 
            // 1. Vide balans komisyon 
            // 2. Mete kòb la nan balans prensipal
            const updates = {};
            updates[`${refDataPath}/balance`] = 0;
            updates[`users/${uid}/balance`] = balansAktyel + montantKomisyon;

            await update(ref(db), updates);
            alert("Transfè reyisi! Balans ou mete ajou.");

        } catch (error) {
            console.error("Erè transfè:", error);
            alert("Gen yon erè ki rive pandan transfè a.");
        }
    }
};

// 6. DETEKTE KÒD SPONSOR NAN URL (POU NOUVO MOUN)
window.detecterSponsorURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode && refCode.startsWith('ARS-')) {
        localStorage.setItem('pending_sponsor_code', refCode);
        
        // Si input la egziste nan HTML la (paj signup)
        const sInput = document.getElementById('sponsor-input');
        if (sInput) {
            sInput.value = refCode;
            sInput.readOnly = true;
            document.getElementById('badge-ref-status').style.display = "block";
            
            // Ouvri paj signup la otomatikman si moun lan te sou login
            if (window.toggleAuth) window.toggleAuth('signup');
        }
    }
};
                
