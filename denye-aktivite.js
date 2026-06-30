try {
    const recentActivityDiv = document.getElementById("home-recent-activity");
    if (recentActivityDiv) {
        // Filtre sou branch 'transaction' par UID pèsonèl
        const queryPèsonèl = query(ref(db, 'transaction'), orderByChild('uid'), equalTo(uid));
        
        onValue(queryPèsonèl, (snapshot) => {
            recentActivityDiv.innerHTML = "";
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Klase pa timestamp (pi nouvo an liy)
                const myTrans = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                // Pran 3 premye yo
                const top3Trans = myTrans.slice(0, 3);
                
                top3Trans.forEach(trans => {
                    const montan = trans.amount_sent || trans.amount || 0;
                    let badgeColor = (trans.status === "Validé" || trans.status === "Success" || trans.status === "Complété") ? "#2e7d32" : (trans.status === "En attente" ? "#ffb300" : "#c62828");
                    let icon = trans.type === "Echanj" ? "fa-sync-alt" : "fa-wallet";
                    
                    const row = document.createElement('div');
                    row.className = "rate-row";
                    row.style.cssText = "border-bottom: 1px solid #f9f9f9; padding: 12px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
                    
                    row.innerHTML = `
                        <span class="provider-name" style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas ${icon}" style="color: #109121; font-size: 13px;"></i> 
                            <b>${trans.type}</b> - ${trans.rezo || trans.method || trans.provider || 'Sistèm'}
                        </span>
                        <span style="font-size: 12px; text-align: right;">
                            <b style="color: #1a1a1a;">${montan} HTG</b><br>
                            <small style="color: ${badgeColor}; font-weight: bold;">● ${trans.status}</small>
                        </span>`;
                    
                    // Louvri modal detay resi a
                    row.onclick = () => {
                        if (typeof window.viewReceipt === 'function') {
                            window.viewReceipt(trans);
                        }
                    };
                    
                    recentActivityDiv.appendChild(row);
                });
            } else {
                recentActivityDiv.innerHTML = `<p class="empty-msg-mini" style="text-align:center; color:#757575; font-size:13px; margin: 15px 0;">Ou poko fè okenn tranzaksyon.</p>`;
            }
        });
    }
} catch (err) { console.error("Erè Dènye Aktivite:", err); }
