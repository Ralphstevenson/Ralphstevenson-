import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    onValue(ref(db, `transactions`), (snap) => {
        const data = snap.val();
        
        // Netwaye bwat yo
        const IDs = ['tout', 'echanj', 'retre', 'echwe'];
        IDs.forEach(id => {
            const el = document.getElementById(`list-${id}`);
            if(el) el.innerHTML = "";
        });

        if (data) {
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            if (myTrans.length === 0) {
                IDs.forEach(id => document.getElementById(`list-${id}`).innerHTML = "<div class='empty-msg'>Pa gen okenn tranzaksyon.</div>");
                return;
            }

            myTrans.forEach(t => {
                const card = createCard(t);
                
                // Distribisyon nan bwat yo
                document.getElementById('list-tout').innerHTML += card;

                if (t.type === 'Echanj' && t.status !== 'Refusé') {
                    document.getElementById('list-echanj').innerHTML += card;
                } else if (t.type === 'Retrè' && t.status !== 'Refusé') {
                    document.getElementById('list-retre').innerHTML += card;
                }

                if (t.status === 'Refusé') {
                    document.getElementById('list-echwe').innerHTML += card;
                }
            });
        } else {
            document.getElementById('list-tout').innerHTML = "<div class='empty-msg'>Istorik vid.</div>";
        }
    });
};

window.switchIstorik = (targetId, btn) => {
    // Ranje bouton yo
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Montre bon lis la
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    const target = document.getElementById(`list-${targetId}`);
    if(target) target.classList.remove('hidden');
};

function createCard(t) {
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}">
            <div class="trans-info">
                <span class="trans-type">${t.type} ${t.rezo || ''}</span>
                <small class="trans-date">${new Date(t.timestamp).toLocaleString('ht-HT')}</small>
            </div>
            <div class="trans-amount-status">
                <b class="trans-price">${t.amount} HTG</b>
                <span class="status-badge" style="background: ${color}20; color: ${color}">${t.status}</span>
            </div>
        </div>`;
        }
