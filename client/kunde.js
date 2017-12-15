const Request = require('request');
const FriseurStatus = require('../routes/friseur').FriseurStatus;

const hostUrl = "http://den.xmp.net:3000";

// Wir erzeugen eine zufällige Kunden-ID bzw. holen uns die aus der Kommandozeile
let kundenId = process.argv.length < 3 ? 'kunde-' + Math.round(Math.random()*5000) : process.argv[2];

console.log("Meine Kunden-ID ist " + kundenId);

// Wir schauen uns an, was der Friseur macht
Request.get(hostUrl + '/friseur', function (error, response, body) {
    if (error) {
        throw error;
    }
    // DEBUG-Ausgabe des Friseurs
    console.log(body);
    let friseur = JSON.parse(body);

    if (friseur.status === FriseurStatus.schlafend) {
        friseurAufwecken(friseur);
    } else if (friseur.status === FriseurStatus.schneidend) {
        setTimeout(insWartezimmerGehen, 200);
    } else {
        throw (new Error("unbekannter Friseur-Status"));
    }
});

function friseurAufwecken(friseur) {

    let antwortVomAufwecken = function(error, response, body) {
        console.log(body);
    };

    friseur.status = FriseurStatus.schneidend;
    friseur.kunde = kundenId;
    Request.post({
            url: hostUrl + '/friseur',
            json: friseur
        }, antwortVomAufwecken
    );
}

function insWartezimmerGehen() {

    let antwortVomWartezimmer = function (error, response, body) {
        console.log(body);
    };

    Request.post({
            url: hostUrl + '/wartezimmer',
            json: { kundenId: kundenId }
        }, antwortVomWartezimmer
    );
}