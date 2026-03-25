import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let toutTrans = []; // Pou n ka filtre san n pa bezwen rele Firebase chak fwa

window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    onValue(ref(db, `transactions`), (snap) => {
        const data = snap.val();
        if (data) {
            toutTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp);
            
            renderTransactions(toutTrans); // Afiche tout pa defo
        }
    });
};

window.filterTrans = (kategori, btn) => {
    // Chanje bouton ki active la
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (kategori === 'TOUT') {
        renderTransactions(toutTrans);
    } else if (kategori === 'Echanj Echwe') {
        renderTransactions(toutTrans.filter(t => t.type === 'Echanj' && t.status === 'Refusé'));
    } else if (kategori === 'Retrè Echwe') {
        renderTransactions(toutTrans.filter(t => t.type === 'Retrè' && t.status === 'Refusé'));
    } else {
        renderTransactions(toutTrans.filter(t => t.type === kategori && t.status !== 'Refusé'));
    }
};

function renderTransactions(listData) {
    const listElement = document.getElementById('transaction-list');
    listElement.innerHTML = "";

    if (listData.length === 0) {
        listElement.innerHTML = `<div class="empty-msg">Pa gen tranzaksyon nan kategori sa a.</div>`;
        return;
    }

    listData.forEach(t => {
        let color = t.status === "Validé" ? "#36b37e" : (t.status === "Refusé" ? "#ff5630" : "#ffab00");
        
        listElement.innerHTML += `
            <div class="transaction-item" style="border-left: 5px solid ${color}">
                <div class="trans-info">
                    <span class="trans-type">${t.type} ${t.rezo || ''}</span>
                    <small class="trans-date">${new Date(t.timestamp).toLocaleString()}</small>
                </div>
                <div class="trans-amount-status">
                    <span class="trans-price">${t.amount} HTG</span>
                    <span class="status-badge" style="background: ${color}20; color: ${color}">${t.status}</span>
                </div>
            </div>`;
    });
}
