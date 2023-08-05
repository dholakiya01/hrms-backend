const express = require('express');
const token = require('../../../../auth');

const router = express.Router();

const Roles = require('../controllers/Roles.Contrellers');


router.post('/creatroles', token, Roles.createrole);
router.get('/rolelist', Roles.rolelist);
router.post('/rolepagination', Roles.rolepagination);
router.get('/userlist/:id', Roles.view);
router.put('/update/:id', token, Roles.updaterole);
router.delete('/delete/:id', token, Roles.delete);



module.exports = router;