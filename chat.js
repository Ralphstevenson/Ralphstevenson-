// ... anndan window.listenToMessages ...

mesajLis.forEach(m => {
    const isMe = m.sender === "client";
    const klasKote = isMe ? "sent" : "received";
    
    const div = document.createElement('div');
    div.className = `message ${klasKote}`;
    
    let kontni = "";

    // Si se admin, nou ka mete yon ti non anlè mesaj la (opsyonèl)
    // if (!isMe) kontni += `<small style="display:block; color:#00a884; font-weight:bold; font-size:10px;">Sipò</small>`;

    if (m.imageUrl) {
        kontni += `<img src="${m.imageUrl}" class="chat-msg-img" onclick="window.open('${m.imageUrl}')">`;
    }

    if (m.text) {
        kontni += `<p style="margin:0">${m.text}</p>`;
    }

    const lè = m.timestamp 
        ? new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        : "...";
    
    kontni += `<span class="msg-time">${lè} ${isMe ? '<i class="fa-solid fa-check-double" style="margin-left:3px; color:#53bdeb;"></i>' : ''}</span>`;
    
    div.innerHTML = kontni;
    box.appendChild(div);
});
