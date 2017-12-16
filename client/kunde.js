const Request = require('request');
const FriseurStatus = require('../routes/friseur').FriseurStatus;

const hostUrl = "http://127.0.0.1:3000";

// Wir erzeugen eine zufällige Kunden-ID bzw. holen uns die aus der Kommandozeile
let kundenId = process.argv.length < 3 ? 'kunde-' + Math.round(Math.random() * 5000) : process.argv[2];

console.log("Meine Kunden-ID ist " + kundenId);

// Start des Prozesses
getLock();

/**
 * Lock sichern [damit wir exklusiven Zugriff haben]
 */
function getLock() {
    Request.put({
        url: hostUrl + "/lock",
        json: {lockValue: true}
    }, antwortVonLock);
}


/**
 * Antwort des Lock-Services auswerten
 * @param body "success" oder "error"
 */
function antwortVonLock(error, response, body) {
    if (body === "success") {
        starteProzess();  // Erfolgreich --> dann legen wir los
    } else {
        setTimeout(getLock, 500);  // Fehler --> wir probieren es in 500ms noch mal
    }
}



/**
 * Nachschauen was der Friseur macht und dann aufwecken oder ins
 * Wartezimmer gehen
 */
function starteProzess() {
    // Wir schauen uns an, was der Friseur macht
    Request.get({
        url: hostUrl + '/friseur',
        json: true  // damit signalisieren wir, dass die Antwort automatisch als JSON interpretiert werden soll.
    }, friseurAntwort);
}


function friseurAntwort(error, response, body) {
    if (error) {
        throw error;
    }
    // DEBUG-Ausgabe des Friseurs
    console.log(body);
    let friseur = body;

    if (friseur.status === FriseurStatus.schlafend) {
        console.log("Der Friseur schläft...");
        friseurAufwecken(friseur);
    } else if (friseur.status === FriseurStatus.schneidend) {
        console.log("Der Friseur ist beschäftigt...");
        setTimeout(insWartezimmerGehen, 200);   // wir gehen erst nach 200ms ins Wartezimmer
    } else {
        throw (new Error("unbekannter Friseur-Status"));
    }
}


/**
 * Lock wieder freigeben, indem wir den Lock-Status auf false setzen
 * Antwort ignorieren wir.
 */
function freeLock() {
    Request.put({
        url: hostUrl + '/lock',
        json: { lockValue: false }
    });
}


function friseurAufwecken(friseur) {
    friseur.status = FriseurStatus.schneidend;
    friseur.kunde = kundenId;

    Request.post({
        url: hostUrl + '/friseur',
        json: friseur
    }, antwortVomAufwecken);

    function antwortVomAufwecken(error, response, body) {
        console.log("Friseur aufgewacht: " + body);
        freeLock();
    }
}


function insWartezimmerGehen() {
    Request.post({
        url: hostUrl + '/wartezimmer',
        json: {kundenId: kundenId}
    }, antwortVomWartezimmer);

    function antwortVomWartezimmer(error, response, body) {
        console.log("Ins Wartezimmer gegangen: " + body);
        freeLock();
    }
}
