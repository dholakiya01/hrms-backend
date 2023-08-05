const knex = require('../../../../config/db')
const joi = require('joi')
const saltRounds = 10;
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcrypt')
require("dotenv").config();


// table name
tbluser = 'users';


// date format
function dateFormateChange(value) {
    const dateAsNumber = Date.parse(value);
    const dateOptions = {
        month: "numeric",
        day: "numeric",
        year: "numeric",
    }
    let newDateString = new Date(dateAsNumber).toLocaleDateString("us-en", dateOptions);
    let dateInfoList = newDateString.split('/');
    let monthValue = parseInt(dateInfoList[1]) < 10 ? '0' + parseInt(dateInfoList[1]) : parseInt(dateInfoList[1]);
    let dateValue = parseInt(dateInfoList[0]) < 10 ? '0' + parseInt(dateInfoList[0]) : parseInt(dateInfoList[0]);
    let yearValue = parseInt(dateInfoList[2]) < 10 ? '0' + parseInt(dateInfoList[2]) : parseInt(dateInfoList[2]);
    return monthValue + '-' + dateValue + '-' + yearValue;
}

// create user
exports.createuser = async (req, res, next) => {
    try {
        const { first_name, last_name, email, skills, password } = req.body;
        // const image = req.file.path;
        const image = (req.file && req.file.path) ? req.file.path : "";
        console.log(image, "create")

        let validation = { first_name, last_name, email, password, skills };

        let shema = joi.object({
            first_name: joi.string().required(),
            last_name: joi.string().required(),
            email: joi.string().required(),
            skills: joi.string().required(),
            password: joi.string().required(),
        });

        let { error, value } = shema.validate(validation)
        if (error) {
            return res.json({
                message: 'validation faild',
                errors: error
            })
        }

        let hashvalue = await bcrypt.genSalt(saltRounds)
            .then(salt => {
                return bcrypt.hash(password, salt)
                    .then(hash => {
                        return hash
                    })
            });

        let insertdata = {
            image,
            first_name,
            last_name,
            email,
            skills,
            password: hashvalue
        }
        // console.log(image,"image 72")

        const existingUser = await knex(tbluser).where({ email: insertdata.email }).first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'User already exists'
            });
        }

        let results = [];
        [results] = await knex(tbluser).insert(insertdata);
        if (results) {
            res.status(200).json({
                status: true,
                data: {
                    id: results,
                    ...insertdata
                },
                message: 'User Create successfully'
            })
        }
        console.log(results, "result 94")
    }

    catch (error) {
        console.log(error);
        res.status(400).json(error)
    }

}


