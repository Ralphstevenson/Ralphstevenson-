/* ============================================================
   JS ELITE V4.1 - KONPLETMAN OPTIMIZE
   ============================================================ */
import { auth, db } from './script.js'; 
import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let mesajKonte = 0; 
const logoAdmin = "https://i.postimg.cc/zBs03Y9d/file-00000000171471f5a0ff5138fae23eb4.png";

// 1. INICIALIZASYON CHAT LA
async function initChat() {
    const input = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send-chat');
    const sonNotif = document.getElementById('chat-notif');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            kouteMesaj(user.uid);
            kouteStatusAdmin();
        }
    });

    // Fonksyon pou voye mesaj
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

    if (btnSend) btnSend.onclick = voyeMesaj;
    if (input) {
        input.onkeypress = (e) => { if (e.key === 'Enter') voyeMesaj(); };
    }
}

// 2. KOUTE MESAJ YO AN TAN REYÈL
function kouteMesaj(uid) {
    const chatRef = ref(db, `chats/${uid}/messages`);
    
    onValue(chatRef, (snap) => {
        const box = document.getElementById('chat-messages');
        if (!box) return;
        
        const done = snap.val();
        if (done) {
            const mesajLis = Object.values(done);

            // Jere son notifikasyon si admin nan reponn
            if (mesajLis.length > mesajKonte) {
                const dènyeMesaj = mesajLis[mesajLis.length - 1];
                if (dènyeMesaj.sender === "admin") {
                    const son = document.getElementById('chat-notif');
                    son?.play().catch(() => {});
                }
            }
            mesajKonte = mesajLis.length;

            // Reset box la epi remete aviz sekirite a
            box.innerHTML = `
                <div class="chat-security-notice" style="text-align:center; padding:15px; background:#fff9c4; border-radius:10px; margin-bottom:15px; font-size:11px; color:#555; border: 1px solid #fbc02d;">
                    <i class="fa-solid fa-lock"></i> Mesaj ou yo chiffres. Pèsonn andeyò chat sa pa ka li yo.
                </div>
            `;

            // Afiche chak mesaj
            mesajLis.forEach(m => {
                const isMe = m.sender === "client";
                const div = document.createElement('div');
                div.className = `message ${isMe ? 'sent' : 'received'}`;
                
                let kontni = "";

                // Si se admin, nou ka mete logo a nan premye mesaj la oswa si gen imaj
                if (!isMe && m.imageUrl) {
                    kontni += `<img src="${m.imageUrl}" class="chat-msg-img" style="cursor:pointer" onclick="window.open('${m.imageUrl}')">`;
                }

                if (m.text) {
                    kontni += `<p style="margin:0">${m.text}</p>`;
                }

                // Jere lè a ak Double Check pou kliyan an
                const lè = m.timestamp 
                    ? new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : "...";
                
                const statusIcon = isMe ? `<i class="fa-solid fa-check-double" style="margin-left:5px; color:#53bdeb; font-size:10px;"></i>` : "";
                
                kontni += `<span class="msg-time" style="display:block; font-size:10px; text-align:right; margin-top:4px; opacity:0.6;">${lè} ${statusIcon}</span>`;
                
                div.innerHTML = kontni;
                box.appendChild(div);
            });

            // Scroll anba nèt
            box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
        }
    });
}

// 3. KOUTE STATUS ADMIN (ONLINE/OFFLINE)
function kouteStatusAdmin() {
    onValue(ref(db, `status/admin`), (snap) => {
        const status = snap.val()?.state || "offline";
        const pwen = document.getElementById('presence-indicator');
        const tèksStatus = document.getElementById('admin-status-text');
        
        if (pwen) {
            pwen.className = `status-dot ${status}`;
        }
        if (tèksStatus) {
            tèksStatus.innerText = status === "online" ? "An liy" : "De-konekte";
            tèksStatus.style.color = status === "online" ? "#22c55e" : "#64748b";
        }
    });
}

// Lanse sistèm nan
initChat();
        
