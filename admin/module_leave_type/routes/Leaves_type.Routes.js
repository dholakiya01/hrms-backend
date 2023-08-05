const express = require('express');
const auth = require('../../../auth');
const router = express.Router();
const Leaves = require('../controllers/Leaves_type.Contrellers')

router.post('/create', auth, Leaves.create)
router.get('/read', Leaves.read)
router.put('/update/:id', auth, Leaves.update)
router.delete('/remove/:id', auth, Leaves.remove)
router.get('/view/:id',Leaves.viewleave)
router.post('/pages', Leaves.pagination);

module.exports = router