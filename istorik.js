/* ============================================================
   JS ISTORIK PRO - ECHANJ PLUS V3.2 (RECEIPT & SKELETON)
   ============================================================ */
import { db, auth } from './script.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 1. MONTRE SKELETON (LOADING ANIMATION)
    showSkeletons();

    const transRef = ref(db, `transactions`);
    onValue(transRef, (snap) => {
        const data = snap.val();
        
        // Netwaye bwat yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if(el) el.innerHTML = "";
        });

        if (!data) {
            showEmptyMsg();
            return;
        }

        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(t => t.uid === uid)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // Lojik Bonis (si se premye fwa)
        const tranzaksyonValide = myTrans.filter(t => t.status === "Validé");
        if (tranzaksyonValide.length === 1) {
            window.checkAndShowFirstBonus(uid, tranzaksyonValide[0]);
        }

        // 2. BATI KAT YO AK DONE REYÈL
        myTrans.forEach(t => {
            const cardHTML = createCardHTML(t);
            
            // Nou kreye yon eleman DOM pou nou ka ajoute "EventListener" klik la
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            const cardElement = tempDiv.firstElementChild;

            // LÈ KLIYAN AN KLIKE SOU KAT LA, OUVRI RESI A
            cardElement.onclick = () => window.viewReceipt(t);

            document.getElementById('list-tout').appendChild(cardElement);

            if (t.status === 'Refusé' || t.status === 'Anulé') {
                document.getElementById('list-echwe').appendChild(cardElement.cloneNode(true)).onclick = () => window.viewReceipt(t);
            } else {
                if (t.type === 'Echanj') {
                    document.getElementById('list-echanj').appendChild(cardElement.cloneNode(true)).onclick = () => window.viewReceipt(t);
                }
                if (t.type === 'Retrè') {
                    document.getElementById('list-retre').appendChild(cardElement.cloneNode(true)).onclick = () => window.viewReceipt(t);
                }
            }
        });
    });
};

// --- FONKSYON POU RESI (RECEIPT) ---
window.viewReceipt = (t) => {
    const statusColor = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    
    // Ranpli done nan Modal Resi a
    document.getElementById('rec-id').innerText = t.id.substring(0, 12) + "...";
    document.getElementById('rec-status').innerText = t.status;
    document.getElementById('rec-status').style.color = statusColor;
    document.getElementById('rec-status').style.background = `${statusColor}15`;
    
    document.getElementById('rec-method').innerText = t.method || t.rezo || "Echanj";
    document.getElementById('rec-phone').innerText = t.phone || "---";
    document.getElementById('rec-amount').innerText = t.amount + " HTG";
    document.getElementById('rec-date').innerText = new Date(t.timestamp).toLocaleString();

    window.openModal('modal-receipt');
};

// --- FONKSYON POU PATAJE RESI ---
window.shareReceipt = () => {
    const id = document.getElementById('rec-id').innerText;
    const montan = document.getElementById('rec-amount').innerText;
    const status = document.getElementById('rec-status').innerText;

    const text = `📄 *RESI ECHANJ PLUS*\n--------------------------\n✅ Status: ${status}\n💰 Montan: ${montan}\n🆔 ID: ${id}\n--------------------------\n_Mèsi paske ou chwazi Echanj Plus!_`;

    if (navigator.share) {
        navigator.share({ title: 'Resi Echanj Plus', text: text });
    } else {
        navigator.clipboard.writeText(text);
        alert("Resi a kopye nan Clipboard!");
    }
};

// --- UTILS (SKELETON & EMPTY) ---
function showSkeletons() {
    const skeleton = `
        <div class="skeleton-item" style="height:80px; background:#eee; border-radius:15px; margin-bottom:12px; animation: pulse 1.5s infinite ease-in-out;"></div>
    `.repeat(4);
    document.getElementById('list-tout').innerHTML = skeleton;
}

function showEmptyMsg() {
    const msg = "<p class='empty-msg' style='text-align:center; padding:40px; color:#999;'><i class='fa fa-folder-open' style='font-size:30px; display:block; margin-bottom:10px;'></i>Ou poko gen tranzaksyon.</p>";
    document.getElementById('list-tout').innerHTML = msg;
}

function createCardHTML(t) {
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    let icon = t.type === "Echanj" ? "fa-right-left" : "fa-money-bill-transfer";

    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}; margin-bottom:12px; background: #fff; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor:pointer;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="background:${color}15; color:${color}; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <b style="color: #333; font-size:14px;">${t.type} ${t.rezo || ''}</b><br>
                    <small style="color: #888; font-size:11px;">${new Date(t.timestamp).toLocaleDateString()}</small>
                </div>
            </div>
            <div style="text-align:right">
                <b style="color: #333;">${t.amount} HTG</b><br>
                <span style="color: ${color}; font-size:10px; font-weight:800; text-transform:uppercase;">${t.status}</span>
            </div>
        </div>`;
}

// Lojik Tab la (rete menm jan)
window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    const target = document.getElementById(`list-${targetId}`);
    if(target) target.classList.remove('hidden');
};
    
