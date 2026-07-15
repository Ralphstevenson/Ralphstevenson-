// Sipoze ou gen Firebase Auth ak Database ki inisyalize deja kòm "auth" ak "database"

// Koute si kondisyon koneksyon itilizatè a chanje
auth.onAuthStateChanged((user) => {
    const activityContainer = document.getElementById('home-recent-activity');
    
    if (user) {
        const userId = user.uid;
        // Ref sou branch tranzaksyon itilizatè a (chanje chemen an si pa w la rele yon lòt jan)
        const dbRef = firebase.database().ref(`users/${userId}/transactions`);

        // Rale done yo an tan reyèl
        dbRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Konvèti objè a an Array pou n ka manipile l
                let transactionsList = [];
                for (let key in data) {
                    transactionsList.push({ id: key, ...data[key] });
                }

                // 1. Triye tranzaksyon yo depi sou sa ki pi resan an (Dat ki pi fò)
                transactionsList.sort((a, b) => new Date(b.date) - new Date(a.date));

                // 2. Pran sèlman 3 premye yo (3 dènye tranzaksyon yo fè)
                const topThree = transactionsList.slice(0, 3);

                // Vide veso a anvan n mete nouvo done yo
                activityContainer.innerHTML = '';

                // 3. Boukle pou afiche yo chak
                topThree.forEach((tx) => {
                    // Detèmine koulè ak ikòn selon estati a (Validé, En atant, oswa Echwe)
                    let statusClass = 'status-pending';
                    let statusText = tx.status || 'En atant';
                    let statusIcon = 'fa-clock';

                    if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                        statusClass = 'status-success';
                        statusIcon = 'fa-circle-check';
                    } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                        statusClass = 'status-failed';
                        statusIcon = 'fa-circle-xmark';
                    }

                    // Detèmine tip operasyon an (Retrè MonCash, Echanj Digicel, etc.)
                    const type = tx.type || 'Tranzaksyon';
                    const amount = tx.amount ? `${tx.amount} HTG` : '0 HTG';
                    const dateFormatted = tx.date ? new Date(tx.date).toLocaleDateString('ht-HT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }) : '';

                    // Kreye estrikti HTML HTML pou chak kat aktivite
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
                // Si moun lan poko janm fè okenn tranzaksyon
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini">Ou poko gen okenn aktivite sou kont ou.</p>
                `;
            }
        }, (error) => {
            console.error("Erè lè n ap rale done yo: ", error);
            activityContainer.innerHTML = `
                <p class="empty-msg-mini text-danger">Erè koneksyon ak baz done a.</p>
            `;
        });

    } else {
        // Si itilizatè a pa konekte
        activityContainer.innerHTML = `
            <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
        `;
    }
});
          
