/**
 * ============================================================
 * ECHANJ PLUS - JESTYON CHAT SIPÒ (chat.js)
 * ES Module - Depann nèt sou script.js pou Firebase v10
 * ============================================================
 */

import { db, auth } from "./script.js";
import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let mesajKonte = 0;

// ==========================================
// 1. INICIALIZASYON CHAT LA
// ==========================================
export async function initChat(uid) {
    if (!uid) return;

    const input = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send-chat');
    const fileInput = document.getElementById('chat-file');

    // Kòmanse koute mesaj ak status admin nan an tan reyèl
    kouteMesaj(uid);
    kouteStatusAdmin();

    // Fonksyon pou voye mesaj tèks
    const voyeMesaj = async () => {
        const tèks = input.value.trim();
        if (tèks && auth.currentUser) {
            try {
                await push(ref(db, `chats/${uid}/messages`), {
                    sender: "client",
                    text: tèks,
                    status: "sent",
                    timestamp: serverTimestamp()
                });
                input.value = "";
                if (input) input.focus();
            } catch (error) {
                console.error("Erè voye mesaj:", error);
            }
        }
    };

    // Fonksyon pou voye yon imaj (an Base64 pou konpatibilite rapid san Storage)
    const voyeImaj = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64String = event.target.result;
            try {
                await push(ref(db, `chats/${uid}/messages`), {
                    sender: "client",
                    imageUrl: base64String,
                    status: "sent",
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error("Erè voye imaj:", error);
            }
        };
        reader.readAsDataURL(file);
    };

    // Atache evènman yo
    if (btnSend) {
        btnSend.onclick = (e) => {
            e.preventDefault();
            voyeMesaj();
        };
    }

    if (input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                voyeMesaj();
            }
        };
    }

    if (fileInput) {
        fileInput.onchange = voyeImaj;
    }
}

// ==========================================
// 2. KOUTE MESAJ YO AN TAN REYÈL
// ==========================================
function kouteMesaj(uid) {
    const chatRef = ref(db, `chats/${uid}/messages`);
    const box = document.getElementById('chat-messages');

    onValue(chatRef, (snap) => {
        if (!box) return;
        
        const done = snap.val();
        if (done) {
            const mesajLis = Object.values(done);

            // Jere son notifikasyon si se yon nouvo mesaj admin voye
            if (mesajLis.length > mesajKonte) {
                const dènyeMesaj = mesajLis[mesajLis.length - 1];
                if (dènyeMesaj.sender === "admin") {
                    const son = document.getElementById('chat-notif');
                    if (son) {
                        son.play().catch((err) => console.log("Lektur son bloke pa navigatè a:", err));
                    }
                }
            }
            mesajKonte = mesajLis.length;

            // Efase kontni an epi remete aviz sekirite a fòmate byen bèl
            box.innerHTML = `
                <div class="chat-security-notice">
                    <i class="fa-solid fa-lock"></i>
                    <p>Konvèsasyon sa a chiffres ak sekirite an bout-an-bout. Pèsonn andeyò chat sa a pa ka li mesaj ou yo.</p>
                </div>
            `;

            // Afiche chak mesaj nan lòd
            mesajLis.forEach(m => {
                const isMe = m.sender === "client";
                const div = document.createElement('div');
                div.className = `message ${isMe ? 'sent' : 'received'}`;
                
                let kontni = "";

                // Jere si se yon imaj
                if (m.imageUrl) {
                    kontni += `<img src="${m.imageUrl}" class="chat-msg-img" style="max-width: 100%; border-radius: 8px; margin-bottom: 5px; cursor: pointer;" onclick="window.open('${m.imageUrl}')">`;
                }

                // Jere si gen tèks
                if (m.text) {
                    kontni += `<p style="margin:0">${m.text}</p>`;
                }

                // Jere lè a ak doub chèk la pou kliyan an
                const lè = m.timestamp 
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : "...";
                
                const statusIcon = isMe ? `<i class="fa-solid fa-check-double" style="margin-left:5px; color:#53bdeb; font-size:10px;"></i>` : "";
                
                kontni += `<span class="msg-time" style="display:block; font-size:10px; text-align:right; margin-top:4px; opacity:0.6;">${lè} ${statusIcon}</span>`;
                
                div.innerHTML = kontni;
                box.appendChild(div);
            });

            // Scroll otomatikman desann pou wè dènye mesaj la
            box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
        } else {
            // Si pa gen mesaj ditou
            box.innerHTML = `
                <div class="chat-security-notice">
                    <i class="fa-solid fa-lock"></i>
                    <p>Konvèsasyon sa a chiffres ak sekirite an bout-an-bout. Pèsonn andeyò chat sa a pa ka li mesaj ou yo.</p>
                </div>
                <p class="empty-msg" style="text-align:center; margin-top:20px; color:#9ca3af;">Ekri premye mesaj ou pou kòmanse pale ak sipò a.</p>
            `;
        }
    });
}

// ==========================================
// 3. KOUTE STATUS ADMIN (ONLINE/OFFLINE)
// ==========================================
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

// Ekspoze fonksyon an sou Window pou sekirite
window.initChat = initChat;
                                                                    
