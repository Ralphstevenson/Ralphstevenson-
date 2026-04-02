/* ============================================================
   JS ISTORIK PRO - ECHANJ PLUS V3.2 (RECEIPT & SKELETON)
   ============================================================ */
import { db, auth } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;

    // 1. MONTRE SKELETON (LOADING ANIMATION)
    showSkeletons();

    const transRef = ref(db, `transactions`);
    // Nou koute tout tranzaksyon yo epi nou filtre yo pa UID
    onValue(transRef, (snap) => {
        const data = snap.val();
        
        // Netwaye tout lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if(el) el.innerHTML = "";
        });

        if (!data) {
            showEmptyMsg();
            return;
        }

        // Konvèti done yo an Array epi filtre pa UID
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(t => t.uid === uid)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // 2. BATI KAT YO AK DONE REYÈL
        myTrans.forEach(t => {
            const cardHTML = createCardHTML(t);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            const cardElement = tempDiv.firstElementChild;

            // LÈ KLIYAN AN KLIKE SOU KAT LA, OUVRI RESI A
            cardElement.onclick = () => window.viewReceipt(t);

            // Distribiye nan bon Tab yo
            document.getElementById('list-tout').appendChild(cardElement);

            if (t.status === 'Refusé' || t.status === 'Annulé') {
                const cloneEchwe = cardElement.cloneNode(true);
                cloneEchwe.onclick = () => window.viewReceipt(t);
                document.getElementById('list-echwe').appendChild(cloneEchwe);
            } else {
                if (t.type === 'Echanj') {
                    const cloneEch = cardElement.cloneNode(true);
                    cloneEch.onclick = () => window.viewReceipt(t);
                    document.getElementById('list-echanj').appendChild(cloneEch);
                }
                if (t.type === 'Retrè') {
                    const cloneRet = cardElement.cloneNode(true);
                    cloneRet.onclick = () => window.viewReceipt(t);
                    document.getElementById('list-retre').appendChild(cloneRet);
                }
            }
        });
    });
};

// --- FONKSYON POU RESI (RECEIPT) ---
window.viewReceipt = (t) => {
    const statusColor = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" || t.status === "Annulé" ? "#ff5630" : "#ffab00");
    
    // Ranpli done nan Modal Resi a (Asire ID sa yo nan HTML ou)
    const recId = document.getElementById('rec-id');
    const recStatus = document.getElementById('rec-status');
    const recMethod = document.getElementById('rec-method');
    const recPhone = document.getElementById('rec-phone');
    const recAmount = document.getElementById('rec-amount');
    const recDate = document.getElementById('rec-date');

    if(recId) recId.innerText = t.id;
    if(recStatus) {
        recStatus.innerText = t.status;
        recStatus.style.color = statusColor;
        recStatus.style.background = `${statusColor}15`;
    }
    
    if(recMethod) recMethod.innerText = t.rezo || t.method || "Sèvis Echanj Plus";
    if(recPhone) recPhone.innerText = t.phone || "---";
    if(recAmount) recAmount.innerText = t.amount + " HTG";
    if(recDate) recDate.innerText = new Date(t.timestamp).toLocaleString('fr-FR');

    // Louvri modal la (itilize fonksyon navigasyon ou an)
    const modal = document.getElementById('modal-receipt');
    if(modal) modal.classList.remove('hidden');
};

// --- FONKSYON POU PATAJE RESI ---
window.shareReceipt = () => {
    const id = document.getElementById('rec-id').innerText;
    const montan = document.getElementById('rec-amount').innerText;
    const status = document.getElementById('rec-status').innerText;
    const dat = document.getElementById('rec-date').innerText;

    const text = `📄 *RESI OFISYÈL ECHANJ PLUS*\n--------------------------\n✅ Status: ${status}\n💰 Montan: ${montan}\n📅 Dat: ${dat}\n🆔 ID: ${id}\n--------------------------\n_Mèsi paske ou chwazi Echanj Plus!_`;

    if (navigator.share) {
        navigator.share({ title: 'Resi Echanj Plus', text: text });
    } else {
        navigator.clipboard.writeText(text);
        alert("Resi a kopye! Ou ka kole l nan WhatsApp.");
    }
};

window.closeReceipt = () => {
    document.getElementById('modal-receipt')?.classList.add('hidden');
};

// --- UTILS (SKELETON & EMPTY) ---
function showSkeletons() {
    const skeleton = `
        <div class="skeleton-item" style="height:80px; background:#f5f5f5; border-radius:15px; margin-bottom:12px; border: 1px solid #eee;"></div>
    `.repeat(4);
    document.getElementById('list-tout').innerHTML = skeleton;
}

function showEmptyMsg() {
    const msg = `
        <div style="text-align:center; padding:40px; color:#999;">
            <i class="fa-solid fa-folder-open" style="font-size:40px; margin-bottom:10px; color:#ddd;"></i>
            <p>Ou poko gen okenn tranzaksyon.</p>
        </div>`;
    document.getElementById('list-tout').innerHTML = msg;
}

function createCardHTML(t) {
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" || t.status === "Annulé" ? "#ff5630" : "#ffab00");
    let icon = t.type === "Echanj" ? "fa-right-left" : "fa-money-bill-transfer";

    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}; margin-bottom:12px; background: #fff; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor:pointer;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="background:${color}15; color:${color}; width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <b style="color: #333; font-size:14px;">${t.type} ${t.rezo || ''}</b><br>
                    <small style="color: #888; font-size:11px;">${new Date(t.timestamp).toLocaleDateString()}</small>
                </div>
            </div>
            <div style="text-align:right">
                <b style="color: #222;">${t.amount} HTG</b><br>
                <span style="color: ${color}; font-size:10px; font-weight:800; text-transform:uppercase;">${t.status}</span>
            </div>
        </div>`;
}

// Lojik Tab la
window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Kache tout lis yo
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    
    // Montre lis ki kòrèk la
    const target = document.getElementById(`list-${targetId}`);
    if(target) target.classList.remove('hidden');
};
       
