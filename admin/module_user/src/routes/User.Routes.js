const express = require('express');
const knex = require('knex');
const jwt = require("jsonwebtoken");
const auth = require('../../../../auth');

const router = express.Router();
const User = require('../../src/controller/User.Controller');
const image = require('../../middleware/User-image')


router.post('/createuser', auth,
    image.upload.single('image'),
    User.createuser,);
router.get('/read', User.readuser);
router.get('/view/:id', User.viewuser);
router.put('/update/:id', auth, image.upload.single('image'), User.updateuser)
router.delete('/delete/:id', auth, User.removeuser)
router.post('/pages', User.UserPage);
router.delete('/remove/:id/image', User.removeimage);

module.exports = router
