const express = require('express');
const Request = require('request');
const router = express.Router();

let FriseurStatus = {
    schlafend: "schlafend",
    schneidend: "schneidend"
};

const dauerHaareSchneiden = 20; // Zeit in ms

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
    Request.get('http://localhost:3000/wartezimmer', function (error, response, body) {
        if (error) {
            throw error;
        }
        // Aktuelle Liste der Personen im Wartezimmer
        console.log(body);

        if (JSON.parse(body).length === 0) {
            // Niemand da --> wir legen uns schlafen
            friseur.status = FriseurStatus.schlafend;
        } else {
            // Jemand im Wartezimmer: wir nehmen den nächsten Kunden ran
            Request.delete('http://localhost:3000/wartezimmer/0', function (error, response, body) {
                if (error) {
                    throw error;
                }
                let kunde = JSON.parse(body);
                console.log('Neuen Kunden gefunden: ' + kunde.kundenId);

                friseur.kunde = kunde.kundenId;
                // nach einiger Zeit geht es weiter bei der Funktion haareFertigGeschnitten
                setTimeout(haareFertigGeschnitten, dauerHaareSchneiden);
            });
        }
    });
}


module.exports = {
    router: router,
    FriseurStatus: FriseurStatus
};
