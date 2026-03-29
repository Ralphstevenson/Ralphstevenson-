/* ============================================================
   HEADER MANAGER - ECHANJ PLUS V3 (MODILÈ)
   ============================================================ */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const activateDynamicHeader = (uid, db) => { 
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. PREPARASYON DONE YO
        const nonKliyan = data.fullname ? data.fullname.split(' ')[0] : "Kliyan";
        const balansPrensipal = (data.balance || 0).toFixed(2);
        const balansKomisyon = (data.referral_data?.balance || 0).toFixed(2);
        const flashMessage = "🚀 Nouvo pousantaj disponib! | ⚠️ Pa bay kòd ou | ✅ Echanj Plus Sekirite.";

        // 2. SALITASYON
        const greetingBox = document.getElementById('header-user-greeting');
        if (greetingBox) {
            greetingBox.innerHTML = `<span class="greeting-text">Bonjou, <b>${nonKliyan}</b>! 👋</span>`;
        }

        // 3. ESTATI SEKIRITE
        const securityBox = document.getElementById('header-security-status');
        if (securityBox) {
            securityBox.innerHTML = `<i class="fas fa-shield-alt"></i> Kont ou an sekirite`;
        }

        // 4. BALANS YO (STYLE PILL)
        const balanceBox = document.getElementById('header-quick-balance');
        if (balanceBox) {
            balanceBox.innerHTML = `
                <div class="header-bal-pill">
                    <div class="bal-icon-circle"><i class="fas fa-plus"></i></div>
                    <div class="bal-values">
                        <span class="main-amt">${balansPrensipal} <small>HTG</small></span>
                        <span class="comm-amt">${balansKomisyon} <small>Ref</small></span>
                    </div>
                </div>`;
        }

        // 5. FLASH INFO (SAN MARQUEE - POU CSS MODÈN NAN)
        const flashBox = document.getElementById('header-flash-info');
        if (flashBox) {
            flashBox.innerHTML = `
                <div class="flash-label">INFO:</div>
                <div class="flash-content">
                    <div class="flash-text">${flashMessage} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ${flashMessage}</div>
                </div>`;
        }

    }, (error) => {
        console.error("Firebase Error:", error);
    });
};
