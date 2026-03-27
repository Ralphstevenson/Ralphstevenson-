/* ==========================================
   JS ELITE - SISTÈM PARENNAJ ECHANJ PLUS (V3.0)
   ========================================== */
import { db, auth } from './script.js';
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. DETEKTE & VERIFYE SPONSOR (VRE ID NAN FIREBASE)
window.detecterSponsorURL = async () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode && refCode.startsWith('ARS-')) {
        try {
            // VERIFIKASYON: Èske kòd sa a egziste nan lis piblik ARS yo?
            // Sa anpeche moun envante move kòd
            const arsRef = ref(db, `ars_codes/${refCode}`);
            const snapshot = await get(arsRef);

            if (snapshot.exists()) {
                // Sere kòd valid la
                localStorage.setItem('pending_sponsor_code', refCode);
                
                // A. OUVRI SIGNUP LA DIRÈK
                document.getElementById('auth-page')?.classList.remove('hidden');
                document.getElementById('home-page')?.classList.add('hidden');
                document.getElementById('signup-form-container')?.classList.remove('hidden');
                document.getElementById('login-form-container')?.classList.add('hidden');

                // B. ENSERE KÒD LA NAN INPUT LA (AK SEKIRITE)
                const sInput = document.getElementById('sponsor-input');
                if (sInput) {
                    sInput.value = refCode;
                    sInput.readOnly = true; // Kliyan an pa ka chanje l
                    sInput.style.background = "#e8f0fe";
                }
                
                console.log("✅ Sponsor valid detekte: " + refCode);
            } else {
                console.warn("❌ Kòd sponsor sa a pa egziste nan sistèm Echanj Plus.");
            }
        } catch (error) {
            console.error("Erè verifikasyon sponsor:", error);
        }
    }
};

// 2. DASHBOARD PARENNAJ (TABLO & KOMISYON AN TAN REYÈL)
window.initReferralDashboard = (uid) => {
    const refDataRef = ref(db, `users/${uid}/referral_data`);
    
    onValue(refDataRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // A. Mizajou Balans Komisyon
        const balElem = document.getElementById('komisyon-balans');
        if (balElem) balElem.innerText = (data.balance || 0).toFixed(2);

        // B. Mizajou Kantite Moun Envite
        const countElem = document.getElementById('total-invites');
        if (countElem) countElem.innerText = data.total_invites || 0;

        // C. Mizajou Tablo Envite yo
        const tableBody = document.getElementById('table-referrals-body');
        if (tableBody && data.invite_list) {
            tableBody.innerHTML = ""; // Netwaye tablo a
            Object.values(data.invite_list).reverse().forEach(inv => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${inv.date || '---'}</td>
                        <td>${inv.name || 'Itilizatè'}</td>
                        <td class="status-${inv.status === 'Success' ? 'done' : 'pending'}">
                            ${inv.status === 'Success' ? 'Konfime' : 'Ap tann'}
                        </td>
                    </tr>
                `;
            });
        }
    });
};

// 3. CHANGER PAJ (NAVIGASYON)
window.showPage = (pageId, element) => {
    document.querySelectorAll('section, .page-content').forEach(sec => sec.classList.add('hidden'));

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        
        if (pageId === 'paj-parennaj' && auth.currentUser) {
            // Lanse dashboard la si se paj sa a
            window.initReferralDashboard(auth.currentUser.uid);
            
            const sideID = document.getElementById('side-id').innerText;
            const myRefInput = document.getElementById('my-ref-code');
            if (myRefInput) {
                myRefInput.value = (sideID !== "ARS-ID" && sideID !== "...") ? sideID : (localStorage.getItem('user_ars_id') || "Chaje...");
            }
        }
        
        // Alyans ak lòt JS yo
        if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
    }

    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('active');
};

// 4. KOPIYE KÒD
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    if (!kodInput || kodInput.value.includes("Chaje")) return alert("Tann kòd la chaje...");
    
    kodInput.select();
    navigator.clipboard.writeText(kodInput.value);
    alert("✅ Kòd ou kopiye! Pataje l pou w touche komisyon.");
};

// 5. PATAJE WHATSAPP
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    if (!myCode || myCode.includes("Chaje")) return alert("❌ Erè: Kòd ou a poko prè.");

    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `*Bonjou!* 👋\n\nM ap envite w sou *Echanj Plus*.\nSèvi ak kòd mwen an (*${myCode}*) pou w jwenn *2% rabè* sou premye echanj ou.\n\nEnskri la: ${siteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// 6. DEMANN TRANSFÈ
window.demannTransfere = () => {
    const balans = parseFloat(document.getElementById('komisyon-balans').innerText);
    if (balans < 50) return alert("Ou bezwen omwen 50 HTG nan komisyon pou w transfere.");

    if (confirm(`Voye ${balans} HTG nan balans prensipal ou?`)) {
        // Lojik sa a pral nan script.js pou kominike ak Firebase
        if(window.processCommissionTransfer) window.processCommissionTransfer(balans);
    }
};

// 7. JERE MODAL YO
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    window.detecterSponsorURL();
});
       
