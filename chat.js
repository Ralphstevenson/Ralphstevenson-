/* ============================================================
   JS ELITE - CHAT ECHANJ PLUS (VÈSYON FINAL METE AJOU)
   ============================================================ */

import { auth, db } from './script.js'; 
import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let mesajKonte = 0; 
// Logo admin nan limit nan CSS la kounye a
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
                console.error("Erè voye mesaj:", error);
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

                // 1. LOJIK SON (DING) LÈ ADMIN REPONN
                if (mesajLis.length > mesajKonte) {
                    const dènyeMesaj = mesajLis[mesajLis.length - 1];
                    if (dènyeMesaj.sender === "admin" && sonNotif) {
                        sonNotif.play().catch(() => console.log("Audio bezwen entèraksyon"));
                    }
                }
                mesajKonte = mesajLis.length;

                // 2. NETWAYE EPI METE AVI SEKIRITE A
                box.innerHTML = `
                    <div style="text-align:center; padding:20px; color:#94a3b8; font-size:11px;">
                        <i class="fa-solid fa-lock" style="margin-bottom:5px;"></i>
                        <p>Konvèsasyon sa a an sekirite epi li chiffres.</p>
                    </div>
                `;

                // 3. BOUK POU AFICHE CHAK MESAJ
                mesajLis.forEach(m => {
                    const isMe = m.sender === "client";
                    // Itilize klas CSS pwofesyonèl nou te fè yo
                    const klasKote = isMe ? "sent" : "received";
                    
                    const div = document.createElement('div');
                    div.className = `message ${klasKote}`;
                    
                    let kontni = "";

                    // Jere imaj si admin nan voye youn (Logo a ap antre la tou)
                    if (m.imageUrl || (!isMe && m.sender === "admin")) {
                        const srcImg = m.imageUrl || logoAdmin;
                        kontni += `<img src="${srcImg}" class="chat-msg-img" alt="Logo Admin">`;
                    }

                    // Jere tèks la
                    if (m.text) {
                        kontni += `<p style="margin:0">${m.text}</p>`;
                    }

                    // Jere lè a
                    const lè = m.timestamp 
                        ? new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : "...";
                    
                    kontni += `<span class="msg-time">${lè}</span>`;
                    
                    div.innerHTML = kontni;
                    box.appendChild(div);
                });

                // 4. AUTOSCROLL (Rete anba nèt)
                box.scrollTop = box.scrollHeight;
            }
        });

        // STATUS ADMIN (ONLINE/OFFLINE)
        onValue(ref(db, `status/admin`), (snap) => {
            const status = snap.val()?.state || "offline";
            const pwen = document.getElementById('presence-indicator');
            const tèksStatus = document.getElementById('admin-status-text');
            if(pwen) pwen.className = `status-dot ${status}`;
            if(tèksStatus) tèksStatus.innerText = status === "online" ? "An liy" : "De-konekte";
        });
    };
}

chajeChat();
       
