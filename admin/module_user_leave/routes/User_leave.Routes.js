const express = require('express');
const knex = require('knex');
const jwt = require("jsonwebtoken");
const auth = require('../../../auth');

const router = express.Router();
const user_leave = require('../controllers/User_leave.Controllers');

router.post('/apply', user_leave.apply);
router.put('/update/:id',auth, user_leave.update);
router.get('/read_leave', user_leave.read);
router.put('/accept/:id', user_leave.accept);
router.put('/cancel/:id', user_leave.cancel);
router.get('/gettokendata',auth, user_leave.getTokenData);

module.exports = router