/**
 * ============================================================
 * ECHANJ PLUS - JESTYON HEADER AK NOTIFIKASYON (header.js)
 * ES Module - Konekte dirèkteman ak script.js pou Firebase v10
 * ============================================================
 */

import { db, handleLogout } from "./script.js";
import { ref, onValue, query, orderByChild, equalTo, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Done lokal pou notifikasyon yo
let koneksyonLogs = [];
let transakLogs = [];
let activeTab = "koneksyon"; // Tab pa defo

/**
 * Fonksyon prensipal pou chaje tout done Header ak Notifikasyon yo
 */
export function initNotifikasyon(uid) {
    if (!uid) return;

    // 1. KOUTE DONE ENFÒMASYON AK BALANS ITILIZATÈ A (QUICK BALANCE)
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const balElement = document.getElementById('header-quick-balance');
            if (balElement) {
                const balance = data.balance ? Number(data.balance).toFixed(2) : "0.00";
                balElement.innerHTML = `<b style="color:#f1c40f;">${balance} HTG</b>`;
            }
        }
    }, (error) => {
        console.error("Erè nan lekti done itilizatè nan header:", error);
    });

    // 2. KOUTE ISTORIK KONEKSYON YO (Pran 5 dènye yo)
    const connRef = query(ref(db, `logs/connections/${uid}`), limitToLast(5));
    onValue(connRef, (snapshot) => {
        koneksyonLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let key in data) {
                koneksyonLogs.push({ id: key, ...data[key] });
            }
            koneksyonLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }
        updateNotifUI();
    }, (error) => {
        console.error("Erè lekti koneksyon logs:", error);
        updateNotifUI();
    });

    // 3. KOUTE TRANZAKSYON YO POU NOTIFIKASYON (Pran 5 dènye yo)
    const transRef = ref(db, 'transactions');
    onValue(transRef, (snapshot) => {
        transakLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let key in data) {
                const tx = data[key];
                if (tx.uid === uid) {
                    transakLogs.push({ id: key, ...tx });
                }
            }
            transakLogs.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : (a.date ? new Date(a.date) : 0);
                const dateB = b.timestamp ? new Date(b.timestamp) : (b.date ? new Date(b.date) : 0);
                return dateB - dateA;
            });
            transakLogs = transakLogs.slice(0, 5);
        }
        updateNotifUI();
    }, (error) => {
        console.error("Erè lekti tranzaksyon logs:", error);
        updateNotifUI();
    });
}

/**
 * Mete atenn ak kontni Notifikasyon yo ajou sou ekran an
 */
export function updateNotifUI() {
    const notifContent = document.getElementById('notif-content');
    const badge = document.getElementById('notif-badge');
    if (!notifContent) return;

    // Kalkile kantite total notifikasyon pou Badge la
    const totalNotifs = koneksyonLogs.length + transakLogs.length;
    if (badge) {
        if (totalNotifs > 0) {
            badge.textContent = totalNotifs > 9 ? "9+" : totalNotifs;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Netwaye bwat la anvan nou mete nouvo done
    notifContent.innerHTML = "";

    if (activeTab === "koneksyon") {
        if (koneksyonLogs.length === 0) {
            notifContent.innerHTML = `<p class="empty-msg">Pa gen istorik koneksyon.</p>`;
            return;
        }

        koneksyonLogs.forEach(log => {
            const dat = log.timestamp ? new Date(log.timestamp).toLocaleString('ht-HT') : '---';
            const device = log.device || "Aparèy Enkoni";
            const ip = log.ip ? `IP: ${log.ip}` : 'IP kache';

            const html = `
                <div class="notif-item">
                    <div class="notif-icon-circle conn-icon">
                        <i class="fa fa-shield-halved"></i>
                    </div>
                    <div class="notif-info">
                        <p class="notif-text">Koneksyon reyisi sou <b>${device}</b></p>
                        <span class="notif-meta">${dat} | ${ip}</span>
                    </div>
                </div>
            `;
            notifContent.insertAdjacentHTML('beforeend', html);
        });

    } else if (activeTab === "transak") {
        if (transakLogs.length === 0) {
            notifContent.innerHTML = `<p class="empty-msg">Pa gen notifikasyon tranzaksyon.</p>`;
            return;
        }

        transakLogs.forEach(tx => {
            let statusClass = 'status-pending';
            let statusText = tx.status || 'En atant';
            let statusIcon = 'fa-clock';

            const statusLower = statusText.toLowerCase();
            if (statusLower === 'validé' || statusLower === 'valide' || statusLower === 'siksè') {
                statusClass = 'status-success';
                statusIcon = 'fa-circle-check';
            } else if (statusLower === 'echwe' || statusLower === 'failed' || statusLower === 'anile') {
                statusClass = 'status-failed';
                statusIcon = 'fa-circle-xmark';
            }

            const type = tx.type || 'Echanj';
            const amount = tx.amount ? `${Number(tx.amount).toFixed(2)} HTG` : '0.00 HTG';
            const dateVal = tx.timestamp || tx.date;
            const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('ht-HT') : '---';

            const html = `
                <div class="notif-item">
                    <div class="notif-icon-circle ${statusClass}">
                        <i class="fa ${statusIcon}"></i>
                    </div>
                    <div class="notif-info">
                        <p class="notif-text">Tranzaksyon <b>${type}</b> de <b>${amount}</b> se <b>${statusText}</b></p>
                        <span class="notif-meta">Dat: ${dateStr}</span>
                    </div>
                </div>
            `;
            notifContent.insertAdjacentHTML('beforeend', html);
        });
    }
}

// ==========================================
// EKSPÒTE FONKSYON SOU WINDOW POU HTML
// ==========================================

window.toggleNotifPanel = function() {
    const panel = document.getElementById('notif-panel');
    if (panel) {
        panel.classList.toggle('active');
    }
};

window.switchNotifTab = function(tab) {
    activeTab = tab;
    
    document.querySelectorAll('.notif-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    updateNotifUI();
};

window.handleLogout = handleLogout;
