/* ============================================================
   MODIL PARENNAJ - ECHANJ PLUS V4.6 (Mise à jour)
   Fichye: parene.js
   ============================================================ */

import { db } from './script.js';
import { 
    ref, 
    onValue, 
    get,
    query, 
    orderByChild, 
    equalTo, 
    runTransaction 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Eksperyans itilizatè an tan reyèl
let currentUid = null;
let currentArsID = "";

/**
 * Inisyalize modil parennaj la pou itilizatè k ap sèvi ak sit la
 * @param {string} uid - ID Firebase itilizatè a
 */
export function initParennaj(uid) {
    if (!uid) return;
    currentUid = uid;

    const userRef = ref(db, `users/${uid}`);

    // 1. Koute enfòmasyon itilizatè a an tan reyèl
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        currentArsID = (data.arsID || "").trim();

        // Mettre à jour Balans Komisyon
        const komisyonElem = document.getElementById('komisyon-balans');
        const affiliateBal = parseFloat(data.affiliateBalance || 0);
        if (komisyonElem) {
            komisyonElem.innerText = affiliateBal.toFixed(2);
        }

        // Mettre à jour Bonus Ganyen
        const bonusElem = document.getElementById('bonus-ganyen');
        if (bonusElem) {
            bonusElem.innerText = `${affiliateBal.toFixed(2)} HTG`;
        }

        // Mettre à jour Parenn mwen
        const sponsorElem = document.getElementById('my-sponsor');
        if (sponsorElem) {
            sponsorElem.innerText = data.referredBy || "Sistèm";
        }

        // Mettre à jour Kòd Envitasyon
        const refInput = document.getElementById('my-ref-code');
        if (refInput) {
            refInput.value = currentArsID || "ARS-2026";
        }

        // 2. Chaje lis fiyèl yo ak statistik yo
        if (currentArsID) {
            loadReferralsAndStats(currentArsID);
        }
    });
}

/**
 * Chaje fiyèl yo an tan reyèl ak sipò pou fòma ARS kout ak long
 * @param {string} arsID - Kòd ARS itilizatè a
 */
function loadReferralsAndStats(arsID) {
    const usersRef = ref(db, 'users');
    
    // Nou koute tout itilizatè yo pou afiche fiyèl yo an tan reyèl san okenn erè fòma kòd
    onValue(usersRef, (snapshot) => {
        let totalInvites = 0;
        let htmlList = '';

        if (snapshot.exists()) {
            const cleanArsID = arsID.trim().toUpperCase();
            // Si kòd la pa gen -2026 nan fen l, nou prepare vèsyon altènatif la
            const altArsID = cleanArsID.includes('-2026') 
                ? cleanArsID.replace('-2026', '') 
                : `${cleanArsID}-2026`;

            snapshot.forEach((childSnap) => {
                const user = childSnap.val();
                const userSponsor = (user.referredBy || "").trim().toUpperCase();

                // Tcheke si fiyèl sa a te antre kòd prensipal la OSWA kòd altènatif la
                if (userSponsor === cleanArsID || userSponsor === altArsID) {
                    totalInvites++;

                    // Formatage Dat Enskripsyon
                    const dateEnskripsyon = user.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('ht-HT', { day: '2-digit', month: 'short' })
                        : "---";

                    const safeName = escapeHTML(user.fullname || 'Fiyèl');
                    const firstLetter = safeName.charAt(0).toUpperCase();

                    htmlList += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px dashed #e2e8f0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
                                    ${firstLetter}
                                </div>
                                <div>
                                    <b style="font-size: 13px; color: #0f172a; display: block;">${safeName}</b>
                                    <span style="font-size: 10px; color: #94a3b8;">Anrejistre le: ${dateEnskripsyon}</span>
                                </div>
                            </div>
                            <span style="background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 12px;">Aktiv</span>
                        </div>
                    `;
                }
            });
        }

        // Afiche Total Fiyèl nan UI an
        const totalElem = document.getElementById('total-invites');
        if (totalElem) totalElem.innerText = totalInvites;

        // Afiche Lis Fiyèl yo
        const container = document.getElementById('container-lis-envite');
        if (container) {
            container.innerHTML = totalInvites > 0 ? htmlList : `
                <div class="empty-list-state" style="text-align: center; padding: 20px; color: #94a3b8;">
                    <i class="fas fa-user-clock" style="font-size: 24px; margin-bottom: 8px;" aria-hidden="true"></i>
                    <p style="font-size: 12px;">Poko gen okenn aktivite nan ekip ou a.</p>
                </div>`;
        }
    });
}

// --- AKSYON GLOBAL WINDOW ---

/**
 * Transfere Balans Komisyon an nan Balans Prensipal
 */
window.demannTransfere = async () => {
    if (!currentUid) return alert("Ou dwe konekte pou w fè transfè sa a!");

    const userRef = ref(db, `users/${currentUid}`);

    try {
        let transferredAmount = 0;

        await runTransaction(userRef, (userData) => {
            if (userData) {
                const affiliateBal = parseFloat(userData.affiliateBalance || 0);
                
                if (affiliateBal <= 0) {
                    return;
                }

                transferredAmount = affiliateBal;
                userData.balance = (parseFloat(userData.balance || 0)) + affiliateBal;
                userData.affiliateBalance = 0;
            }
            return userData;
        });

        if (transferredAmount > 0) {
            alert(`✅ Transfè reyisi! ${transferredAmount.toFixed(2)} HTG ajoute nan Balans Prensipal ou.`);
        } else {
            alert("⚠️ Ou pa gen anyen nan Balans Komisyon ou an pou w transfere.");
        }

    } catch (e) {
        alert("Erè pandan transfè a: " + e.message);
    }
};

/**
 * Kopye Kòd Envitasyon an nan Clipboard
 */
window.kopiyeKod = () => {
    const codeInput = document.getElementById('my-ref-code');
    const btnCopy = document.getElementById('btn-copy-ref');

    if (codeInput && codeInput.value) {
        navigator.clipboard.writeText(codeInput.value).then(() => {
            if (btnCopy) {
                const originalText = btnCopy.innerText;
                btnCopy.innerText = "KOPYE!";
                btnCopy.style.background = "#22c55e";
                
                setTimeout(() => {
                    btnCopy.innerText = originalText;
                    btnCopy.style.background = "";
                }, 2000);
            }
        }).catch(() => {
            alert("Kòd kopye: " + codeInput.value);
        });
    }
};

/**
 * Pataje Kòd ak Lyen sou Rezo Sosyo yo
 */
window.patajeLien = (platform) => {
    const code = currentArsID || "ARS-2026";
    const text = `Antre sou Echanj Plus ak kòd envitasyon m sa a: *${code}* epi jwenn 9.5 HTG rabè sou premye echanj ou!\n\n`;
    const appUrl = window.location.origin;

    if (navigator.share && platform === 'native') {
        navigator.share({
            title: 'Echanj Plus - Envitasyon',
            text: text,
            url: appUrl
        }).catch(() => {});
        return;
    }

    const encodedText = encodeURIComponent(text + appUrl);
    let shareUrl = "";

    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
            break;
        case 'sms':
            shareUrl = `sms:?body=${encodedText}`;
            break;
        case 'native':
            navigator.clipboard.writeText(text + appUrl);
            alert("Lyen envitasyon an kopye nan aparèy ou!");
            return;
    }

    if (shareUrl) window.open(shareUrl, '_blank');
};

/**
 * Utilitè pou evite XSS
 */
function escapeHTML(str) {
    return str ? str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    ) : '';
}

