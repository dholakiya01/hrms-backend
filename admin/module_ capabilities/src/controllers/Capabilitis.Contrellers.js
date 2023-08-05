const knex = require('../../../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const Joi = require('joi');
const { stringify } = require('querystring');


//table name
tblcapabilities = 'capabilities';

// date format 02/19/23
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

exports.creatcapabilities = async (req, res, next) => {
    try {

        const { name, order_by } = req.body;
        let validationObject = { name, order_by }
        let schema = Joi.object({
            name: Joi.string().required(),
            order_by: Joi.number().required()
        });

        let { error, value } = schema.validate(validationObject);
        if (error) {
            return res.status(400).json({
                message: "Validate Failed",
                errors: error
            })
        }
        let insertData = {
            name,
            order_by
        }

        const existingUser = await knex(tblcapabilities).where({ name: insertData.name }).first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'Name already exists'
            });

        }

        let result = [];
        [result] = await knex(tblcapabilities).insert(insertData);
        if (result) {
            res.status(200).json({
                status: true,
                data: {
                    id: result,
                    ...insertData
                },
                message: "Capabilities Created Successfully"
            });
        }
        return;
    } catch (error) {
        res.status(400).json(error);
    }
}

exports.capabilitieslist = async (req, res, next) => {
    try {

        const capabilitieslist = await knex(tblcapabilities).select("*");

        capabilitieslist.map((role) => {
            let formtedate = role;
            formtedate.created_at = dateFormateChange(formtedate.created_at);
            formtedate.updated_at = dateFormateChange(formtedate.updated_at);
            return formtedate;
        });
        if (capabilitieslist) {
            res.status(200).json({
                status: true,
                message: "Capabilities List",
                data: [...capabilitieslist]
            });
        }

    } catch (error) {
        res.status(400).json(error);
    }
}

exports.cappagination = async (req, res) => {
    try {
        const { page = 1, limit = 5, searchterm } = req.body
        const offset = (page - 1) * limit
        let query = knex(tblcapabilities)
            .select('*')
            .limit(limit)
            .offset(offset)

        let querycount = knex(tblcapabilities)
            .count('id as totalusercount')
            .first()
        if (searchterm) {
            query = query.where("name", "like", `%${searchterm}%`).orWhere("id", "like", `%${searchterm}%`)
            querycount = querycount.where("name", "like", `%${searchterm}%`).orWhere("id", "like", `%${searchterm}%`)
            // console.log(query, "278")
        }
        let [capabilities, totaluser] = await Promise.all([query, querycount]);
        const finaldata = {
            totaluser: totaluser.totalusercount,
            capabilities: capabilities
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

exports.capabilitiesupdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, order_by } = req.body;

        let validationObject = { name, order_by }
        let schema = Joi.object({
            name: Joi.string().required(),
            order_by: Joi.number().required()
        });
        let { error, value } = schema.validate(validationObject);
        if (error) {
            return res.status(400).json({
                message: "Validate Failed",
                errors: error
            });
        }

        const ifExists = await knex(tblcapabilities)
            .where("id", id).first();

        if (!ifExists) {
            res.status(200).json({
                status: false,
                message: "Capabilities Not Found"
            });
            return;
        }

        let capabilitiesupdate = {
            name,
            order_by,
            updated_at: new Date()
        };

        const existingCapability = await knex(tblcapabilities)
            .where('name', name)
            .whereNot('id', id)
            .first();
        if (existingCapability) {
            return res.json({
                status: false,
                message: 'Name already exists'
            });
        }

        let result = await knex(tblcapabilities).where({ id }).update(capabilitiesupdate);

        if (result) {
            res.json({
                status: true,
                message: "Updated Successfully",
                data: {
                    id: id,
                    name: name,
                    order_by: order_by,
                    updated_at: dateFormateChange(capabilitiesupdate.updated_at)
                },
            });
        }
        return;
    }
    catch (err) {
        res.status(400).json(err);
    }
}

exports.capabilitiesdelete = async (req, res) => {
    try {
        const { id } = req.params;

        const ifExists = await knex(tblcapabilities)
            .where("id", id).first();

        if (!ifExists) {
            res.status(200).json({
                status: false,
                message: "Capabilities Not Found"
            });
            return;
        }
        let result = await knex(tblcapabilities).where({ id }).del();
        if (result) {
            res.json({
                status: true,
                message: "Delete Successfully",
                data: {
                    id: id,
                },
            });
        }
    }
    catch (err) {
        res.status(400).json(err);
    }
}

exports.capabilitiesview = async (req, res) => {
    try {
        const { id } = req.params
        const ifidexists = await knex(tblcapabilities)
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
        const userslist = await knex(tblcapabilities).where({ id: id }).first();

        if (userslist) {
            res.json({
                status: true,
                message: "User Found",
                data: userslist
            });
        }
    } catch (err) {
        res.status(400).json(err);
    }
}