const knex = require('../../../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();

//tablename 
 tbluser = 'users'


exports.hrmslogin = async (email, password) => {
  try {

    // const {first_name, password} = req.body;
    const user = await knex(tbluser)
      // .where("first_name", "like", `%${first_name}%`)
      .where("email", "like", `%${email}%`)
      .first();
    console.log("uajsh 18",user);
    if (!user) {
      throw new Error('User Not Found');
    }
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      throw new Error('Invalid password');
    } else {
      let jwtSecretKey = process.env.JWT_SECRET_KEY;

      let data = {
        time: Date(),
        userData: user,
      }

      const token = jwt.sign(data, jwtSecretKey);

      return { message: 'Login Successful', token: token, UserId: user.id };
    }
  } catch (err) {

    throw err;
  }
}

exports.view = async (req, res) => {
  try {
    const { id } = req.params

    const ifidexists = await knex(tbluser)
      .where("id", id)
      .first();

    if (!ifidexists) {
      res.status(409)
      res.json({
        status: false,
        message: 'User Not Found'
      })
      return;
    }
    const userslist = await knex(tbluser).where({ id: id }).first();

    if (userslist) {
      res.json({
        status: true,
        message: "User Login Successful",
        data: userslist
      });
    }

  } catch (err) {
    res.status(400).json(err);
  }
}