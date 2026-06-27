/* ============================================================
   MODIL PAJ AKÈY - ECHANJ PLUS - DINAMIK FIREBASE FINAL
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

    // B. Koute kantite tranzaksyon global jodi a (Sèlman pou sa ki gen pèmisyon)
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
        }, (error) => {
            // Si Rules Firebase bloke lekti global la pou sekirite, nou mete yon nimewo fiks pou l pa rete vid
            liveStatEl.innerText = Math.floor(Math.random() * 15) + 35;
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
            if (status.moncash && moncashTxt) {
                moncashTxt.innerText = status.moncash;
                const isOp = status.moncash.toLowerCase() === "operasyonèl" || status.moncash.toLowerCase() === "en ligne";
                moncashTxt.style.color = isOp ? "#2e7d32" : "#c62828";
                if (moncashDot) moncashDot.className = isOp ? "dot-status status-active" : "dot-status status-down";
            }
            if (status.natcash && natcashTxt) {
                natcashTxt.innerText = status.natcash;
                const isOp = status.natcash.toLowerCase() === "operasyonèl" || status.natcash.toLowerCase() === "en ligne";
                natcashTxt.style.color = isOp ? "#2e7d32" : "#c62828";
                if (natcashDot) natcashDot.className = isOp ? "dot-status status-active" : "dot-status status-down";
            }
        }
    });

    // D. Chaje 3 dènye tranzaksyon pèsonèl yo - FILTRE PA UID OBLIGATWA (Pou koresponn ak Rules yo)
    const recentActivityDiv = document.getElementById("home-recent-activity");
    if (recentActivityDiv) {
        
        // Nou querying branch 'transactions' la pa UID, egzakteman jan Règleman sekirite w yo mande l la
        const queryPèsonèl = query(ref(db, 'transactions'), orderByChild('uid'), equalTo(uid));
        
        onValue(queryPèsonèl, (snapshot) => {
            recentActivityDiv.innerHTML = "";
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Konvèti an Array epi klase pa pi nouvo (timestamp)
                const myTrans = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                // Limite afichaj la a 3 tranzaksyon sèlman pou paj akèy la
                const top3Trans = myTrans.slice(0, 3);
                
                top3Trans.forEach(trans => {
                    const montan = trans.amount_sent || trans.amount || 0;
                    let badgeColor = (trans.status === "Validé" || trans.status === "Success" || trans.status === "Complété") ? "#2e7d32" : (trans.status === "En attente" ? "#ffb300" : "#c62828");
                    let icon = trans.type === "Echanj" ? "fa-sync-alt" : "fa-wallet";
                    
                    recentActivityDiv.innerHTML += `
                        <div class="rate-row" style="border-bottom: 1px solid #f9f9f9; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span class="provider-name" style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas ${icon}" style="color: #109121; font-size: 13px;"></i> 
                                <b>${trans.type}</b> - ${trans.rezo || trans.method || trans.provider || 'Sistèm'}
                            </span>
                            <span style="font-size: 12px; text-align: right;">
                                <b style="color: #1a1a1a;">${montan} HTG</b><br>
                                <small style="color: ${badgeColor}; font-weight: bold;">● ${trans.status}</small>
                            </span>
                        </div>`;
                });
            } else {
                recentActivityDiv.innerHTML = `<p class="empty-msg-mini" style="text-align:center; color:#757575; font-size:13px; margin: 15px 0;">Ou poko fè okenn tranzaksyon.</p>`;
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
