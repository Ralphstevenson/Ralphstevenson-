/* ============================================================
   JS NOTIFIKASYON V5.3 (MODULE VERSION) - ECHANJ PLUS
   Fichye: notifications.js
   ============================================================ */

// 1. ENPÒTASYON FIREBASE (Asire w ou gen konfigirasyon 'db' nan yon lòt fichye)
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inisyalize Firestore (Si 'db' pa deja nan yon fòma global)
const db = getFirestore();

/**
 * 2. UI: Louvri/Fèmen Panèl Notifikasyon
 */
export function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;

    panel.classList.toggle('active');

    // Lè panel la ouvri, chaje 'koneksyon' pa defo
    if (panel.classList.contains('active')) {
        switchNotifTab('koneksyon');
    }
}

/**
 * 3. TABS: Chanje vizyèl bouton yo
 */
export async function switchNotifTab(tip) {
    const tabs = document.querySelectorAll('.tab-btn');
    const container = document.getElementById('notif-content');

    // Retire 'active' sou tout tab yo
    tabs.forEach(tab => tab.classList.remove('active'));

    // Aktive tab itilizatè a klike a
    const activeTabId = (tip === 'koneksyon') ? 'tab-koneksyon' : 'tab-transak';
    const activeTab = document.getElementById(activeTabId);
    if (activeTab) activeTab.classList.add('active');

    // Montre mesaj loading anvan done yo rive
    container.innerHTML = `
        <div style="text-align:center; padding:40px; color:#999; font-size:13px;">
            <i class="fa fa-circle-notch fa-spin"></i> Chaje mesaj...
        </div>`;

    // Rele fonksyon pou chache done yo
    await getNotificationsFromDB(tip);
}

/**
 * 4. DATA: Chache done nan Firebase Firestore
 */
export async function getNotificationsFromDB(tip) {
    const container = document.getElementById('notif-content');
    const userId = localStorage.getItem('userId'); // Oswa auth.currentUser.uid

    if (!userId) {
        container.innerHTML = '<p class="empty-msg">Ou dwe konekte pou w wè mesaj yo.</p>';
        return;
    }

    try {
        // Prepare rekèt la (Query)
        // Koleksyon an sipoze rele 'notif_logs'
        const notifRef = collection(db, "notif_logs");
        const q = query(
            notifRef,
            where("uid", "==", userId),
            where("tip", "==", tip),
            orderBy("timestamp", "desc"),
            limit(15)
        );

        const querySnapshot = await getDocs(q);
        container.innerHTML = ""; // Efase loading lan

        if (querySnapshot.empty) {
            container.innerHTML = `<p class="empty-msg">Pa gen notifikasyon ${tip} pou kounye a.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Fòma Dat
            const datMesaj = data.timestamp ? data.timestamp.toDate().toLocaleString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }) : '---';

            // Chwa Ikon ak Koulè selon tip la
            const isKoneksyon = tip === 'koneksyon';
            const iconClass = isKoneksyon ? 'fa-shield-halved' : 'fa-money-bill-transfer';
            const iconColor = isKoneksyon ? '#facc15' : '#4ade80';

            const notifHtml = `
                <div class="notif-item" style="display:flex; gap:12px; padding:15px; border-bottom:1px solid #f1f1f1; animation:fadeIn 0.3s ease;">
                    <div style="width:38px; height:38px; background:${iconColor}15; color:${iconColor}; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px;">
                        <i class="fa ${iconClass}"></i>
                    </div>
                    <div style="flex:1;">
                        <b style="display:block; font-size:13px; color:#000;">${data.titre || 'Sistèm'}</b>
                        <p style="font-size:12px; color:#555; margin:3px 0; line-height:1.4;">${data.mesaj || ''}</p>
                        <small style="font-size:10px; color:#aaa;"><i class="fa-regular fa-clock"></i> ${datMesaj}</small>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', notifHtml);
        });

    } catch (error) {
        console.error("Erè chajman:", error);
        container.innerHTML = `
            <p class="empty-msg" style="color:#ff4d4d;">
                <i class="fa fa-triangle-exclamation"></i> Verifye Index Firebase ou oswa koneksyon an.
            </p>`;
    }
}

