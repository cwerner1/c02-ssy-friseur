const express = require('express');
const router = express.Router();

// Status des Locks: true ... Lock aktiv/besetzt; false ... Lock frei
let lock = false;

router.get('/', readLock);

// Aktuellen Status ausgeben
function readLock(req, res) {
    res.json(lock);
}

module.exports = router;
