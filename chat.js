import { auth, db } from './script (2).js'; 
import { ref, push, onValue, set, serverTimestamp, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

async function chajeChat() {
    const container = document.getElementById('chat-container');
    const res = await fetch('chat.html');
    container.innerHTML = await res.text();

    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send-chat');

    // Fonksyon pou voye mesaj
    const voyeMesaj = async () => {
        const tèks = input.value.trim();
        if (tèks && auth.currentUser) {
            await push(ref(db, `chats/${auth.currentUser.uid}/messages`), {
                sender: "client",
                text: tèks,
                status: "sent",
                timestamp: serverTimestamp()
            });
            input.value = "";
        }
    };

    btn.onclick = voyeMesaj;
    input.onkeypress = (e) => { if (e.key === 'Enter') voyeMesaj(); };

    // Koute mesaj yo (rele fonksyon sa nan script (2).js)
    window.listenToMessages = (uid) => {
        onValue(ref(db, `chats/${uid}/messages`), (snap) => {
            const box = document.getElementById('chat-messages');
            if (!box) return;
            box.innerHTML = "";
            const done = snap.val();
            if (done) {
                Object.keys(done).forEach(key => {
                    const m = done[key];
                    const kote = m.sender === "client" ? "msg-user" : "msg-admin";
                    box.innerHTML += `<div class="${kote}">${m.text}</div>`;
                });
                box.scrollTop = box.scrollHeight;
            }
        });

        // Koute status Admin an
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

