/* ============================================================
   HEADER MANAGER - ECHANJ PLUS V3 (KORIJE)
   ============================================================ */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Nou ajoute "db" nan paramèt yo
export const activateDynamicHeader = (uid, db) => { 
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('header-dynamic-container');
        
        if (!data || !container) return;

        // PREPARE DONE YO
        const nonKliyan = data.fullname ? data.fullname.split(' ')[0] : "Kliyan";
        const balansPrensipal = (data.balance || 0).toFixed(2);
        const balansKomisyon = (data.referral_data?.balance || 0).toFixed(2);
        
        const flashInfo = "🚀 Nouvo pousantaj disponib! | ⚠️ Pa bay kòd ou | ✅ Echanj Plus Sekirite.";

        // KREYE HTML LA (Sa pral efase "Ap chaje..." la)
        container.innerHTML = `
        <div class="header-v3">
            <div class="header-top-row">
                <div class="user-greeting">
                    <span class="greeting-text">Bonjou, <b>${nonKliyan}</b>! 👋</span>
                    <span class="security-status"><i class="fas fa-shield-alt"></i> Kont ou an sekirite</span>
                </div>
                
                <div class="quick-balance">
                    <div class="bal-item">
                        <small>Balans</small>
                        <span>${balansPrensipal} HTG</span>
                    </div>
                    <div class="bal-divider"></div>
                    <div class="bal-item">
                        <small>Komisyon</small>
                        <span style="color: #e67e22;">${balansKomisyon} HTG</span>
                    </div>
                </div>
            </div>
            <div class="flash-info-bar">
                <div class="flash-label">INFO:</div>
                <marquee behavior="scroll" direction="left">${flashInfo}</marquee>
            </div>
        </div>`;
    }, (error) => {
        console.error("Firebase Error:", error);
    });
};
