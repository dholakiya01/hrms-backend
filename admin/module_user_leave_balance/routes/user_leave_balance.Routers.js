const express = require('express');
const jwt = require("jsonwebtoken");

const router = express.Router();
const Days = require('../controllers/user_leave_balance.Contrellers');

router.post('/available',Days.available);

module.exports = router
