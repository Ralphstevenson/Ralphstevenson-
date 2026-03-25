import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    onValue(ref(db, `transactions`), (snap) => {
        const data = snap.val();
        
        // Netwaye tout lis yo anvan n ranpli yo
        const IDs = ['tout', 'echanj', 'retre', 'echwe'];
        IDs.forEach(id => document.getElementById(`list-${id}`).innerHTML = "");

        if (data) {
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            if (myTrans.length === 0) {
                IDs.forEach(id => document.getElementById(`list-${id}`).innerHTML = "<p class='empty-msg'>Pa gen okenn done.</p>");
                return;
            }

            myTrans.forEach(t => {
                const cardHTML = createTransCard(t);
                
                // 1. Mete l nan TOUT
                document.getElementById('list-tout').innerHTML += cardHTML;

                // 2. Si se Echanj (ki pa echwe)
                if (t.type === 'Echanj' && t.status !== 'Refusé') {
                    document.getElementById('list-echanj').innerHTML += cardHTML;
                }

                // 3. Si se Retrè (ki pa echwe)
                if (t.type === 'Retrè' && t.status !== 'Refusé') {
                    document.getElementById('list-retre').innerHTML += cardHTML;
                }

                // 4. Si li Echwe (nenpòt kalite)
                if (t.status === 'Refusé') {
                    document.getElementById('list-echwe').innerHTML += cardHTML;
                }
            });
        }
    });
};

// Fonksyon pou chanje onglet (Tabs)
window.switchIstorik = (targetId) => {
    // Chanje bouton aktif
    document.querySelectorAll('.tab-btn-ist').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(targetId));
    });

    // Kache tout lis, montre sa n vle a
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    document.getElementById(`list-${targetId}`).classList.remove('hidden');
};

function createTransCard(t) {
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}; margin-bottom:10px;">
            <div class="trans-info">
                <span class="trans-type">${t.type} ${t.rezo || ''}</span>
                <small class="trans-date">${new Date(t.timestamp).toLocaleString()}</small>
            </div>
            <div class="trans-amount-status">
                <span class="trans-price">${t.amount} HTG</span>
                <span class="status-badge" style="background: ${color}20; color: ${color}">${t.status}</span>
            </div>
        </div>`;
}