exports.readuser = async (req, res) => {
    try {
        const listuser = await knex(tbluser).select('*');

        const formattedUserList = await Promise.all(
            listuser.map(async (userdetail) => {
                let formatdetail = userdetail;

                formatdetail.created_at = dateFormateChange(formatdetail.created_at);
                formatdetail.updated_at = dateFormateChange(formatdetail.updated_at);
                const array = formatdetail.skills.split(',');
                const details = await knex
                    .select('id', 'name')
                    .from('skills')
                    .whereIn('id', array);
                formatdetail.skill_details = details;
                //   console.log(formatdetail,"144 back");

                return formatdetail;
            })
        );

        return res.json({
            status: true,
            message: "User list",
            data: formattedUserList
        });
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
};

// view details

exports.viewuser = async (req, res) => {
    try {
        const { id } = req.params;

        const userlist = await knex(tbluser).where({ id }).first()

        userlist.created_at = dateFormateChange(userlist.created_at)
        userlist.updated_at = dateFormateChange(userlist.updated_at)
        const array = userlist.skills.split(',');
        const details = await knex.select('id', 'name')
            .from('skills').whereIn('id', array)
        userlist.skill_details = details;
        console.log(details, "144 back")

        if (userlist) {
            res.json({
                status: true,
                message: "user details",
                data: userlist
            })
        }
        else {
            res.json({
                status: false,
                message: "User not found"
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}

// update user

exports.updateuser = async (req, res) => {
    try {
        const { id } = req.params;

        const { first_name, last_name, email, skills, password } = req.body
        // let image = req.file.path;
        const image = (req.file && req.file.path) ? req.file.path : "";
        console.log(image, "update")

        let validation = { first_name, last_name, email, skills, password };

        let shema = joi.object({
            first_name: joi.string().required(),
            last_name: joi.string().required(),
            email: joi.string().required(),
            skills: joi.string().min(1).required(),
            password: joi.string().required(),
        });

        let { error, value } = shema.validate(validation)
        if (error) {
            return res.staus(400).json({
                message: 'validation faild',
                errors: error
            })
        }

        const ifIdExists = await knex(tbluser)
            .where("id", id).first();

        if (!ifIdExists) {
            res.status(409);
            res.json({
                staus: false,
                message: 'User not available'
            })
            return;
        }

        let hashvalue = await bcrypt.genSalt(saltRounds)
            .then(async salt => {
                const hash = await bcrypt.hash(password, salt);
                return hash;
            });
            let updatedata = {
                first_name,
                last_name,
                email,
                skills,
                password: hashvalue,
                updated_at: new Date()
              };
              
              if (image) {
                updatedata.image = image;
                console.log(image)
              } else{
               null
              }
              
        const existingUser = await knex(tbluser)
            .where('email', email)
            .whereNot('id', id)
            .first();
            
        if (existingUser) {
            return res.json({
                status: false,
                message: 'User already exists'
            });
        }
        const result = await knex(tbluser).where({ id }).update(updatedata)

        if (result) {
            res.json({
                status: true,
                message: 'User Update Successfully',
                data: {
                    id: id,
                    image: image,
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    skills,
                    password: hashvalue,
                    updated_at: new Date()
                }
            })
            console.log(image,"272")
        }

    }
    catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}

// delete user

exports.removeuser = async (req, res) => {
    try {
        const { id } = req.params;

        const ifIdExists = await knex(tbluser)
            .where("id", id).first();

        if (!ifIdExists) {
            res.json(409);
            res.json({
                staus: false,
                message: 'user not found'
            })
            return;
        }

        const result = await knex(tbluser).where({ id: id }).del()

        if (result) {
            res.json({
                staus: true,
                message: 'user delete successfully',
                data: { id: id }
            })
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}

//delete image
exports.removeimage = async (req, res) => {
    try {
      const { id } = req.params;
  
      const ifIdExists = await knex(tbluser)
        .where("id", id)
        .first();
  
      if (!ifIdExists) {
        res.status(409).json({
          status: false,
          message: 'User not found'
        });
        return;
      }
      const result = await knex(tbluser)
        .where({ id: id })
        .update({ image: null });
  
      if (result) {
        res.json({
          status: true,
          message: 'User image removed successfully',
          data: { id: id }
        });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  };
  
// Pagination

exports.UserPage = async (req, res) => {
    try {
        const { page = 1, limit = 5, searchterm } = req.body
        const offset = (page - 1) * limit

        let query = knex(tbluser)
            .select('*')
            .limit(limit)
            .offset(offset)

        let querycount = knex(tbluser)
            .count('id as totalusercount')
            .first()

        if (searchterm) {
            query = query.where("first_name", "like", `%${searchterm}%`)
                .orWhere("last_name", "like", `%${searchterm}%`)
                .orWhere("email", "like", `%${searchterm}%`)
                .orWhere('skills', '=', searchterm)
                .orWhere("skills", "like", `%,${searchterm},%`)
                .orWhere("skills", "like", `%,${searchterm}%`)
            // .orWhere("skills", "like", `%${searchterm},%`)

            // .orWhereIn('skills', [searchterm ==])

            querycount = querycount.where("first_name", "like", `%${searchterm}%`)
                .orWhere("last_name", "like", `%${searchterm}%`)
                .orWhere("email", "like", `%${searchterm}%`)
                .orWhere('skills', '=', searchterm)
                .orWhere("skills", "like", `%,${searchterm},%`)
                .orWhere("skills", "like", `%,${searchterm}%`)
                .orWhere("skills", "like", `%${searchterm},%`)
            // knex.whereRaw("JSON_CONTAINS(skills, ?)", `%${JSON.stringify(searchterm)}%`)
        }

        let [users, totaluser] = await Promise.all([query, querycount]);

        const formattedUserlist = await Promise.all(
            users.map(async (userdetail) => {

                let formatdetail = userdetail.skills.split(',');
                // console.log(formatdetail, "detail 367")
                const details = await knex.select("id", "name").from('skills')
                    .whereIn('id', formatdetail);
                userdetail.skill_details = details;
                // console.log(userdetail, "details 373")
                return userdetail;
            })
        );

        const finaldata = {
            totaluser: totaluser.totalusercount,
            formdate: formattedUserlist
        }
        return res.status(200).json(finaldata)
    }
    catch (err) {
        console.log(err)
        res.status(400).json({
            status: false,
            message: err
        })
    }
}