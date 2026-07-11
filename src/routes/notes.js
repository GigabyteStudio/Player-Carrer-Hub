const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('notes', {
        title: 'Anotações'
    });
});

module.exports = router;