/* ============================================================
   JS ECHANJ - ECHANJ PLUS V5.5 - MIZAJOU SWITCH ON/OFF & DIALER GLOBAL
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Konfigirasyon pa defo
let liveSettings = {
    rateBuy: 0,
    rateSell: 0,
    systemFee: 16.5, // Pousantaj fiks 16.5% sou tranzaksyon yo[span_3](start_span)[span_3](end_span)
    digicelNumber: "50947111123",[span_4](start_span)[span_4](end_span)
    natcomNumber: "32160708",[span_5](start_span)[span_5](end_span)
    exchangeActive: true, // Switch echanj pa defo[span_6](start_span)[span_6](end_span)
    maintenanceMode: false // Mòd antretyen pa defo[span_7](start_span)[span_7](end_span)
};

// ============================================================
// KOUTE PARAMÈT YO NAN FIREBASE REALTIME DATABASE (settings/)
// ============================================================
onValue(ref(db, 'settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        liveSettings.rateBuy = data.rateBuy || 0;[span_8](start_span)[span_8](end_span)
        liveSettings.rateSell = data.rateSell || 0;[span_9](start_span)[span_9](end_span)
        liveSettings.systemFee = data.systemFee !== undefined ? parseFloat(data.systemFee) : 16.5;[span_10](start_span)[span_10](end_span)
        liveSettings.digicelNumber = data.digicelNumber || "50947111123";[span_11](start_span)[span_11](end_span)
        liveSettings.natcomNumber = data.natcomNumber || "32160708";[span_12](start_span)[span_12](end_span)

        // REKIPERE STATI SWITCH YO KI SOTI NAN AKEY ADMIN LAN[span_13](start_span)[span_13](end_span)
        if (data.exchangeActive !== undefined) {
            liveSettings.exchangeActive = (data.exchangeActive === true || data.exchangeActive === "true");[span_14](start_span)[span_14](end_span)
        }
        if (data.maintenanceMode !== undefined) {
            liveSettings.maintenanceMode = (data.maintenanceMode === true || data.maintenanceMode === "true");[span_15](start_span)[span_15](end_span)
        }

        // Mizajou afichaj frè yo sou paj la[span_16](start_span)[span_16](end_span)
        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${liveSettings.systemFee}% Frè`;[span_17](start_span)[span_17](end_span)
        });
        
        const sumFeePercent = document.getElementById('sum-fee-percent');
        if (sumFeePercent) sumFeePercent.innerText = liveSettings.systemFee;[span_18](start_span)[span_18](end_span)
    }
});

// ============================================================
// 1. FONKSYON LÈ KLIKEL SOU DIGICEL OSWA NATCOM (MARE NAN WINDOW)
// ============================================================
window.openDialer = async (rezo) => {
    // ⚠️ BLOKAJ 1: Tcheke si Admin nan fèmen sèvis la nan switch Akey la[span_19](start_span)[span_19](end_span)
    if (liveSettings.exchangeActive === false) {[span_20](start_span)[span_20](end_span)
        return alert("⚠️ Sèvis echanj lan fèmen pou le moman, kontakte admin la nan 35749198 sou whatsapp");
    }

    // ⚠️ BLOKAJ 2: Tcheke si platfòm lan anba antretyen[span_21](start_span)[span_21](end_span)
    if (liveSettings.maintenanceMode === true) {[span_22](start_span)[span_22](end_span)
        return alert("⚠️ Platfòm lan nan antretyen pou le moman. Re vini pi ta.");
    }

    const user = auth.currentUser;[span_23](start_span)[span_23](end_span)
    if (!user) return alert("❌ Ou dwe konekte anvan!");[span_24](start_span)[span_24](end_span)

    try {
        // Rekipere enfòmasyon itilizatè a[span_25](start_span)[span_25](end_span)
        const userSnap = await get(ref(db, `users/${user.uid}`));[span_26](start_span)[span_26](end_span)
        const userData = userSnap.val();[span_27](start_span)[span_27](end_span)

        if (!userData || (!userData.transactionPin && !userData.pin)) {[span_28](start_span)[span_28](end_span)
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");[span_29](start_span)[span_29](end_span)
            if (window.showPage) window.showPage('paj-parametre');[span_30](start_span)[span_30](end_span)
            return;[span_31](start_span)[span_31](end_span)
        }

        // Mande montan minit[span_32](start_span)[span_32](end_span)
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);[span_33](start_span)[span_33](end_span)
        if (!montanMinit) return;[span_34](start_span)[span_34](end_span)

        const mVal = parseFloat(montanMinit);[span_35](start_span)[span_35](end_span)
        if (isNaN(mVal) || mVal < 10) {[span_36](start_span)[span_36](end_span)
            return alert("❌ Minimòm echanj se 10 HTG.");[span_37](start_span)[span_37](end_span)
        }

        // Kalkil Frè sistèm an pousantaj[span_38](start_span)[span_38](end_span)
        const pousantajSistem = liveSettings.systemFee / 100;[span_39](start_span)[span_39](end_span)
        const freSistem = mVal * pousantajSistem;[span_40](start_span)[span_40](end_span)
        const montanPouResevwa = mVal - freSistem;[span_41](start_span)[span_41](end_span)

        // Afiche Done yo nan Modal la[span_42](start_span)[span_42](end_span)
        const sumMinitEl = document.getElementById('sum-minit');[span_43](start_span)[span_43](end_span)
        const sumFreEl = document.getElementById('sum-fre');[span_44](start_span)[span_44](end_span)
        const sumTotalEl = document.getElementById('sum-total');[span_45](start_span)[span_45](end_span)
        const pinInputEl = document.getElementById('input-pin-echanj');[span_46](start_span)[span_46](end_span)

        if (sumMinitEl) sumMinitEl.innerText = `${mVal.toFixed(2)} HTG`;[span_47](start_span)[span_47](end_span)
        if (sumFreEl) sumFreEl.innerText = `-${freSistem.toFixed(2)} HTG`;[span_48](start_span)[span_48](end_span)
        if (sumTotalEl) sumTotalEl.innerText = `${montanPouResevwa.toFixed(2)} HTG`;[span_49](start_span)[span_49](end_span)
        if (pinInputEl) pinInputEl.value = '';[span_50](start_span)[span_50](end_span)

        // Sove done yo tanporèman pou lè yo klike konfime[span_51](start_span)[span_51](end_span)
        window.currentPendingExchange = {
            rezo: rezo,[span_52](start_span)[span_52](end_span)
            amount: mVal,[span_53](start_span)[span_53](end_span)
            feeHTG: parseFloat(freSistem.toFixed(2)),[span_54](start_span)[span_54](end_span)
            toReceive: parseFloat(montanPouResevwa.toFixed(2)),[span_55](start_span)[span_55](end_span)
            userPIN: userData.transactionPin || userData.pin,[span_56](start_span)[span_56](end_span)
            userData: userData[span_57](start_span)[span_57](end_span)
        };

        // Ouvè Modal la sou ekran an[span_58](start_span)[span_58](end_span)
        const modal = document.getElementById('modal-confirm-echanj');[span_59](start_span)[span_59](end_span)
        if (modal) {
            modal.style.display = 'flex';[span_60](start_span)[span_60](end_span)
            modal.classList.remove('hidden');[span_61](start_span)[span_61](end_span)
        }

    } catch (error) {
        console.error("DETAY ERÈ A NTANFAZ:", error);[span_62](start_span)[span_62](end_span)
        alert("Gen yon pwoblèm nan rezo a. Verifye koneksyon entènèt ou.");[span_63](start_span)[span_63](end_span)
    }
};

// ============================================================
// 2. FONKSYON POU FÈMEN MODAL ECHANJ LA (MARE NAN WINDOW)
// ============================================================
window.femenModalEchanj = function() {[span_64](start_span)[span_64](end_span)
    const modal = document.getElementById('modal-confirm-echanj');[span_65](start_span)[span_65](end_span)
    if (modal) {
        modal.style.display = 'none';[span_66](start_span)[span_66](end_span)
        modal.classList.add('hidden');[span_67](start_span)[span_67](end_span)
    }
    const pinInputEl = document.getElementById('input-pin-echanj');[span_68](start_span)[span_68](end_span)
    if (pinInputEl) pinInputEl.value = '';[span_69](start_span)[span_69](end_span)
};

// ============================================================
// 3. KREYE TRANSAKSYON AK OUVRI DIALER AUTOMATIKMAN
// ============================================================
async function fèEchanjFinal() {
    // Sekirite siplemantè si sèvis la koupe pandan li nan modal la[span_70](start_span)[span_70](end_span)
    if (liveSettings.exchangeActive === false) {[span_71](start_span)[span_71](end_span)
        window.femenModalEchanj();[span_72](start_span)[span_72](end_span)
        return alert("⚠️ Sèvis echanj lan fèmen pou le moman, kontakte admin la nan 35749198 sou whatsapp");
    }

    const user = auth.currentUser;[span_73](start_span)[span_73](end_span)
    if (!user || !window.currentPendingExchange) return;[span_74](start_span)[span_74](end_span)

    const data = window.currentPendingExchange;[span_75](start_span)[span_75](end_span)
    const pinInputEl = document.getElementById('input-pin-echanj');[span_76](start_span)[span_76](end_span)
    const pinAntre = pinInputEl ? pinInputEl.value.trim() : "";[span_77](start_span)[span_77](end_span)

    if (!pinAntre || pinAntre.length < 4) {[span_78](start_span)[span_78](end_span)
        alert("❌ Tanpri antre PIN sekirite 4 chif ou an!");[span_79](start_span)[span_79](end_span)
        if (pinInputEl) pinInputEl.focus();[span_80](start_span)[span_80](end_span)
        return;[span_81](start_span)[span_81](end_span)
    }

    // Validasyon PIN[span_82](start_span)[span_82](end_span)
    if (pinAntre.toString() !== data.userPIN.toString()) {[span_83](start_span)[span_83](end_span)
        return alert("❌ PIN enkòrèk. Aksyon anile.");[span_84](start_span)[span_84](end_span)
    }

    const transID = "ECH-" + Date.now();[span_85](start_span)[span_85](end_span)
    const transactionData = {
        transID: transID,[span_86](start_span)[span_86](end_span)
        uid: user.uid,[span_87](start_span)[span_87](end_span)
        arsID: data.userData.arsID || "---",[span_88](start_span)[span_88](end_span)
        fullname: data.userData.fullname || data.userData.full_name || data.userData.username || "Kliyan ARS",[span_89](start_span)[span_89](end_span)
        phone: data.userData.phone || "",[span_90](start_span)[span_90](end_span)
        type: "Echanj",[span_91](start_span)[span_91](end_span)
        rezo: data.rezo,[span_92](start_span)[span_92](end_span)
        amount_sent: data.amount,[span_93](start_span)[span_93](end_span)
        applied_fee_percent: liveSettings.systemFee,[span_94](start_span)[span_94](end_span)
        fee_amount: data.feeHTG,[span_95](start_span)[span_95](end_span)
        htg_to_receive: data.toReceive,[span_96](start_span)[span_96](end_span)
        status: "En attente",[span_97](start_span)[span_97](end_span)
        timestamp: serverTimestamp()[span_98](start_span)[span_98](end_span)
    };

    let anrejistrePwofilKliyan = false;[span_99](start_span)[span_99](end_span)
    let anrejistreGlobal = false;[span_100](start_span)[span_100](end_span)

    // A. Eseye ekri nan espas Kliyan an[span_101](start_span)[span_101](end_span)
    try {
        await set(ref(db, `users/${user.uid}/user_transactions/${transID}`), transactionData);[span_102](start_span)[span_102](end_span)
        anrejistrePwofilKliyan = true;[span_103](start_span)[span_103](end_span)
    } catch (e) {
        console.error("Firebase bloke ekriti sou pwofil itilizatè:", e);[span_104](start_span)[span_104](end_span)
    }

    // B. Eseye ekri nan chemen jeneral ak admin yo[span_105](start_span)[span_105](end_span)
    try {
        await set(ref(db, `transactions/${transID}`), transactionData);[span_106](start_span)[span_106](end_span)
        await set(ref(db, `admin_orders/${transID}`), transactionData);[span_107](start_span)[span_107](end_span)
        anrejistreGlobal = true;[span_108](start_span)[span_108](end_span)
    } catch (e) {
        console.error("Firebase bloke ekriti nan node Admin/Global:", e);[span_109](start_span)[span_109](end_span)
    }

    if (anrejistrePwofilKliyan || anrejistreGlobal) {[span_110](start_span)[span_110](end_span)
        try {
            if (window.voyeNotifikasyon) {[span_111](start_span)[span_111](end_span)
                window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${data.amount} minit anrejistre.`);[span_112](start_span)[span_112](end_span)
            }
        } catch(nErr) { console.log(nErr); }[span_113](start_span)[span_113](end_span)

        window.femenModalEchanj();[span_114](start_span)[span_114](end_span)

        const targetNumber = (data.rezo === 'digicel') ? liveSettings.digicelNumber : liveSettings.natcomNumber;[span_115](start_span)[span_115](end_span)
        const ussd = (data.rezo === 'digicel')[span_116](start_span)[span_116](end_span)
            ? `*128*${targetNumber}*${data.amount}#`[span_117](start_span)[span_117](end_span)
            : `*123*88888888*${targetNumber}*${data.amount}#`;[span_118](start_span)[span_118](end_span)

        alert("✅ Bravo! Tranzaksyon anrejistre.\n\nKlike sou OK pou w ireksyonnen sou aplikasyon telefòn lan pou voye minit yo.");[span_119](start_span)[span_119](end_span)
        window.location.href = `tel:${encodeURIComponent(ussd)}`;[span_120](start_span)[span_120](end_span)
    } else {
        alert("❌ Gen yon erè nan anrejistreman an. Verifye koneksyon entènèt ou oswa kontakte sipò.");[span_121](start_span)[span_121](end_span)
    }
}

// INISYALIZE BOTON YO[span_122](start_span)[span_122](end_span)
export function initEchanj(uid) {[span_123](start_span)[span_123](end_span)
    console.log("Echanj Ready ✅");[span_124](start_span)[span_124](end_span)
    const btnKonfime = document.getElementById('btn-konfime-final');[span_125](start_span)[span_125](end_span)
    if (btnKonfime) {[span_126](start_span)[span_126](end_span)
        btnKonfime.onclick = (e) => {[span_127](start_span)[span_127](end_span)
            e.preventDefault();[span_128](start_span)[span_128](end_span)
            fèEchanjFinal(); 
        };
    }
}
