/* ============================================================
   JS PARAMÈTRES KONPLÈ - ECHANJ PLUS V3.2 - RESET EMAIL UPDATE
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Done mondyal pou kontwole sekirite nan tout App la
window.userAppData = {
    hasPin: false,
    correctPin: "",
    email: ""
};

// 1. INICIALIZASYON DONE ITILIZATÈ A (NON AK GMAIL)
window.initParamet = (uid) => {
    const userRef = ref(db, `users/${uid}`);
    
    onValue(userRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        // A. Afiche Non Konplè a
        const settName = document.getElementById('sett-name');
        if (settName) {
            settName.innerText = data.fullname || "Itilizatè Echanj";
        }

        // B. Afiche Gmail la (Nou pran l nan Auth pou n sèten li se mèt kont lan)
        const settEmail = document.getElementById('sett-email');
        const emailDisplayModal = document.getElementById('email-display-reset');

        if (auth.currentUser) {
            const userEmail = auth.currentUser.email;
            window.userAppData.email = userEmail;
            
            // Afiche nan paj Paramètre a
            if (settEmail) settEmail.innerText = userEmail;
            
            // Prepare email la pou modal reset la si l egziste
            if (emailDisplayModal) emailDisplayModal.innerText = userEmail;
        }

        // C. Mizajou Avatar a ak inisyal non an
        const avatarImg = document.getElementById('user-avatar-settings');
        if (avatarImg && data.fullname) {
            const name = encodeURIComponent(data.fullname);
            avatarImg.src = `https://ui-avatars.com/api/?name=${name}&background=109121&color=fff&bold=true`;
        }

        // D. Done PIN
        window.userAppData.hasPin = !!data.transactionPin;
        window.userAppData.correctPin = data.transactionPin || "";
    });
};

// 2. JERE MODAL YO
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
};

// 3. JERE PIN TRANZAKSYON
window.openPinManager = () => {
    const title = document.getElementById('pin-title');
    const msg = document.getElementById('pin-msg');
    
    if (!window.userAppData.hasPin) {
        title.innerText = "Kreye PIN Tranzaksyon";
        msg.innerText = "Chwazi 4 chif sekrè pou sekirize retrè w yo.";
    } else {
        title.innerText = "Chanje PIN Tranzaksyon";
        msg.innerText = "Antre nouvo PIN 4 chif ou vle a.";
    }
    window.openModal('modal-pin');
};

const btnSavePin = document.getElementById('btn-save-pin');
if (btnSavePin) {
    btnSavePin.onclick = async () => {
        const pinInput = document.getElementById('pin-input');
        const pinVal = pinInput.value;

        if (pinVal.length !== 4) {
            alert("PIN nan dwe gen 4 chif egzak.");
            return;
        }

        try {
            const uid = auth.currentUser.uid;
            await update(ref(db, `users/${uid}`), { transactionPin: pinVal });
            alert("✅ PIN sove ak siksè!");
            pinInput.value = "";
            window.closeModal('modal-pin');
        } catch (error) {
            alert("Pwoblèm pou sove PIN lan.");
        }
    };
}

// 4. CHANJE MODPAS (VOYE LIEN NAN GMAIL)
// Fonksyon sa a ranplase ansyen lojik reyantifikasyon an
const btnSendReset = document.getElementById('btn-send-reset-link');
if (btnSendReset) {
    btnSendReset.onclick = async () => {
        const user = auth.currentUser;
        if (!user) return alert("Ou dwe konekte anvan!");

        btnSendReset.disabled = true;
        btnSendReset.innerText = "Y ap voye...";

        try {
            await sendPasswordResetEmail(auth, user.email);
            alert("✅ Link la voye! Tcheke Gmail ou (" + user.email + ") pou w chanje modpas la.");
            window.closeModal('modal-password');
        } catch (error) {
            console.error("Erè Reset:", error);
            alert("❌ Erè: " + error.message);
        } finally {
            btnSendReset.disabled = false;
            btnSendReset.innerText = "VOYE LIEN AN";
        }
    };
}

// 5. DASH NIGHT (DARK MODE)
const darkToggle = document.getElementById('dark-mode-toggle');
if (darkToggle) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        darkToggle.checked = true;
    }

    darkToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

// 6. KOUTE LÈ MOUN NAN KONEKTE
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.initParamet(user.uid);
    }
});
