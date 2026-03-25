import { db, auth } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Fonksyon sa a ap deklanche nan script.js lè w klike sou "Istorik"
window.initIstorik = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const list = document.getElementById('transaction-list');
    if (!list) return;

    // Ti mesaj pandan l ap chaje
    list.innerHTML = `<div class="loader-istorik">Chaje tranzaksyon yo...</div>`;

    onValue(ref(db, `transactions`), (snap) => {
        list.innerHTML = "";
        const data = snap.val();

        if (data) {
            // Filtre tranzaksyon pou itilizatè sa a sèlman epi mete pi nèf yo anlè
            const myTrans = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(t => t.uid === uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            if (myTrans.length === 0) {
                list.innerHTML = `<div class="empty-msg">Ou poko fè okenn echanj.</div>`;
                return;
            }

            myTrans.forEach(t => {
                // Lojik koulè pou bèl vizyèl
                let color = "#ffab00"; // En attente (Yellow)
                if (t.status === "Validé") color = "#36b37e"; // Success (Green)
                if (t.status === "Refusé") color = "#ff5630"; // Danger (Red)

                list.innerHTML += `
                    <div class="transaction-item" style="border-left: 5px solid ${color}">
                        <div class="trans-info">
                            <span class="trans-type">${t.type} ${t.rezo || ''}</span>
                            <small class="trans-date">${new Date(t.timestamp).toLocaleString('ht-HT')}</small>
                        </div>
                        <div class="trans-amount-status">
                            <span class="trans-price">${t.amount} HTG</span>
                            <span class="status-badge" style="background: ${color}20; color: ${color}">
                                ${t.status}
                            </span>
                        </div>
                    </div>`;
            });
        } else {
            list.innerHTML = `<div class="empty-msg">Pa gen done disponib kounye a.</div>`;
        }
    });
};
