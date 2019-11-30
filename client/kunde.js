const Request = require('request');
const FriseurStatus = require('../routes/friseur').FriseurStatus;

const hostUrl = "http://127.0.0.1:3000";

// Wir erzeugen eine zufällige Kunden-ID bzw. holen uns die aus der Kommandozeile
let kundenId = process.argv.length < 3 ? 'kunde-' + Math.round(Math.random() * 5000) : process.argv[2];

console.log("Meine Kunden-ID ist " + kundenId);
acquireLock();

function acquireLock() {
    Request.put({
        url: hostUrl + '/wartezimmer/lock',
        json: {lock: true}  // damit signalisieren wir, dass die Antwort automatisch als JSON interpretiert werden soll.
    }, lockAntwort);

    function lockAntwort(err, resp, body) {
        if (resp.statusCode === 400) {
            setTimeout(acquireLock,400);
        } else {
            haareSchneiden();
        }
    }

}


function haareSchneiden() {
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
        friseurAufwecken(friseur);
    } else if (friseur.status === FriseurStatus.schneidend) {
        setTimeout(insWartezimmerGehen, 200);   // wir gehen erst nach 200ms ins Wartezimmer
    } else {
        throw (new Error("unbekannter Friseur-Status"));
    }

}

function friseurAufwecken(friseur) {
    friseur.status = FriseurStatus.schneidend;
    friseur.kunde = kundenId;
    Request.post({
        url: hostUrl + '/friseur',
        json: friseur
    }, logResponse);
}


function insWartezimmerGehen() {

    Request.post({
        url: hostUrl + '/wartezimmer',
        json: {kundenId: kundenId}
    }, logResponse);
}


function logResponse(error, response, body) {
    // nur zur Illustration geben wir die Response aus
    Request.put({
        url: hostUrl + '/wartezimmer/lock',
        json: {lock: false}  // damit signalisieren wir, dass die Antwort automatisch als JSON interpretiert werden soll.
    });
}
