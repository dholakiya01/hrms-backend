const express = require('express');
const token = require('../../../../auth');

const router = express.Router();

const Attendance = require('../controllers/Attendance.Controllers');

router.post('/Checkin', Attendance.Checkin);
router.put('/Checkout/:id', Attendance.Checkout);
router.get('/Userlist', Attendance.userlist);
router.get('/time/:user_id', Attendance.time);
router.get('/getAttendanceLogs/:user_id/:month/:year',token, Attendance.getAttendanceLogs);

module.exports = router; 