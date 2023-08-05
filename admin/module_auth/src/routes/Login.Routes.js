const express = require('express');
const knex = require('knex');
const jwt = require("jsonwebtoken");
const router = express.Router();
const app = express();
const hashedPassword = '$2b$10$V7ZUhYwQBlWzjx/NxlyxKObJnmsCK9XWdGtL1RlOZtvYd70m7rmDu';
const jwtkey = 'e-user';
// const saltRounds = 10
// const verifyUserToken = require('../../../../auth');

require("dotenv").config();

const Login = require('../controllers/Login.Controllers');


router.post("/loginapi", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body, "20")
        const result = await Login.hrmslogin(email, password);
        res.status(200).json(result);
    }
    catch (err) {
        
        console.log("mayal 25 ", err.message)
        res.status(401).json({ message: err.message });

    }
});


router.get('/userlist/:id', Login.view);


module.exports = router;