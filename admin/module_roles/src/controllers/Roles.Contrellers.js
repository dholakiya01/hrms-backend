const knex = require('../../../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const Joi = require('joi');

//table name
tblroles = 'roles';

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

exports.createrole = async (req, res, next) => {
    try {
        // let capabilitiesTemp = JSON.parse(capabilities);
        const { name, capabilities } = req.body;
        // console.log("ujash 32", name, capabilities, capabilitiesTemp);
        let validationObject = { name, capabilities, }
        let schema = Joi.object({
            name: Joi.string().required(),
            capabilities: Joi.string().required(),
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
            capabilities,
        }
        const existingUser = await knex(tblroles).where({ name: insertData.name }).first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'capabilities already exists'
            });
        }

        let result = [];
        [result] = await knex(tblroles).insert(insertData);
        if (result) {
            res.status(200).json({
                status: true,
                data: {
                    id: result,
                    ...insertData
                },
                message: "Roles created successfully"
            })
        }
        return;
    } catch (error) {
        res.status(400).json(error);
    }
}

exports.rolelist = async (req, res, next) => {
    try {

        const Roleslist = await knex(tblroles).select("*");
        await Promise.all(
            Roleslist.map(async (role) => {
                let formtedate = role;
                formtedate.created_at = dateFormateChange(formtedate.created_at);
                formtedate.updated_at = dateFormateChange(formtedate.updated_at);
                const array = formtedate.capabilities.split(',');
                const details = await knex
                    .select('id', 'name')
                    .from('capabilities')
                    .whereIn('id', array);
                formtedate.capabilities_details = details;
                return formtedate;
            }));
        if (Roleslist) {
            res.status(200).json({
                status: true,
                message: "Roles List",
                data: [...Roleslist]
            });
        }

    } catch (error) {
        res.status(400).json(error);
    }
}

exports.rolepagination = async (req, res) => {
    try {
        const { page = 1, limit = 5, searchterm } = req.body;
        const offset = (page - 1) * limit;

        let query = knex(tblroles)
            .select('*')
            .limit(limit)
            .offset(offset);

        let querycount = knex(tblroles)
            .count('id as totalusercount')
            .first();

        if (searchterm) {
            query = query.where("name", "like", `%${searchterm}%`).orWhere("id", "like", `%${searchterm}%`);
            querycount = querycount.where("name", "like", `%${searchterm}%`).orWhere("id", "like", `%${searchterm}%`);
        }

        let [roles, totaluser] = await Promise.all([query, querycount]);

        const formtedatePromises = roles.map(async (role) => {
            const capabilitiesIds = role.capabilities.split(',');
            const details = await knex
                .select('id', 'name')
                .from('capabilities')
                .whereIn('id', capabilitiesIds);

            return {
                ...role,
                capabilities_details: details
            };
        });

        const formtedate = await Promise.all(formtedatePromises);

        const finaldata = {
            totaluser: totaluser.totalusercount,
            roles: formtedate
        };

        return res.status(200).json(finaldata);
    } catch (err) {
        console.log(err);
        res.status(400).json({
            status: false,
            message: err
        });
    }
};

exports.view = async (req, res) => {
    try {
        const { id } = req.params;
        const Rolesdetails = await knex(tblroles).where({ id: id }).first();
        Rolesdetails.created_at = dateFormateChange(Rolesdetails.created_at);
        Rolesdetails.updated_at = dateFormateChange(Rolesdetails.updated_at);
        const array = Rolesdetails.capabilities.split(',');
        const details = await knex.select('id', 'name')
            .from('capabilities')
            .whereIn('id', array)
        Rolesdetails.capabilities_details = details;
        if (Rolesdetails) {
            res.status(200).json({
                status: true,
                message: "Roles Detali",
                data: Rolesdetails
            });
        }

    } catch (error) {
        res.status(400).json(error);
    }
}

exports.updaterole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capabilities } = req.body;
        let validationObject = { name, capabilities }
        let schema = Joi.object({
            name: Joi.string().required(),
            capabilities: Joi.string().required()
        });
        let { error, value } = schema.validate(validationObject);
        if (error) {
            return res.status(400).json({
                message: "Validate Failed",
                errors: error
            });
        }

        const ifExists = await knex(tblroles)
            .where("id", id).first();
        if (!ifExists) {
            res.status(409);
            res.json({
                status: false,
                message: "Roles Not Found"
            });
            return;
        }
        let UpdatedRoles = {
            name,
            capabilities,
            updated_at: new Date()
        };


        const existingCapability = await knex(tblroles)
            .where('name', name)
            .whereNot('id', id)
            .first();
        if (existingCapability) {
            return res.json({
                status: false,
                message: 'capabilities already exists'
            });
        }


        let result = await knex(tblroles).where({ id }).update(UpdatedRoles);
        if (result) {
            res.json({
                status: true,
                message: "Updated Successfully",
                data: {
                    id: id,
                    name: name,
                    capabilities: capabilities,
                    updated_at: dateFormateChange(UpdatedRoles.updated_at)
                },
            });
        }
        return;
    }
    catch (err) {
        res.status(400).json(err);
    }
}

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const ifExists = await knex(tblroles)
            .where("id", id).first();

        if (!ifExists) {
            res.status(200).json({
                status: false,
                message: "Roles Not Found"
            });
            return;
        }
        let result = await knex(tblroles).where({ id }).del();
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