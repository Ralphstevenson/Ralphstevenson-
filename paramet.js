/* ============================================================
   JS PARAMÈTRES KONPLÈ - ECHANJ PLUS V3.2 (SECURITY UPDATE)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { updatePassword, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
        if (settEmail && auth.currentUser) {
            window.userAppData.email = auth.currentUser.email;
            settEmail.innerText = auth.currentUser.email;
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

// 4. CHANJE MODPAS (AK REYANTIFIKASYON)
const btnSavePw = document.getElementById('btn-save-pw');
if (btnSavePw) {
    btnSavePw.onclick = async () => {
        const oldPw = document.getElementById('old-password').value;
        const newPw = document.getElementById('new-password').value;
        const confirmPw = document.getElementById('confirm-password').value;
        const user = auth.currentUser;

        if (!oldPw || !newPw || !confirmPw) {
            alert("Tanpri ranpli tout chan yo.");
            return;
        }

        if (newPw !== confirmPw) {
            alert("Nouvo modpas yo pa match.");
            return;
        }

        if (newPw.length < 6) {
            alert("Modpas la dwe gen omwen 6 karaktè.");
            return;
        }

        btnSavePw.innerText = "Y ap verifye...";
        btnSavePw.disabled = true;

        try {
            // A. Verifikasyon si ansyen modpas la bon
            const credential = EmailAuthProvider.credential(user.email, oldPw);
            await reauthenticateWithCredential(user, credential);

            // B. Si l bon, n ap chanje l
            await updatePassword(user, newPw);
            
            alert("✅ Modpas ou mete ajou ak siksè!");
            window.closeModal('modal-password');
            
            // Netwaye
            document.getElementById('old-password').value = "";
            document.getElementById('new-password').value = "";
            document.getElementById('confirm-password').value = "";

        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                alert("❌ Ansyen modpas la pa kòrèk.");
            } else {
                alert("❌ Erè: " + error.message);
            }
        } finally {
            btnSavePw.innerText = "METE AJOU";
            btnSavePw.disabled = false;
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
   
