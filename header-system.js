/* ============================================================
   SISTÈM ENTÊTE DINAMIK - ECHANJ PLUS
   ============================================================ */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./script.js"; // Nou enpòte baz de done a

export const initDynamicHeader = (uid) => {
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // --- A. KREYE HTML ENTÊTE LA ---
        const headerHTML = `
        <div id="dynamic-header" class="dynamic-header">
            <div class="header-top-row">
                <div class="user-greeting">
                    <span class="greeting-text">Bonjou, <b>${data.fullname.split(' ')[0]}</b>! 👋</span>
                    <span class="security-status"><i class="fas fa-shield-alt"></i> Kont ou an sekirite</span>
                </div>
                
                <div class="quick-balance">
                    <div class="bal-item">
                        <small>Balans</small>
                        <span>${(data.balance || 0).toFixed(2)} HTG</span>
                    </div>
                    <div class="bal-divider"></div>
                    <div class="bal-item">
                        <small>Komisyon</small>
                        <span class="comm-text">${(data.referral_data?.balance || 0).toFixed(2)} HTG</span>
                    </div>
                </div>
            </div>

            <div class="flash-info-bar">
                <div class="flash-label">INFO:</div>
                <marquee behavior="scroll" direction="left">
                    🚀 Nouvo pousantaj disponib pou Digicel! | ⚠️ Pa janm bay pèsonn kòd sekirite ou. | 🎁 Rekòmande yon zanmi pou touche 4.5% komisyon.
                </marquee>
            </div>
        </div>
        `;

        // --- B. ENJEKTE LI NAN PAJ LA ---
        // Nou mete l andan yon div ki gen ID 'header-container' nan HTML ou
        const container = document.getElementById('header-dynamic-container');
        if (container) {
            container.innerHTML = headerHTML;
        }
    });
};

