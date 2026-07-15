// ============================================================
// SISTÈM DÈNYE AKTIVITE - JAVASCRIPT DETEKTÈ ERÈ (DEBUG)
// ============================================================
auth.onAuthStateChanged((user) => {
    const activityContainer = document.getElementById('home-recent-activity');
    if (!activityContainer) {
        console.error("Erè: Id 'home-recent-activity' pa egziste nan HTML la.");
        return;
    }
    
    if (user) {
        const userId = user.uid;
        console.log("Itilizatè konekte ak UID:", userId);
        
        // Timer sekirite: Si apre 6 segonn Firebase pa reponn, n ap debloke ekran an
        const safetyTimer = setTimeout(() => {
            if (activityContainer.innerHTML.includes("Ap chaje done depi nan Firebase")) {
                console.warn("Firebase pran twòp tan pou l reponn. Posiblite pou yon erè Rules oswa Rezo.");
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini">Sistèm nan pran yon ti tan pou l reponn. <br>
                    <span style="color: var(--primary); cursor: pointer; font-weight: bold;" onclick="window.location.reload()">Klike la pou rafrechi paj la</span></p>
                `;
            }
        }, 6000);

        try {
            // Nou konekte dirèkteman nan branch 'transactions'
            const dbRef = firebase.database().ref('transactions')
                            .orderByChild('uid')
                            .equalTo(userId);

            dbRef.on('value', (snapshot) => {
                // Depi nou jwenn repons, nou netwaye Timer sekirite a epi nou vide mesaj chajman an
                clearTimeout(safetyTimer);
                activityContainer.innerHTML = ''; 

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let transactionsList = [];
                    
                    // Konvèti done Firebase yo an Array
                    for (let key in data) {
                        transactionsList.push({ id: key, ...data[key] });
                    }

                    // Triye tranzaksyon yo depi sou sa ki pi resan an (Dat/Timestamp)
                    transactionsList.sort((a, b) => {
                        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                        return dateB - dateA;
                    });

                    // Limite afichaj la ak 3 dènye yo sèlman
                    const topThree = transactionsList.slice(0, 3);

                    topThree.forEach((tx) => {
                        let statusClass = 'status-pending';
                        let statusText = tx.status || 'En atant';
                        let statusIcon = 'fa-clock';

                        // Verifye estati a
                        if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                            statusClass = 'status-success';
                            statusIcon = 'fa-circle-check';
                        } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                            statusClass = 'status-failed';
                            statusIcon = 'fa-circle-xmark';
                        }

                        const type = tx.type || 'Tranzaksyon';
                        const amount = tx.amount ? `${tx.amount} HTG` : '0 HTG';
                        
                        // Fòma dat la byen pwòp
                        let dateFormatted = '';
                        if (tx.date) {
                            const d = new Date(tx.date);
                            dateFormatted = !isNaN(d) ? d.toLocaleDateString('ht-HT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : tx.date;
                        }

                        const activityHTML = `
                            <div class="activity-item-pro">
                                <div class="activity-left">
                                    <div class="activity-icon-box ${statusClass}">
                                        <i class="fa-solid ${statusIcon}"></i>
                                    </div>
                                    <div class="activity-details">
                                        <span class="activity-type">${type}</span>
                                        <span class="activity-date">${dateFormatted}</span>
                                    </div>
                                </div>
                                <div class="activity-right">
                                    <span class="activity-amount">${amount}</span>
                                    <span class="activity-status-label ${statusClass}">${statusText}</span>
                                </div>
                            </div>
                        `;
                        activityContainer.insertAdjacentHTML('beforeend', activityHTML);
                    });

                } else {
                    // Si itilizatè a pa gen okenn istwa tranzaksyon nan database la
                    activityContainer.innerHTML = `
                        <p class="empty-msg-mini">Ou poko fè okenn tranzaksyon.</p>
                    `;
                }
            }, (error) => {
                clearTimeout(safetyTimer);
                console.error("Erè Firebase Database:", error);
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini text-danger">Erè lekti: ${error.message}</p>
                `;
            });

        } catch (err) {
            clearTimeout(safetyTimer);
            console.error("Erè sistèm JS:", err);
            activityContainer.innerHTML = `
                <p class="empty-msg-mini text-danger">Erè teknik nan kòd la.</p>
            `;
        }

    } else {
        // Si moun lan pa konekte ditou
        activityContainer.innerHTML = `
            <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
        `;
    }
});
                            
