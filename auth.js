require("dotenv").config();
const jwt = require("jsonwebtoken");


const verifyUserToken = (req, res, next) => {
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const token = req.headers['authorization'];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log("ujash 23", decoded);
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(400).send({status: false, message: "Invalid token.", err});
    }
  };

module.exports = verifyUserToken;