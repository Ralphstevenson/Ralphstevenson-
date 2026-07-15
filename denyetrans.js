// 1. Konfigirasyon Firebase ou a
const firebaseConfig = {
  apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
  authDomain: "echanj-plus-778cd.firebaseapp.com",
  databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
  projectId: "echanj-plus-778cd",
  storageBucket: "echanj-plus-778cd.firebasestorage.app",
  messagingSenderId: "111144762929",
  appId: "1:111144762929:web:e64ce9a6da65781c289f10",
  measurementId: "G-J1BQRF32ZW"
};

// 2. Inisyalize Firebase si l poko fèt
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// 3. Koute lè kondisyon koneksyon itilizatè a chanje
auth.onAuthStateChanged((user) => {
    const activityContainer = document.getElementById('home-recent-activity');
    if (!activityContainer) return;
    
    if (user) {
        const userId = user.uid;
        
        // Nou vize branch 'transactions' dirèkteman epi nou filtre pa 'uid' pou n pase nan Rules yo
        const dbRef = database.ref('transactions')
                              .orderByChild('uid')
                              .equalTo(userId);

        dbRef.on('value', (snapshot) => {
            // Netwaye mesaj "Ap chaje..." a depi nou jwenn repons nan men Firebase
            activityContainer.innerHTML = ''; 

            if (snapshot.exists()) {
                const data = snapshot.val();
                let transactionsList = [];
                
                // Transfòme objè a an Array
                for (let key in data) {
                    transactionsList.push({ id: key, ...data[key] });
                }

                // Triye tranzaksyon yo depi sou sa ki pi resan an (Dat/Timestamp)
                transactionsList.sort((a, b) => {
                    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                    return dateB - dateA;
                });

                // Pran sèlman 3 premye yo
                const topThree = transactionsList.slice(0, 3);

                // Afiche chak aktivite yo
                topThree.forEach((tx) => {
                    let statusClass = 'status-pending';
                    let statusText = tx.status || 'En atant';
                    let statusIcon = 'fa-clock';

                    // Detèmine estati a
                    if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                        statusClass = 'status-success';
                        statusIcon = 'fa-circle-check';
                    } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                        statusClass = 'status-failed';
                        statusIcon = 'fa-circle-xmark';
                    }

                    const type = tx.type || 'Tranzaksyon';
                    const amount = tx.amount ? `${tx.amount} HTG` : '0 HTG';
                    
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
                // Si moun lan pa gen okenn tranzaksyon nan baz done a
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini">Ou poko gen okenn aktivite sou kont ou.</p>
                `;
            }
        }, (error) => {
            console.error("Erè lekti Firebase:", error);
            activityContainer.innerHTML = `
                <p class="empty-msg-mini text-danger">Koneksyon limite. Rafrechi paj la.</p>
            `;
        });

    } else {
        // Si itilizatè a pa konekte
        activityContainer.innerHTML = `
            <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
        `;
    }
});
