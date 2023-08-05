const skill = require('../controllers/Skill.Controllers')
const express = require('express')
const app = express();
const jwt = require('jsonwebtoken')
const router = express.Router();
const auth = require('../../../auth')
require('dotenv').config


router.post('/create', auth, skill.create)
router.get('/read', skill.read)
router.get('/view/:id', skill.viewuser)
router.put('/update/:id', auth, skill.update)
router.delete('/remove/:id', auth, skill.remove);
router.post('/pages', skill.pagination);

module.exports = router