auth.onAuthStateChanged((user) => {
    const activityContainer = document.getElementById('home-recent-activity');
    if (!activityContainer) return;
    
    if (user) {
        const userId = user.uid;
        
        // 1. Nou vize branch "transactions" ki nan rasin nan dirèkteman
        // 2. Nou ajoute filtè "orderByChild" ak "equalTo" pou obeyi Rules sekirite yo
        const dbRef = firebase.database().ref('transactions')
                        .orderByChild('uid')
                        .equalTo(userId);

        dbRef.on('value', (snapshot) => {
            // Depi nou jwenn repons nan men Firebase, nou retire mesaj "Ap chaje..." a
            activityContainer.innerHTML = ''; 

            if (snapshot.exists()) {
                const data = snapshot.val();
                let transactionsList = [];
                
                // Transfòme done yo an Array
                for (let key in data) {
                    transactionsList.push({ id: key, ...data[key] });
                }

                // Triye tranzaksyon yo depi sou sa ki pi resan an (timestamp/date)
                transactionsList.sort((a, b) => {
                    // Si w gen timestamp li pi bon, sinon nou itilize dat la
                    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                    return dateB - dateA;
                });

                // Pran sèlman 3 dènye yo
                const topThree = transactionsList.slice(0, 3);

                topThree.forEach((tx) => {
                    let statusClass = 'status-pending';
                    let statusText = tx.status || 'En atant';
                    let statusIcon = 'fa-clock';

                    // Tcheke estati tranzaksyon an
                    if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                        statusClass = 'status-success';
                        statusIcon = 'fa-circle-check';
                    } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                        statusClass = 'status-failed';
                        statusIcon = 'fa-circle-xmark';
                    }

                    // Tip operasyon ak kantite kòb
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
                // Si moun lan pa gen okenn tranzaksyon nan database la ak UID li
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini">Ou poko fè okenn tranzaksyon.</p>
                `;
            }
        }, (error) => {
            console.error("Erè Firebase Database:", error);
            activityContainer.innerHTML = `
                <p class="empty-msg-mini text-danger">Erè koneksyon ak baz done a.</p>
            `;
        });

    } else {
        activityContainer.innerHTML = `
            <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
        `;
    }
});
                 
