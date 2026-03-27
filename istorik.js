import { db, auth } from './script.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Nou koute tranzaksyon yo
    onValue(ref(db, `transactions`), (snap) => {
        const data = snap.val();
        
        // Netwaye bwat yo
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if(el) el.innerHTML = "";
        });

        if (data) {
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            if (myTrans.length === 0) {
                const listTout = document.getElementById('list-tout');
                if(listTout) listTout.innerHTML = "<p class='empty-msg' style='text-align:center; padding:20px; color:#999;'>Pa gen tranzaksyon ankò.</p>";
                return;
            }

            // LOJIK #6 & #9: Verifikasyon Premye Tranzaksyon Validé
            const tranzaksyonValide = myTrans.filter(t => t.status === "Validé");
            
            // Si li gen yon sèl tranzaksyon valide epi li poko janm resevwa bonis
            if (tranzaksyonValide.length === 1) {
                window.checkAndShowFirstBonus(uid, tranzaksyonValide[0]);
            }

            myTrans.forEach(t => {
                const card = createCardHTML(t);
                const listTout = document.getElementById('list-tout');
                if(listTout) listTout.innerHTML += card;

                if (t.status === 'Refusé') {
                    const listEchwe = document.getElementById('list-echwe');
                    if(listEchwe) listEchwe.innerHTML += card;
                } else {
                    if (t.type === 'Echanj') {
                        const listEchanj = document.getElementById('list-echanj');
                        if(listEchanj) listEchanj.innerHTML += card;
                    }
                    if (t.type === 'Retrè') {
                        const listRetre = document.getElementById('list-retre');
                        if(listRetre) listRetre.innerHTML += card;
                    }
                }
            });
        }
    });
};

// FONKSYON POU DEKLANCHE MODAL AK BONIS OTOMATIK
window.checkAndShowFirstBonus = async (uid, tranzaksyon) => {
    try {
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();

        // Si moun nan te gen yon sponsor epi li poko jwenn bonis "First Trade" la
        if (userData && userData.sponsor_id && userData.bonus_claimed !== true) {
            
            // 1. Montre Modal Felisitasyon an (Lojik #6)
            const modal = document.getElementById('modal-felisitasyon-bonis');
            if (modal) modal.classList.remove('hidden');

            // 2. Rele Gwo JS la pou distribye kòb la (Lojik #9)
            // N ap voye UID kliyan an ak montan an pou kalkile 2% a
            if (window.distribyeBonisOtomatik) {
                window.distribyeBonisOtomatik(uid, tranzaksyon.amount, userData.sponsor_id);
            }
        }
    } catch (err) {
        console.error("Erè nan lojik bonis istorik:", err);
    }
};

window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    const targetList = document.getElementById(`list-${targetId}`);
    if(targetList) targetList.classList.remove('hidden');
};

function createCardHTML(t) {
    // Koulè selon estati
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    
    // Icon selon tip
    let icon = t.type === "Echanj" ? "fa-right-left" : "fa-money-bill-transfer";

    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}; margin-bottom:12px; background: #fff; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="background:${color}15; color:${color}; width:35px; height:35px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <b style="color: #333; font-size:14px;">${t.type} ${t.rezo || ''}</b><br>
                    <small style="color: #888; font-size:11px;">${new Date(t.timestamp).toLocaleString([], {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</small>
                </div>
            </div>
            <div style="text-align:right">
                <b style="color: #333;">${t.amount} HTG</b><br>
                <span class="status-badge" style="background: ${color}15; color: ${color}; font-size:9px; font-weight:800; padding:4px 8px; border-radius:6px; text-transform:uppercase;">${t.status}</span>
            </div>
        </div>`;
        }
