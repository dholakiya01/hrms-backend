const knex = require('../../../config/db');
require("dotenv").config();
const joi = require('joi');

const tblleave = 'leave_type';

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        const type = {
            name,
        };
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

        const existingUser = await knex(tblleave).where({ name: type.name }).first();
        if (existingUser) {
            return res.json({
                status: false,
                message: 'leave already exists'
            });
        }

        const leaveId = await knex(tblleave).insert(type);

        if (leaveId) {
            res.status(200).json({
                status: true,
                message: 'Leave create successfully',
                data: type
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'Failed to create leave'
            });
        }
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};

exports.read = async (req, res) => {
    try {
        const { searchterm } = req.body

        let query = knex(tblleave).select('*')

        if (searchterm) {
            query = query.where("name", "like", `%${searchterm}%`)
        }
        const result = await query
        if (result) {
            res.status(200).json({
                status: true,
                data: result
            })
        }

    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
}
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

        const ifIdExists = await knex(tblleave)
            .where({ id }).first();

        if (!ifIdExists) {
            res.status(409).json({
                staus: false,
                message: ' Not found'
            })
        };
        const existingUser = await knex(tblleave)
            .where('name', name)
            .whereNot('id', id)
            .first();

        if (existingUser) {
            return res.json({
                status: false,
                message: 'data already exists'
            });
        }

        let updatedata = {
            name,
            updated_at: new Date()
        }

        const result = await knex(tblleave).where({ id }).update(updatedata)
        if (result) {
            return res.status(200).json({
                status: true,
                message: 'Update Successfully',
                data: {
                    id: id,
                    name: name,
                    updated_at: new Date()
                }
            })
        }

    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params

        const ifIdExists = await knex(tblleave).where({ id }).first()

        if (!ifIdExists) {
            return res.json({
                status: false,
                message: " not found"
            });
        }

        const result = await knex(tblleave).where({ id }).del()
        if (result) {
            return res.status(200).json({
                status: true,
                message: 'Leave deleted successfully.',
                data: result
            })
        }

    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
}
exports.viewleave = async (req, res) => {
    try {
        const { id } = req.params;

        const leavrlist = await knex(tblleave).where({ id }).first()

        if (leavrlist) {
            res.json({
                status: true,
                message: "leave details",
                data: leavrlist
            })
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
};

exports.pagination = async (req, res) => {
    try {
        const { page = 1, limit = 5, searchterm } = req.body

        const offset = (page - 1) * limit

        let query = knex(tblleave)
            .select('*')
            .limit(limit)
            .offset(offset)
        // .count("skills as totalusercount")

        let querycount = knex(tblleave)
            .count('id as totalusercount')
            .first()

        if (searchterm) {
            query = query.where("name", "like", `%${searchterm}%`)
                .orWhere("id", "like", `%${searchterm}%`)

            querycount = querycount.where("name", "like", `%${searchterm}%`)
                .orWhere("id", "like", `%${searchterm}%`)
            // console.log(query, "278")
        }

        let [leave_type, totaluser] = await Promise.all([query, querycount]);
        const finaldata = {
            totaluser: totaluser.totalusercount,
            leave_type: leave_type
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