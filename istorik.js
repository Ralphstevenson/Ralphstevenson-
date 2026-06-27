/* ============================================================
   JS ISTORIK FINAL - ECHANJ PLUS V5.4 (FIREBASE RULES OPTIMIZED)
   ============================================================ */
import { db } from './script.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon sa a rele depi nan script.js lè itilizatè a konekte
export function initIstorik(uid) {
    if (!uid) return;

    // 1. Nou vize branch 'transactions' (avèk S) jan sa ye nan Règleman Firebase ou yo
    const transRef = ref(db, `transactions`);
    
    // CRITICAL: Nou fòme yon Query filtre pa 'uid' pou koresponn ak ".read" rules ou yo!
    const userTransQuery = query(transRef, orderByChild('uid'), equalTo(uid));
    
    onValue(userTransQuery, (snap) => {
        // Netwaye tout lis yo anvan nou mete nouvo done
        const sections = ['tout', 'echanj', 'retre', 'echwe'];
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if (el) el.innerHTML = "";
        });

        const data = snap.val();

        if (!data) {
            showEmptyMsg();
            return;
        }

        // 2. Transfòme done yo an lis epi klase yo depi sou pi nouvo a
        const myTrans = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (myTrans.length === 0) {
            showEmptyMsg();
            return;
        }

        // 3. Boucle pou kreye epi distribye HTML chak kat tranzaksyon
        myTrans.forEach(t => {
            const montanAfiche = t.amount_sent || t.amount || 0; //
            
            // Kreye eleman an pou tab "TOUT" la
            const cardElement = createCardElement(t, montanAfiche);
            document.getElementById('list-tout')?.appendChild(cardElement);

            // Distribye kopi pafè nan lòt tab yo pa kategori
            if (t.status === 'Refusé' || t.status === 'Annulé' || t.status === 'Echwé') {
                const echweCard = createCardElement(t, montanAfiche);
                document.getElementById('list-echwe')?.appendChild(echweCard);
            } 
            
            if (t.type === 'Echanj') {
                const echanjCard = createCardElement(t, montanAfiche);
                document.getElementById('list-echanj')?.appendChild(echanjCard);
            } else if (t.type === 'Retrè' || t.type === 'Retre') {
                const retreCard = createCardElement(t, montanAfiche);
                document.getElementById('list-retre')?.appendChild(retreCard);
            }
        });

        // Tcheke si gen yon kategori ki rete vid pou n mete ti mesaj vid la
        sections.forEach(s => {
            const el = document.getElementById(`list-${s}`);
            if (el && el.children.length === 0) {
                el.innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:30px; color:#757575;">
                        <i class="fas fa-folder-open" style="font-size:30px; margin-bottom:10px;"></i>
                        <p style="font-size:14px; margin:0;">Poko gen aktivite nan kategori sa a.</p>
                    </div>`;
            }
        });
    });
}

// Fonksyon pou kreye kat tranzaksyon yo ak stil ak kout klike yo
function createCardElement(t, montan) {
    let color = (t.status === "Validé" || t.status === "Success" || t.status === "Complété") ? "#36b37e" : 
                (t.status === "En attente" || t.status === "Pending") ? "#ffab00" : "#ff5630"; //
    
    let icon = t.type === "Echanj" ? "fa-rotate" : "fa-money-bill-transfer"; //
    
    const div = document.createElement('div');
    div.className = "transaction-item";
    div.style.cssText = `border-left: 4px solid ${color}; cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; background:#fff; border-radius:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);`;
    
    div.innerHTML = `
        <div class="trans-info-left" style="display:flex; align-items:center; gap:12px; flex:1;">
            <div class="icon-circle" style="background:${color}15; color:${color}; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <b class="trans-type-text" style="font-size:14px; color:#1a1a1a;">${t.type} ${t.rezo || t.method || t.provider || ''}</b>
                <div class="trans-date-text" style="font-size:12px; color:#757575; margin-top:2px;">
                    ${t.date || (t.timestamp ? new Date(t.timestamp).toLocaleDateString('ht-HT') : '---')}
                </div>
            </div>
        </div>
        <div class="trans-info-right" style="text-align:right;">
            <b class="trans-amount-text" style="font-size:15px; color:#1a1a1a;">${montan} HTG</b>
            <div class="trans-status-text" style="font-size:12px; color:${color}; font-weight:600; margin-top:2px;">● ${t.status}</div>
        </div>`;

    // Lè moun nan klike sou kat la, li ouvri detay resi a
    div.onclick = () => window.viewReceipt(t); //
    return div;
}

// Afiche mesaj vid si pa gen okenn tranzaksyon
function showEmptyMsg() {
    const emptyHTML = `
        <div class="empty-state" style="text-align:center; padding:40px; color:#757575;">
            <i class="fas fa-folder-open" style="font-size:40px; margin-bottom:15px;"></i>
            <p>Poko gen okenn tranzaksyon nan kont sa a.</p>
        </div>`;
    const sections = ['tout', 'echanj', 'retre', 'echwe'];
    sections.forEach(s => {
        const el = document.getElementById(`list-${s}`);
        if (el) el.innerHTML = emptyHTML;
    });
}

// Jere switch ant tabs yo (Tout, Echanj, Retrè, Echwe)
window.switchIstorik = (targetId, btn) => {
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active')); //
    btn.classList.add('active'); //
    
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden')); //
    
    const target = document.getElementById(`list-${targetId}`); //
    if (target) target.classList.remove('hidden'); //
};

// --- AFICHE DETAY AK TELECHAJMAN PDF ---
window.viewReceipt = (t) => {
    const montan = t.amount_sent || t.amount || 0; //
    const dat = t.date || (t.timestamp ? new Date(t.timestamp).toLocaleString('ht-HT') : '---'); //
    
    // Ranpli tout bwat detay yo nan HTML modal la
    if (document.getElementById('rec-id')) document.getElementById('rec-id').innerText = t.transID || t.id || '---'; //
    if (document.getElementById('rec-status')) {
        document.getElementById('rec-status').innerText = t.status; //
        document.getElementById('rec-status').className = `status-badge-rec status-${t.status.toLowerCase().replace(/\s/g, '-')}`; //
    }
    if (document.getElementById('rec-amount')) document.getElementById('rec-amount').innerText = montan + " HTG"; //
    if (document.getElementById('rec-method')) document.getElementById('rec-method').innerText = t.rezo || t.method || t.provider || "---"; //
    if (document.getElementById('rec-phone')) document.getElementById('rec-phone').innerText = t.phone || t.number || "---"; //
    if (document.getElementById('rec-date')) document.getElementById('rec-date').innerText = dat; //
    
    // Jere bouton "Telechaje Resi (PDF)" la pou l pa repete kreyasyon
    let btnDownload = document.getElementById('btn-download-pdf');
    if (!btnDownload) {
        btnDownload = document.createElement('button');
        btnDownload.id = 'btn-download-pdf';
        btnDownload.className = 'btn-primary-pro';
        btnDownload.style.cssText = "background: #109121; color: white; margin-top: 20px; width: 100%; padding: 14px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 145, 33, 0.2);";
        btnDownload.innerHTML = `<i class="fas fa-file-pdf"></i> Telechaje Resi (PDF)`;
        
        // Deklanche enpresyon sistèm lan pou sove an PDF
        btnDownload.onclick = () => {
            window.print();
        };
        
        // Mete bouton an andedan modal resi a otomatikman
        const contentBox = document.querySelector('.modal-receipt-content') || document.getElementById('modal-receipt');
        if (contentBox) contentBox.appendChild(btnDownload);
    }

    // Louvri bwat modal la sou ekran an
    document.getElementById('modal-receipt')?.classList.remove('hidden'); //
};
   
