import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

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
                document.getElementById('list-tout').innerHTML = "<p class='empty-msg'>Pa gen tranzaksyon.</p>";
                return;
            }

            myTrans.forEach(t => {
                const card = createCardHTML(t);
                document.getElementById('list-tout').innerHTML += card;

                if (t.status === 'Refusé') {
                    document.getElementById('list-echwe').innerHTML += card;
                } else {
                    if (t.type === 'Echanj') document.getElementById('list-echanj').innerHTML += card;
                    if (t.type === 'Retrè') document.getElementById('list-retre').innerHTML += card;
                }
            });
        }
    });
};

window.switchIstorik = (targetId, btn) => {
    // Retire 'active' sou tout bouton, mete l sou sa n klike a
    document.querySelectorAll('.tab-btn-ist').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Kache tout lis, montre sa n vle a
    document.querySelectorAll('.ist-content').forEach(div => div.classList.add('hidden'));
    document.getElementById(`list-${targetId}`).classList.remove('hidden');
};

function createCardHTML(t) {
    let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
    return `
        <div class="transaction-item" style="border-left: 5px solid ${color}; margin-bottom:10px; background: var(--card-bg, #fff); padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b style="color: var(--text-main); font-size:14px;">${t.type} ${t.rezo || ''}</b><br>
                <small style="color: var(--text-soft); font-size:11px;">${new Date(t.timestamp).toLocaleString()}</small>
            </div>
            <div style="text-align:right">
                <b style="color: var(--text-main);">${t.amount} HTG</b><br>
                <span class="status-badge" style="background: ${color}20; color: ${color}; font-size:9px; font-weight:800; padding:4px 8px; border-radius:6px;">${t.status}</span>
            </div>
        </div>`;
}
