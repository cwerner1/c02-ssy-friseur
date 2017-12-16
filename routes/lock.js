const express = require('express');
const router = express.Router();

// Status des Locks: true ... Lock aktiv/besetzt; false ... Lock frei
let lock = false;

router.get('/', readLock);

// Aktuellen Status ausgeben
function readLock(req, res) {
    res.json(lock);
}

// PUT-Route (PUT, weil Status aktualisiert wird)
router.put('/', updateLock);

function updateLock(request, response) {
    // Parameter auslesen
    let newstate = request.body.lockValue;

    // False -> True // True -> False
    if (newstate !== lock) {
        lock = newstate;
        console.log("Lock-Update: " + lock);
        response.json("success");
    }
    // False -> False // True -> True
    else {
        console.log("Fehler bei Lock-Update");
        response.json("error");
    }
}

module.exports = router;
