/**
 * ============================================================
 * ECHANJ PLUS - JESTYON HEADER AK NOTIFIKASYON (notif.js)
 * Depann nèt sou script.js pou koneksyon Firebase v10
 * ============================================================
 */

import { db } from "./script.js";
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Sere done yo lokalman pou lè n ap chanje tab
let koneksyonLogs = [];
let transakLogs = [];
let activeTab = "koneksyon"; // Tab pa defo

// ==========================================
// 1. KOUTE DONE NOTIFIKASYON YO (FIREBASE)
// ==========================================
export function initNotifikasyon(uid) {
    if (!uid) return;

    const badge = document.getElementById('notif-badge');

    // A. Koute Istorik Koneksyon yo
    const connRef = ref(db, `logs/connections/${uid}`);
    onValue(connRef, (snapshot) => {
        koneksyonLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let key in data) {
                koneksyonLogs.push({ id: key, ...data[key] });
            }
            // Triye pa dat ki pi resan
            koneksyonLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        updateNotifUI();
    });

    // B. Koute Tranzaksyon yo pou Notifikasyon
    const transQuery = query(
        ref(db, 'transactions'),
        orderByChild('uid'),
        equalTo(uid)
    );
    onValue(transQuery, (snapshot) => {
        transakLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let key in data) {
                transakLogs.push({ id: key, ...data[key] });
            }
            // Triye pa dat ki pi resan
            transakLogs.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                return dateB - dateA;
            });
        }
        updateNotifUI();
    });
}

// ==========================================
// 2. METE DESIGN NOTIFIKASYON AN AJOU (UI)
// ==========================================
function updateNotifUI() {
    const notifContent = document.getElementById('notif-content');
    const badge = document.getElementById('notif-badge');
    if (!notifContent) return;

    // Jere kantite total notifikasyon pou Badge la
    const totalNotifs = koneksyonLogs.length + transakLogs.length;
    if (badge) {
        if (totalNotifs > 0) {
            badge.textContent = totalNotifs > 9 ? "9+" : totalNotifs;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Afiche kontni an depann de tab ki aktif la
    notifContent.innerHTML = "";

    if (activeTab === "koneksyon") {
        if (koneksyonLogs.length === 0) {
            notifContent.innerHTML = `<p class="empty-msg">Pa gen istorik koneksyon.</p>`;
            return;
        }

        koneksyonLogs.forEach(log => {
            const dat = log.timestamp ? new Date(log.timestamp).toLocaleString('ht-HT') : '---';
            const device = log.device || "Aparèy Enkoni";
            const ip = log.ip ? `IP: ${log.ip}` : '';

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

            if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                statusClass = 'status-success';
                statusIcon = 'fa-circle-check';
            } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                statusClass = 'status-failed';
                statusIcon = 'fa-circle-xmark';
            }

            const type = tx.type || 'Echanj';
            const amount = tx.amount ? `${tx.amount} HTG` : '0.00 HTG';
            const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('ht-HT') : '---';

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
// 3. FONKSYON GLOBAL POU KLIK SOU TAB AK PANEL
// ==========================================
window.toggleNotifPanel = function() {
    const panel = document.getElementById('notif-panel');
    if (panel) panel.classList.toggle('active');
};

window.switchNotifTab = function(tab) {
    activeTab = tab;
    
    // Mete klas active sou bouton tab yo
    document.querySelectorAll('.notif-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Rafrechi lis la
    updateNotifUI();
};
