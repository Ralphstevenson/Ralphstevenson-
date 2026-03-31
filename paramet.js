/* ============================================================
   JS PARAMÈTRES KONPLÈ - ECHANJ PLUS V3.2
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Done mondyal pou kontwole sekirite nan tout App la
window.userAppData = {
    hasPin: false,
    correctPin: "",
    email: ""
};

// 1. INICIALIZASYON DONE ITILIZATÈ A
window.initParamet = (uid) => {
    const userRef = ref(db, `users/${uid}`);
    
    onValue(userRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        // Mete Non ak Email nan koòdone a
        if (document.getElementById('sett-name')) {
            document.getElementById('sett-name').innerText = data.fullname || "Itilizatè";
        }
        if (document.getElementById('sett-email')) {
            const emailFull = data.email || "pa-gen-email@mail.com";
            window.userAppData.email = emailFull;
            // Kache yon pati nan email la pou sekirite
            document.getElementById('sett-email').innerText = emailFull.replace(/(.{3})(.*)(?=@)/, "$1***");
        }

        // Mizajou Avatar a ak inisyal non an
        const avatarImg = document.getElementById('user-avatar-settings');
        if (avatarImg) {
            const name = encodeURIComponent(data.fullname || "User");
            avatarImg.src = `https://ui-avatars.com/api/?name=${name}&background=109121&color=fff&bold=true`;
        }

        // Sove PIN lan pou verifikasyon nan paj Retrè
        window.userAppData.hasPin = !!data.transactionPin;
        window.userAppData.correctPin = data.transactionPin || "";
    });
};

// 2. JERE MODAL YO (LOUVRI/FÈMEN)
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
};

// 3. KREYASYON AK MODIFIKASYON PIN TRANZAKSYON
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

document.getElementById('btn-save-pin').onclick = async () => {
    const pinInput = document.getElementById('pin-input');
    const pinVal = pinInput.value;

    if (pinVal.length !== 4) {
        alert("PIN nan dwe gen 4 chif egzak.");
        return;
    }

    try {
        const uid = auth.currentUser.uid;
        await update(ref(db, `users/${uid}`), { transactionPin: pinVal });
        alert("PIN sove ak siksè! Kounye a ou ka fè retrè.");
        pinInput.value = "";
        window.closeModal('modal-pin');
    } catch (error) {
        console.error("Erè PIN:", error);
        alert("Pwoblèm pou sove PIN lan.");
    }
};

// 4. CHANJE MODPAS (FIREBASE AUTH)
document.getElementById('btn-save-pw').onclick = async () => {
    const newPw = document.getElementById('new-password').value;
    
    if (newPw.length < 6) {
        alert("Modpas la dwe gen omwen 6 karaktè.");
        return;
    }

    try {
        await updatePassword(auth.currentUser, newPw);
        alert("Modpas ou mete ajou pafètman!");
        document.getElementById('new-password').value = "";
        window.closeModal('modal-password');
    } catch (error) {
        alert("Erè sekirite: Ou dwe dekonekte epi rekonekte anvan ou chanje modpas.");
    }
};

// 5. DASH NIGHT (DARK MODE)
const darkToggle = document.getElementById('dark-mode-toggle');
if (darkToggle) {
    // Tcheke preferans ki sove a
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

// Lye evènman klik yo ak bouton nan HTML la
document.querySelector('[onclick*="Chanje Modpas"]').onclick = () => window.openModal('modal-password');
document.querySelector('[onclick*="PIN Tranzaksyon"]').onclick = () => window.openPinManager();
   
