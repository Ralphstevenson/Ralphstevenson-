/* ============================================================
   PARAMET.JS - ECHANJ PLUS V3.2 (DATABASE SYNC)
   ============================================================ */
import { auth, db } from './script.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Fonksyon ki pral chaje done yo nan div yo
window.initParamet = (uid) => {
    if (!uid) return;

    // Dapre screenshot la, chemen an se: users/uid
    const userRef = ref(db, `users/${uid}`);

    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. MONTRE NON AK EMAIL (Done ki soti nan Database ou a)
        const settName = document.getElementById('sett-name');
        const settEmail = document.getElementById('sett-email');
        
        if (settName) settName.innerText = data.fullname || "Itilizatè";
        
        if (settEmail) {
            const emailFull = data.email || "pa-gen-email@mail.com";
            // Ti lojik pou kache mitan email la (ex: mak***@gmail.com)
            const emailKache = emailFull.replace(/(.{3})(.*)(?=@)/, "$1***");
            settEmail.innerText = emailKache;
        }

        // 2. AVATAR OTOMATIK (Sèvi ak non ki nan DB a)
        const avatarImg = document.getElementById('user-avatar-settings');
        if (avatarImg) {
            const cleanName = encodeURIComponent(data.fullname || "User");
            avatarImg.src = `https://ui-avatars.com/api/?name=${cleanName}&background=109121&color=fff&bold=true`;
        }
    });
};

// 3. LOJIK DARK MODE (Sove chwa a nan navigatè a)
document.addEventListener('DOMContentLoaded', () => {
    const darkToggle = document.getElementById('dark-mode-toggle');
    
    // Tcheke si li te sou Dark Mode deja
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        if (darkToggle) darkToggle.checked = true;
    }

    if (darkToggle) {
        darkToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
            const mode = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', mode);
        });
    }
});

// 4. KOUTE LÈ MOUN NAN KONEKTE
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.initParamet(user.uid);
    }
});
   
