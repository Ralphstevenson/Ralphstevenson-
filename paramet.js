/* ============================================================
   JS PARAMÈT RESEVWA V4.8 - SYNC OTOMATIK AK ECHANJ PIN
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Done sekirite lokal
window.userAppData = {
    hasPin: false,
    currentPin: "",
    email: ""
};

// 1. INISYALIZASYON PARAMÈT
export function initParamet(uid) {
    console.log("Modil Paramètres aktive pou:", uid);
    const userRef = ref(db, `users/${uid}`);
    
    onValue(userRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        // A. Enfòmasyon Profil
        const settName = document.getElementById('sett-name');
        const settEmail = document.getElementById('sett-email');
        const settArsId = document.getElementById('sett-ars-id');

        if (settName) settName.innerText = data.fullname || "Itilizatè Echanj";
        if (settEmail && auth.currentUser) {
            settEmail.innerText = auth.currentUser.email;
            window.userAppData.email = auth.currentUser.email;
        }
        if (settArsId) settArsId.innerText = data.arsID || "---";

        // B. KOREKSYON PIN: Nou detekte ni 'pin' ni 'transactionPin'
        const activePin = data.pin || data.transactionPin || "";
        window.userAppData.hasPin = !!activePin;
        window.userAppData.currentPin = activePin;

        // C. Jere Switch Gmail la
        const gmailToggle = document.getElementById('gmail-notif-toggle');
        if (gmailToggle) {
            gmailToggle.checked = data.settings?.gmail_enabled !== false;
        }

        // D. Avatar dinamik
        const avatarImg = document.getElementById('user-avatar-settings');
        if (avatarImg && data.fullname) {
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullname)}&background=FFD700&color=000&bold=true`;
        }
    });
}

// 2. JERE MODAL YO (Global)
window.openModal = (id) => document.getElementById(id)?.classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id)?.classList.add('hidden');

// 3. JERE PIN TRANZAKSYON
window.openPinManager = () => {
    const title = document.getElementById('pin-title');
    const msg = document.getElementById('pin-msg');
    
    if (!window.userAppData.hasPin) {
        if(title) title.innerText = "Kreye PIN Sekirite";
        if(msg) msg.innerText = "Chwazi 4 chif pou konfime echanj ou yo.";
    } else {
        if(title) title.innerText = "Chanje PIN ou";
        if(msg) msg.innerText = "Antre nouvo PIN 4 chif ou vle a.";
    }
    window.openModal('modal-pin');
};

const btnSavePin = document.getElementById('btn-save-pin');
if (btnSavePin) {
    btnSavePin.onclick = async () => {
        const pinInput = document.getElementById('pin-input');
        const pinVal = pinInput ? pinInput.value.trim() : "";

        if (pinVal.length !== 4 || isNaN(pinVal)) {
            alert("❌ PIN nan dwe gen 4 chif egzak.");
            return;
        }

        btnSavePin.innerText = "Y ap sove...";
        btnSavePin.disabled = true;

        try {
            const uid = auth.currentUser ? auth.currentUser.uid : null;
            if (!uid) throw new Error("Ou pa konekte!");
            
            // Ekri 'pin' ak 'transactionPin' an menm tan pou evite blokaj nan okenn modil
            await update(ref(db, `users/${uid}`), { 
                pin: pinVal,
                transactionPin: pinVal 
            });
            
            // Mizajou dirèk an memwa lokal pou senkronizasyon an tan reyèl
            window.userAppData.hasPin = true;
            window.userAppData.currentPin = pinVal;

            alert("✅ PIN sove ak siksè! Ou ka retounen fè echanj ou kounye a.");
            if (pinInput) pinInput.value = "";
            window.closeModal('modal-pin');

        } catch (error) {
            alert("Erè: " + error.message);
        } finally {
            btnSavePin.innerText = "SOVE PIN LAN";
            btnSavePin.disabled = false;
        }
    };
}

// 4. CHWA NOTIFIKASYON GMAIL
const gmailToggle = document.getElementById('gmail-notif-toggle');
if (gmailToggle) {
    gmailToggle.onchange = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
            await update(ref(db, `users/${uid}/settings`), {
                gmail_enabled: gmailToggle.checked
            });
        } catch (err) {
            console.error("Erè switch:", err);
        }
    };
}

// 5. MODPAS (GMAIL RESET)
window.voyeLinkModpas = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm(`N ap voye yon lyen nan ${user.email} pou w chanje modpas ou. Kontinye?`)) {
        try {
            await sendPasswordResetEmail(auth, user.email);
            alert("✅ Lyen an voye! Tcheke bwat Gmail ou.");
        } catch (error) {
            alert("❌ Erè: " + error.message);
        }
    }
};

// 6. DARK MODE (DASH NIGHT)
const darkToggle = document.getElementById('dark-mode-toggle');
if (darkToggle) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        darkToggle.checked = true;
    }

    darkToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark-theme', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

