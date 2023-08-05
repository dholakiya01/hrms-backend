const knex = require('../../../config/db');
const joi = require('joi');
const bcrypt = require('bcrypt');
const { query } = require('express');
const saltRounds = 10;
require('dotenv').config;

tblskill = 'skills'


//date formate
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

//create skill
exports.create = async (req, res) => {
    try {
        const { name } = req.body

        let validation = { name };

        let shema = joi.object({
            name: joi.string().required(),
        });

        let { error, value } = shema.validate(validation)
        if (error) {
            return res.json({
                message: 'validation faild',
                errors: error.details
            });
        };
        let insertdata = {
            name,
        };
        const existingUser = await knex(tblskill).where({ name: insertdata.name }).first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'Skill already exists'
            });
        }

        let [result] = await knex(tblskill).insert(insertdata)
        res.json({
            status: true,
            data: {
                id: result,
                ...insertdata,
            },
            message: 'Skills Created successfully'
        })
    }

    catch (err) {
        res.json(err)
        console.log(err)
    }
}

//read skill
exports.read = async (req, res) => {
    try {
        const result = await knex(tblskill).select('*')

        result.map((detail) => {
            let formatdetail = detail;

            formatdetail.created_at = dateFormateChange(formatdetail.created_at)
            formatdetail.updated_at = dateFormateChange(formatdetail.updated_at)

            return formatdetail
        })
        if (result) {
            res.json({
                status: true,
                message: 'list',
                data: result
            })
        }
    }
    catch (err) {
        res.json(err)
        console.log(err)
    }
}

//update skill
exports.update = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        let validation = { name };

        let shema = joi.object({
            name: joi.string().required(),
        });

        let { error, value } = shema.validate(validation)
        if (error) {
            return res.staus(400).json({
                message: 'validation faild',
                errors: error.details
            });
        }

        const ifIdExists = await knex(tblskill)
            .where({ id }).first();

        if (!ifIdExists) {
            res.status(409).json({
                staus: false,
                message: 'Skill not available'
            })
        }
        let updatedata = {
            name,
            updated_at: new Date()
        }

        const existingUser = await knex(tblskill)
            .where('name', name)
            .whereNot('id', id)
            .first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'skill already exists'
            });
        }

        const result = await knex(tblskill).where({ id }).update(updatedata)

        if (result) {
            return res.json({
                status: true,
                message: 'Skill Update Successfully',
                data: {
                    id: id,
                    name: name,
                    updated_at: new Date()
                }
            })
        }
        res.json(result)
    }
    catch (err) {
        res.json({
            status: false,
            message: 'Internal Server Error'
        })
        console.log(err)
    }
}


// view details
exports.viewuser = async (req, res) => {
    try {
        const { id } = req.params;

        const skilllist = await knex(tblskill).where({ id }).first()
        // console.log(skilllist)

        // skilllist.created_at = dateFormateChange(skilllist.created_at)
        // skilllist.updated_at = dateFormateChange(skilllist.updated_at)

        if (skilllist) {
            res.json({
                status: true,
                message: "skill details",
                data: skilllist
            })
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}

//delet skill
exports.remove = async (req, res) => {
    try {
        const { id } = req.params

        const ifIdExists = await knex(tblskill).where({ id }).first()

        if (!ifIdExists) {
            return res.json({
                status: false,
                message: " not found"
            });

        }

        const result = await knex(tblskill).where({ id }).del()

        if (result) {
            return res.json({
                status: true,
                message: 'Delete successfully',
                data: id,
            });
        } else {
            return res.status(500).json({
                status: false,
                message: "Faild delete Data",
            });
        }
    }
    catch (err) {
        console.log(err)
        return res.json({
            status: false,
            message: 'data not found'
        })
    }
}

//Pagination 

exports.pagination = async (req, res) => {
    try {
        const { page = 1, limit = 5, searchterm } = req.body

        const offset = (page - 1) * limit

        let query = knex(tblskill)
            .select('*')
            .limit(limit)
            .offset(offset)
        // .count("skills as totalusercount")

        let querycount = knex(tblskill)
            .count('id as totalusercount')
            .first()

        if (searchterm) {
            query = query.where("name", "like", `%${searchterm}%`)
                .orWhere("id", "like", `%${searchterm}%`)

            querycount = querycount.where("name", "like", `%${searchterm}%`)
                .orWhere("id", "like", `%${searchterm}%`)
            // console.log(query, "278")
        }

        let [skills, totaluser] = await Promise.all([query, querycount]);
        const finaldata = {
            totaluser: totaluser.totalusercount,
            skills: skills
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

