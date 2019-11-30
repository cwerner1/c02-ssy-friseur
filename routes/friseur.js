const express = require('express');
const Request = require('request');
const router = express.Router();

let FriseurStatus = {
    schlafend: "schlafend",
    schneidend: "schneidend"
};

const dauerHaareSchneiden = 5000; // Zeit in ms

// Im Friseur-Objekt merken wir uns den Status des Friseurs
// und (falls gerade vorhanden) welcher Kunde gerade bearbeitet wird.
let friseur = {
    status: FriseurStatus.schlafend,
    kunde: null
};

/* GET users listing. */
router.get('/', zeigeFriseur);
router.post('/', aktualisiereFriseur);

function zeigeFriseur(req, res) {
    res.json(friseur);
}

// Funktion wird genützt, um neue Friseurdaten zu setzen
function aktualisiereFriseur(req, res) {
    friseur = req.body;

    console.log("Ich bin " + friseur.status);
    console.log("Schneide Haare bei " + friseur.kunde);

    // nach einiger Zeit geht es weiter bei der Funktion haareFertigGeschnitten
    setTimeout(haareFertigGeschnitten, dauerHaareSchneiden);
    res.sendStatus(200);
}


function haareFertigGeschnitten() {
    console.log("Fertig! ... und ab mit dir " + friseur.kunde);
    friseur.kunde = null;

    // Schauen wir im Wartezimmer nach, ob jemand da ist
    AquireLock();
}

function AquireLock() {
    Request.put({
        url: 'http://127.0.0.1:3000/wartezimmer/lock',
        json: {lock: true}  // damit signalisieren wir, dass die Antwort automatisch als JSON interpretiert werden soll.
    }, lockAntwort);

    function lockAntwort(error, responsem, body) {
        if (responsem.statusCode == 200) {
            Request.get({
                url: 'http://127.0.0.1:3000/wartezimmer',
                json: true   // wir setzen json-Wert immer, dann "weiß" das Framework, dass wir JSON als Antwort erwarten
            }, wartezimmerErgebnis);
        } else {
            setTimeout(AquireLock, 500);
        }
    }
}

function wartezimmerErgebnis(error, response, body) {
    if (error) {
        throw error;
    }

    // Aktuelle Liste der Personen im Wartezimmer
    console.log(body);

    if (body.length == 0) {
        // Niemand da --> Friseur legt sich schlafen
        friseur.status = FriseurStatus.schlafend;
    } else {
        // Jemand im Wartezimmer: Friseur nimmt den nächsten Kunden ran
        Request.delete({
            url: 'http://127.0.0.1:3000/wartezimmer/0',
            json: true
        }, naechsterKunde);
    }
    Request.put({
        url: 'http://127.0.0.1:3000/wartezimmer/lock',
        json: {lock: false}  // damit signalisieren wir, dass die Antwort automatisch als JSON interpretiert werden soll.
    });

}

function naechsterKunde(error, response, body) {
    if (error) {
        throw error;
    }
    let kunde = body;
    console.log('Neuen Kunden gefunden: ' + kunde.kundenId);

    friseur.kunde = kunde.kundenId;
    // nach einiger Zeit geht es weiter bei der Funktion haareFertigGeschnitten
    setTimeout(haareFertigGeschnitten, dauerHaareSchneiden);
}


module.exports = {
    router: router,
    FriseurStatus: FriseurStatus
};
