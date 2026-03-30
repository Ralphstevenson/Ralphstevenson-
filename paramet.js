/* ============================================================
   SETTINGS.JS - ECHANJ PLUS V3.2
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.initSettings = (uid) => {
    if (!uid) return;

    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. Mete Enfòmasyon Profil
        document.getElementById('sett-name').innerText = data.fullname || "Itilizatè";
        document.getElementById('sett-email').innerText = data.email || "";

        // 2. Jere Avatar Otomatik (Sèvi ak UI-Avatars)
        const avatarImg = document.getElementById('user-avatar-settings');
        if (avatarImg) {
            const cleanName = encodeURIComponent(data.fullname || "User");
            avatarImg.src = `https://ui-avatars.com/api/?name=${cleanName}&background=109121&color=fff&bold=true`;
        }
    });
};

// Lojik pou Dark Mode (Opsyonèl pou kòmanse)
const darkToggle = document.getElementById('dark-mode-toggle');
if (darkToggle) {
    darkToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}
  
