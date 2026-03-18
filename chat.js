import { auth, db } from './script.js'; 
import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

async function chajeChat() {
    const container = document.getElementById('chat-container');
    if (!container) return;

    const res = await fetch('chat.html');
    container.innerHTML = await res.text();

    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send-chat');

    // 1. Nou koute si moun nan konekte pou nou ka kòmanse afiche mesaj yo
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.listenToMessages(user.uid);
        }
    });

    const voyeMesaj = async () => {
        const tèks = input.value.trim();
        // Sekirite: tcheke si moun nan konekte anvan li voye
        if (tèks && auth.currentUser) {
            try {
                await push(ref(db, `chats/${auth.currentUser.uid}/messages`), {
                    sender: "client",
                    text: tèks,
                    status: "sent",
                    timestamp: serverTimestamp()
                });
                input.value = "";
            } catch (error) {
                console.error("Erè nan voye mesaj:", error);
                alert("Ou dwe konekte pou w ka ekri sipò a.");
            }
        }
    };

    if (btn) btn.onclick = voyeMesaj;
    if (input) {
        input.onkeypress = (e) => { if (e.key === 'Enter') voyeMesaj(); };
    }

    // 2. Fonksyon pou koute mesaj yo
    window.listenToMessages = (uid) => {
        const chatRef = ref(db, `chats/${uid}/messages`);
        onValue(chatRef, (snap) => {
            const box = document.getElementById('chat-messages');
            if (!box) return;
            
            box.innerHTML = "";
            const done = snap.val();
            if (done) {
                Object.keys(done).forEach(key => {
                    const m = done[key];
                    // msg-user (pou kliyan - ble), msg-admin (pou admin - gri)
                    const kote = m.sender === "client" ? "msg-user" : "msg-admin";
                    
                    const msgDiv = document.createElement('div');
                    msgDiv.className = kote;
                    msgDiv.innerText = m.text;
                    box.appendChild(msgDiv);
                });
                box.scrollTop = box.scrollHeight;
            }
        });

        // Koute si Admin an online
        onValue(ref(db, `status/admin`), (snap) => {
            const status = snap.val()?.state || "offline";
            const pwen = document.getElementById('presence-indicator');
            const tèks = document.getElementById('admin-status-text');
            if(pwen) pwen.className = `status-dot ${status}`;
            if(tèks) tèks.innerText = status === "online" ? "An liy" : "De-konekte";
        });
    };
}

chajeChat();
