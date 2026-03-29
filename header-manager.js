/* ============================================================
   HEADER MANAGER - ECHANJ PLUS V3 (MODILÈ)
   ============================================================ */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const activateDynamicHeader = (uid, db) => { 
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. DONE YO
        const nonKliyan = data.fullname ? data.fullname.split(' ')[0] : "Kliyan";
        const balansPrensipal = (data.balance || 0).toFixed(2);
        const balansKomisyon = (data.referral_data?.balance || 0).toFixed(2);
        const flashMessage = "🚀 Nouvo pousantaj disponib! | ⚠️ Pa bay kòd ou | ✅ Echanj Plus Sekirite.";

        // 2. FILTRE NON AN
        const greetingBox = document.getElementById('header-user-greeting');
        if (greetingBox) {
            greetingBox.innerHTML = `<span class="greeting-text">Bonjou, <b>${nonKliyan}</b>! 👋</span>`;
        }

        // 3. FILTRE SEKIRITE A
        const securityBox = document.getElementById('header-security-status');
        if (securityBox) {
            securityBox.innerHTML = `<i class="fas fa-shield-alt"></i> Kont ou an sekirite`;
        }

        // 4. FILTRE BALANS YO
        const balanceBox = document.getElementById('header-quick-balance');
        if (balanceBox) {
            balanceBox.innerHTML = `
                <div class="bal-item">
                    <small>Balans</small>
                    <span>${balansPrensipal} HTG</span>
                </div>
                <div class="bal-divider"></div>
                <div class="bal-item">
                    <small>Komisyon</small>
                    <span style="color: #e67e22;">${balansKomisyon} HTG</span>
                </div>`;
        }

        // 5. FILTRE FLASH INFO A
        const flashBox = document.getElementById('header-flash-info');
        if (flashBox) {
            flashBox.innerHTML = `
                <div class="flash-label">INFO:</div>
                <marquee behavior="scroll" direction="left">${flashMessage}</marquee>`;
        }

    }, (error) => {
        console.error("Firebase Error:", error);
    });
};
                       
