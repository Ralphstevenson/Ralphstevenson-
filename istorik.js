/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V4.9 (DATABASE SYNC FIXED)
   ============================================================ */
import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = (uid) => {
    if (!uid) return;

    // Nou chanje chemen an pou l match ak baz done w la (transaction san S)
    const transRef = ref(db, `transaction`); 

    onValue(transRef, (snap) => {
        const data = snap.val();
        
        // Netwaye lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if(el) el.innerHTML = "";
        });

        if (!data) {
            showEmptyMsg();
            return;
        }

        // Konvèti ak filtre pa UID
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(t => t.uid === uid)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        myTrans.forEach(t => {
            // Lojik montan: echanj = amount_sent, retrè = amount
            const montanAfiche = t.amount_sent || t.amount || 0;
            const cardHTML = createCardHTML(t, montanAfiche);
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            const cardElement = tempDiv.firstElementChild;

            cardElement.onclick = () => window.viewReceipt(t);

            // Afiche nan Tab prensipal la
            document.getElementById('list-tout')?.appendChild(cardElement);

            // Distribye nan lòt tab yo (nou itilize Clone pou yo parèt chak kote)
            if (t.status === 'Refusé' || t.status === 'Annulé') {
                document.getElementById('list-echwe')?.appendChild(cardElement.cloneNode(true));
            } else if (t.type === 'Echanj') {
                document.getElementById('list-echanj')?.appendChild(cardElement.cloneNode(true));
            } else if (t.type === 'Retrè' || t.type === 'Retre') {
                document.getElementById('list-retre')?.appendChild(cardElement.cloneNode(true));
            }
        });
    });
};

// FONKSYON POU CHANJE TAB YO (KI TE MANKE A)
window.switchIstorik = (targetId, btn) => {
    // Retire klas 'active' nan tout bouton yo
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    // Ajoute 'active' sou sa ou klike a
    btn.classList.add('active');
    
    // Kache tout lis yo
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    
    // Montre lis ki kòrèk la
    const target = document.getElementById(`list-${targetId}`);
    if(target) target.classList.remove('hidden');
};

function createCardHTML(t, montan) {
    let color = t.status === "Validé" || t.status === "Success" ? "#36b37e" : (t.status === "En attente" ? "#ffab00" : "#ff5630");
    let icon = t.type === "Echanj" ? "fa-rotate" : "fa-money-bill-transfer";

    return `
        <div class="transaction-item" style="border-left: 4px solid ${color}; background:#fff; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor:pointer;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="background:${color}10; color:${color}; width:35px; height:35px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas ${icon}"></i>
                </div>
                <div>
                    <b style="font-size:13px; color:#1e293b;">${t.type} ${t.rezo || ''}</b>
                    <div style="font-size:10px; color:#64748b;">${t.timestamp ? new Date(t.timestamp).toLocaleDateString() : '---'}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <b style="font-size:14px; color:#1e293b;">${montan} HTG</b>
                <div style="font-size:9px; font-weight:800; color:${color}; text-transform:uppercase;">${t.status}</div>
            </div>
        </div>`;
}

function showEmptyMsg() {
    const emptyHTML = `<div style="text-align:center; padding:50px; opacity:0.5;"><i class="fas fa-folder-open" style="font-size:30px;"></i><p>Poko gen tranzaksyon.</p></div>`;
    document.getElementById('list-tout').innerHTML = emptyHTML;
}

window.viewReceipt = (t) => {
    const montan = t.amount_sent || t.amount || 0;
    const dat = t.timestamp ? new Date(t.timestamp).toLocaleString('fr-FR') : '---';
    
    document.getElementById('rec-id').innerText = t.transID || t.id;
    document.getElementById('rec-status').innerText = t.status;
    document.getElementById('rec-amount').innerText = montan + " HTG";
    document.getElementById('rec-date').innerText = dat;
    
    document.getElementById('modal-receipt')?.classList.remove('hidden');
};
                        
