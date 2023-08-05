const express = require('express');
const token = require('../../../../auth');

const router = express.Router();


const Capabilities = require('../controllers/Capabilitis.Contrellers');


router.post('/creatcapabilities', token, Capabilities.creatcapabilities);
router.get('/capabilitieslist', Capabilities.capabilitieslist);
router.post('/cappagination', Capabilities.cappagination);
router.put('/capabilitiesupdate/:id', token, Capabilities.capabilitiesupdate);
router.delete('/capabilitiesdelete/:id', token, Capabilities.capabilitiesdelete);
router.get('/capabilitiesview/:id',  Capabilities.capabilitiesview);



module.exports = router; 