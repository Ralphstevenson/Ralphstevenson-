/* ==========================================
   JS ELITE - CHAT ECHANJ PLUS (VÈSYON FINAL)
   ========================================== */

import { auth, db } from './script.js'; 
import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let mesajKonte = 0; 
const logoAdmin = "https://i.postimg.cc/zBs03Y9d/file-00000000171471f5a0ff5138fae23eb4.png";

async function chajeChat() {
    const container = document.getElementById('chat-container');
    if (!container) return;

    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send-chat');
    const sonNotif = document.getElementById('chat-notif');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.listenToMessages(user.uid);
        }
    });

    const voyeMesaj = async () => {
        const tèks = input.value.trim();
        if (tèks && auth.currentUser) {
            try {
                await push(ref(db, `chats/${auth.currentUser.uid}/messages`), {
                    sender: "client",
                    text: tèks,
                    status: "sent",
                    timestamp: serverTimestamp()
                });
                input.value = "";
                input.focus();
            } catch (error) {
                console.error("Erè:", error);
            }
        }
    };

    if (btn) btn.onclick = voyeMesaj;
    if (input) {
        input.onkeypress = (e) => { if (e.key === 'Enter') voyeMesaj(); };
    }

    window.listenToMessages = (uid) => {
        const chatRef = ref(db, `chats/${uid}/messages`);
        
        onValue(chatRef, (snap) => {
            const box = document.getElementById('chat-messages');
            if (!box) return;
            
            const done = snap.val();
            if (done) {
                const mesajLis = Object.values(done);

                // LOJIK SON AN (Ding)
                if (mesajLis.length > mesajKonte) {
                    const dènyeMesaj = mesajLis[mesajLis.length - 1];
                    if (dènyeMesaj.sender === "admin" && sonNotif) {
                        sonNotif.play().catch(e => console.log("Audio aktive"));
                    }
                }
                mesajKonte = mesajLis.length;

                box.innerHTML = `
                    <div class="secure-notice">
                        <i class="fa-solid fa-lock"></i>
                        <p>Konvèsasyon sa a an sekirite epi li chiffres.</p>
                    </div>
                `;

                mesajLis.forEach(m => {
                    const isMe = m.sender === "client";
                    const koteKlas = isMe ? "msg-user-line" : "msg-admin-line";
                    
                    // Si se admin, li rale foto ou fenk voye a
                    const avatarUrl = isMe 
                        ? `https://ui-avatars.com/api/?name=Mwen&background=0052cc&color=fff`
                        : logoAdmin;

                    const msgDiv = document.createElement('div');
                    msgDiv.className = `message-line ${koteKlas}`;
                    
                    const lè = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "...";

                    msgDiv.innerHTML = `
                        <img src="${avatarUrl}" class="chat-avatar">
                        <div class="bubble">
                            <p>${m.text}</p>
                            <span class="time-send">${lè}</span>
                        </div>
                    `;
                    box.appendChild(msgDiv);
                });

                // AUTOSCROLL (Bwat la ap rete konstan, mesaj yo ap defile)
                box.scrollTop = box.scrollHeight;
            }
        });

        // STATUS ADMIN
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
