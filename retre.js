import { auth, db } from './script.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.enjekteHtmlRetre = async function() {
    const seksyonVid = document.getElementById('paj-retre');
    if (!seksyonVid) return;

    try {
        console.log("1. Chajman HTML Retrè kòmanse...");
        const repons = await fetch('retre.html');
        const html = await repons.text();
        seksyonVid.innerHTML = html;
        console.log("2. HTML enjekte ak siksè.");

        // NOU ITILIZE onAuthStateChanged POU ASIRE NOU GEN ITILIZATÈ A
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("3. Itilizatè konekte:", user.uid);
                foseChajmanDone(user.uid);
                konekteBoutonRetre();
            } else {
                console.warn("3. Pa gen itilizatè konekte!");
            }
        });
    } catch (erè) {
        console.error("Erè nan fetch retre.html:", erè);
    }
};

function foseChajmanDone(uid) {
    const userRef = ref(db, `users/${uid}`);
    
    // onValue ap toujou veye si balans lan chanje
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("4. Done resevwa nan Firebase:", data);
            
            const balEl = document.getElementById('display-balance');
            const idEl = document.getElementById('display-ars-id');

            if (balEl) {
                balEl.innerText = parseFloat(data.balance || 0).toFixed(2) + " HTG";
                console.log("5. Balans afiche!");
            } else {
                console.error("ERÈ: Id 'display-balance' pa jwenn nan HTML la!");
            }

            if (idEl) {
                idEl.innerText = data.arsID || "---";
                console.log("6. ID afiche!");
            }
        }
    }, (error) => {
        console.error("Erè Firebase:", error);
    });
}

// Fonksyon pou jere modal yo jan nou te fè l la
function konekteBoutonRetre() {
    const btn = document.getElementById('btn-konfime-retre');
    if (btn) {
        console.log("7. Bouton 'Retire' a prè pou klike.");
        // Remete lojik onclick ou te genyen an isit la...
    }
}
