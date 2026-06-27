/* ============================================================
   MODIL PAJ AKÈY - ECHANJ PLUS - DINAMIK FIREBASE (UPDATED)
   ============================================================ */
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./script.js"; // Nou enpòte db k ap soti nan sèvo santral la

export function initAkey(uid) {
    if (!uid) return;

    // A. Koute Balans lan pou paj akèy la
    const akeyBalanceEl = document.getElementById('user-balance');
    if (akeyBalanceEl) {
        onValue(ref(db, `users/${uid}/balance`), (snap) => {
            const balance = snap.val();
            akeyBalanceEl.innerText = balance ? parseFloat(balance).toFixed(2) : "0.00";
        });
    }

    // B. Koute kantite tranzaksyon global jodi a
    const liveStatEl = document.getElementById("live-stat-count");
    if (liveStatEl) {
        onValue(ref(db, 'transactions'), (snapshot) => {
            if (snapshot.exists()) {
                const done = snapshot.val();
                let kontèJodiA = 0;
                const jodiA = new Date().toISOString().split('T')[0];
                Object.values(done).forEach(trans => {
                    if (trans.date && trans.date.includes(jodiA)) kontèJodiA++;
                });
                liveStatEl.innerText = kontèJodiA > 0 ? kontèJodiA : Math.floor(Math.random() * 15) + 35;
            } else {
                liveStatEl.innerText = "42";
            }
        });
    }

    // C. Koute estati pòtay peman yo (MonCash / NatCash)
    onValue(ref(db, 'system_status'), (snapshot) => {
        const moncashTxt = document.getElementById("moncash-status");
        const moncashDot = document.getElementById("moncash-dot");
        const natcashTxt = document.getElementById("natcash-status");
        const natcashDot = document.getElementById("natcash-dot");

        if (snapshot.exists()) {
            const status = snapshot.val();
            if (status.moncash && moncashTxt && moncashDot) {
                moncashTxt.innerText = status.moncash;
                const isOp = status.moncash.toLowerCase() === "operasyonèl" || status.moncash.toLowerCase() === "en ligne";
                moncashTxt.style.color = isOp ? "#2e7d32" : "#c62828";
                moncashDot.className = isOp ? "dot-status status-active" : "dot-status status-down";
            }
            if (status.natcash && natcashTxt && natcashDot) {
                natcashTxt.innerText = status.natcash;
                const isOp = status.natcash.toLowerCase() === "operasyonèl" || status.natcash.toLowerCase() === "en ligne";
                natcashTxt.style.color = isOp ? "#2e7d32" : "#c62828";
                natcashDot.className = isOp ? "dot-status status-active" : "dot-status status-down";
            }
        } else {
            if (moncashTxt && moncashDot) { moncashTxt.innerText = "Operasyonèl"; moncashTxt.style.color = "#2e7d32"; moncashDot.className = "dot-status status-active"; }
            if (natcashTxt && natcashDot) { natcashTxt.innerText = "Operasyonèl"; natcashTxt.style.color = "#2e7d32"; natcashDot.className = "dot-status status-active"; }
        }
    });

    // D. MIZAJOU: Chaje 3 dènye tranzaksyon pèsonèl yo pou "Dènye Aktivite" nan gwo branch lan
    const recentActivityDiv = document.getElementById("home-recent-activity");
    if (recentActivityDiv) {
        // Nou filtre branch global 'transactions' la pa UID pou respekte Règleman sekirite yo
        const keryTrans = query(ref(db, 'transactions'), orderByChild('uid'), equalTo(uid));
        
        onValue(keryTrans, (snapshot) => {
            recentActivityDiv.innerHTML = "";
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Konvèti an lis, epi klase depi sou pi nouvo a (timestamp)
                const myTrans = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                // Pran sèlman 3 premye yo pou paj akèy la
                const hometrans = myTrans.slice(0, 3);
                
                hometrans.forEach(trans => {
                    const montan = trans.amount_sent || trans.amount || 0;
                    let badgeColor = (trans.status === "Validé" || trans.status === "Success" || trans.status === "Complété") ? "#2e7d32" : (trans.status === "En attente" ? "#ffb300" : "#c62828");
                    let icon = trans.type === "Echanj" ? "fa-sync-alt" : "fa-wallet";
                    
                    recentActivityDiv.innerHTML += `
                        <div class="rate-row" style="border-bottom: 1px solid #f9f9f9; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span class="provider-name" style="font-size: 12px;">
                                <i class="fas ${icon}" style="color: #109121; font-size: 14px;"></i> ${trans.type} - ${trans.rezo || trans.method || trans.provider || 'Sistèm'}
                            </span>
                            <span style="font-size: 12px; text-align: right;">
                                <b>${montan} HTG</b><br>
                                <small style="color: ${badgeColor}; font-weight: bold;">● ${trans.status}</small>
                            </span>
                        </div>`;
                });
            } else {
                recentActivityDiv.innerHTML = `<p class="empty-msg-mini">Ou poko fè okenn tranzaksyon.</p>`;
            }
        });
    }
}

// Bwat FAQ Accordion
window.toggleFaq = (element) => {
    element.classList.toggle('open');
    const answer = element.querySelector('.faq-answer');
    if (answer) answer.classList.toggle('hidden');
};
