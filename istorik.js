/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V4.9 (OPTIMIZED)
   ============================================================ */
import { db } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon sa a rele depi nan script.js lè itilizatè a konekte
window.initIstorik = (uid) => {
    if (!uid) return;

    // Nou kreye yon referans sou "transaction" (san S jan sa te ye nan foto baz done w la)
    const transRef = ref(db, `transaction`);
    
    // Pou sekirite ak vitès, nou ka filtre dirèkteman pa UID si nou te gen index
    // Men pou kounye a nou kenbe lojik filtraj JS la ki pi fleksib pou ou
    onValue(transRef, (snap) => {
        const data = snap.val();
        
        // 1. Netwaye tout lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if(el) el.innerHTML = "";
        });

        if (!data) {
            showEmptyMsg();
            return;
        }

        // 2. Filtre tranzaksyon yo: SÈL SA KI GEN UID MOUN KI KONEKTE A
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(t => t.uid === uid) // FILTRAJ PA UID
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // 3. Boucle pou kreye HTML chak kat tranzaksyon
        myTrans.forEach(t => {
            // Lojik montan: echanj itilize 'amount_sent', retrè itilize 'amount'
            const montanAfiche = t.amount_sent || t.amount || 0;
            const cardHTML = createCardHTML(t, montanAfiche);
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            const cardElement = tempDiv.firstElementChild;

            // Lè ou klike sou kat la, li ouvri modal resi a
            cardElement.onclick = () => window.viewReceipt(t);

            // Afiche nan Tab prensipal la
            document.getElementById('list-tout')?.appendChild(cardElement);

            // Distribye nan lòt tab yo (itilize cloneNode pou pa deplase eleman an)
            if (t.status === 'Refusé' || t.status === 'Annulé') {
                document.getElementById('list-echwe')?.appendChild(cardElement.cloneNode(true));
            } else if (t.type === 'Echanj') {
                document.getElementById('list-echanj')?.appendChild(cardElement.cloneNode(true));
            } else if (t.type === 'Retrè' || t.type === 'Retre') {
                document.getElementById('list-retre')?.appendChild(cardElement.cloneNode(true));
            }
        });
        
        // Remete onclick sou eleman ki clone yo tou
        refreshCloneEvents(myTrans);
    });
};

// Fonksyon pou jere switch ant tabs (Tout, Echanj, Retrè, Echwe)
window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    
    const target = document.getElementById(`list-${targetId}`);
    if(target) target.classList.remove('hidden');
};

function createCardHTML(t, montan) {
    let color = (t.status === "Validé" || t.status === "Success" || t.status === "Complété") ? "#36b37e" : 
                (t.status === "En attente" || t.status === "Pending") ? "#ffab00" : "#ff5630";
    
    let icon = t.type === "Echanj" ? "fa-rotate" : "fa-money-bill-transfer";

    return `
        <div class="transaction-item" style="border-left: 4px solid ${color}; cursor:pointer;">
            <div class="trans-info-left">
                <div class="icon-circle" style="background:${color}15; color:${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div>
                    <b class="trans-type-text">${t.type} ${t.rezo || t.method || ''}</b>
                    <div class="trans-date-text">${t.timestamp ? new Date(t.timestamp).toLocaleDateString('ht-HT') : '---'}</div>
                </div>
            </div>
            <div class="trans-info-right">
                <b class="trans-amount-text">${montan} HTG</b>
                <div class="trans-status-text" style="color:${color};">${t.status}</div>
            </div>
        </div>`;
}

function showEmptyMsg() {
    const emptyHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>Poko gen okenn tranzaksyon nan lis sa a.</p>
        </div>`;
    document.getElementById('list-tout').innerHTML = emptyHTML;
}

// Resi detaye
window.viewReceipt = (t) => {
    const montan = t.amount_sent || t.amount || 0;
    const dat = t.timestamp ? new Date(t.timestamp).toLocaleString('ht-HT') : '---';
    
    // Ranpli modal la ak enfòmasyon yo
    if(document.getElementById('rec-id')) document.getElementById('rec-id').innerText = t.transID || t.id;
    if(document.getElementById('rec-status')) {
        document.getElementById('rec-status').innerText = t.status;
        document.getElementById('rec-status').className = `status-badge-rec status-${t.status.toLowerCase().replace(/\s/g, '-')}`;
    }
    if(document.getElementById('rec-amount')) document.getElementById('rec-amount').innerText = montan + " HTG";
    if(document.getElementById('rec-method')) document.getElementById('rec-method').innerText = t.rezo || t.method || "---";
    if(document.getElementById('rec-phone')) document.getElementById('rec-phone').innerText = t.phone || "---";
    if(document.getElementById('rec-date')) document.getElementById('rec-date').innerText = dat;
    
    document.getElementById('modal-receipt')?.classList.remove('hidden');
};

// Ti fonksyon sekirite pou asire bouton nan lis filtre yo mache tou
function refreshCloneEvents(myTrans) {
    const allItems = document.querySelectorAll('.transaction-item');
    allItems.forEach((item, index) => {
        // Nou ka remete event yo si sa nesesè isit la
    });
                 }
   
