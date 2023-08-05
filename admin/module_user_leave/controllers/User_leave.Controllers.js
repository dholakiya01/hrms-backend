const knex = require('../../../config/db');
require("dotenv").config();
const joi = require('joi');
const date = require('date-and-time');
const moment = require('moment')
const jwt = require('jsonwebtoken');
let tblleave = 'user_leave'

//create
exports.apply = async (req, res) => {
  try {
    const { start_date, end_date, select_type, reason, user_id } = req.body;

    let validation = { start_date, end_date, select_type, reason };

    let shema = joi.object({
      start_date: joi.date().iso().required(),
      end_date: joi.date().iso().required(),
      select_type: joi.string().required(),
      reason: joi.string().required(),
      // user_id: joi.number().required(),
    });

    let { error, value } = shema.validate(validation)
    if (error) {
      return res.json({
        message: 'validation faild',
        errors: error.details
      });
    };

    const startDate = moment(start_date, 'YYYY-MM-DD');
    const endDate = moment(end_date, 'YYYY-MM-DD');
    const today = moment().startOf('day');

    if (startDate.isBefore(today)) {
      res.status(400).json({
        status: false,
        message: 'Past date is not valid.',
      });
      return;
    }

    if (startDate.isAfter(endDate)) {
      res.status(400).json({
        status: false,
        message: 'End date must be check.',
      });
      return;
    }
    const daysDifference = endDate.diff(startDate, 'days');

    if (daysDifference > 5) {
      res.status(400).json({
        status: false,
        message: 'Maximum leave duration should be 5 days.',
      });
      return;
    }

    let insertdata = {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      total_days: daysDifference,
      select_type,
      reason,
      user_id,
      status: 0, // status 0 mean leave pending..
      cancel_reason: null
    }

    const result = await knex(tblleave).insert(insertdata)
    if (result) {
      res.status(200).json({
        status: true,
        message: 'Leave applied successfully.',
        data: insertdata
      })
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message)
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, select_type, reason } = req.body;

    const validation = { start_date, end_date, select_type, reason };

    const schema = joi.object({
      start_date: joi.date().iso().required(),
      end_date: joi.date().iso().required(),
      select_type: joi.string().required(),
      reason: joi.string().required(),
    });

    const { error, value } = schema.validate(validation);
    if (error) {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.details,
      });
      return;
    }

    const leaveData = await knex(tblleave).where({ id }).first();
    if (!leaveData) {
      res.status(409).json({
        status: false,
        message: 'Data not available',
      });
      return;
    }

    const startDate = moment(start_date, 'YYYY-MM-DD');
    const endDate = moment(end_date, 'YYYY-MM-DD');
    const today = moment().startOf('day');

    if (startDate.isBefore(today)) {
      res.status(400).json({
        status: false,
        message: 'Past date is not valid.',
      });
      return;
    }

    if (startDate.isAfter(endDate)) {
      res.status(400).json({
        status: false,
        message: 'End date must be check.',
      });
      return;
    }
    const daysDifference = endDate.diff(startDate, 'days');

    if (daysDifference > 5) {
      res.status(400).json({
        status: false,
        message: 'Maximum leave duration should be 5 days.',
      });
      return;
    }

    let updatedData = {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      total_days: daysDifference,
      select_type,
      reason,
      updated_at: new Date()
    }
    const result = await knex(tblleave).where({ id }).update(updatedData);
    if (result) {
      res.status(200).json({
        status: true,
        message: 'Updated successfully.',
        data: updatedData,
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'Failed to update data.',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

exports.read = async (req, res) => {
  try {
    const listuser = await knex(tblleave).select('*');

    const formattedUserList = await Promise.all(
      listuser.map(async (userdetail) => {
        let formatdetail = userdetail;
        const array = formatdetail.select_type.split(',');
        const details = await knex
          .select('id', 'name')
          .from('leave_type')
          .whereIn('id', array);
        formatdetail.leave_Detail = details;
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


exports.accept = async (req, res) => {
  try {
    const { id } = req.params;

    const leavedata = await knex(tblleave).where('id', id).select('status').first();

    if (!leavedata) {
      return res.status(409).json({
        status: false,
        message: "leave request is not found"
      })
    }

    if (leavedata.status === "2" || "" || "0") {
      const updateData = {
        status: 1, // status 1 mean leave approve
        cancel_reason: null
      }


      const result = await knex(tblleave).where('id', id).update(updateData);
      if (result) {
        return res.status(200).json({
          status: true,
          message: 'Leave request accepted.',
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: 'Not change.',
      })
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
};

//cancel
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;

    let validation = { cancel_reason };

    let shema = joi.object({
      cancel_reason: joi.string().required(),
    })

    let { error, value } = shema.validate(validation)
    if (error) {
      return res.json({
        message: 'validation faild',
        errors: error.details
      });
    };

    const updateData = {
      status: 2, //status 2 mean leave pending
      cancel_reason,
    };

    const result = await knex(tblleave).where('id', id).update(updateData);
    if (result) {
      res.status(200).json({
        status: true,
        message: 'Leave request cancelled.',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
};

exports.getTokenData = async (req, res, next) => {
  let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  const token = req.headers['authorization'];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log(decoded.userData.id, 'darshan 357');

    const result = await knex(tblleave).where({ user_id: decoded.userData.id }).select();

    const formattedUserList = await Promise.all(
      result.map(async (userdetail) => {
        let formatdetail = userdetail;
        const array = formatdetail.select_type.split(',');
        const details = await knex
          .select('id', 'name')
          .from('leave_type')
          .whereIn('id', array);
          formatdetail.leave_Detail = details;
        return formatdetail;
      })
    )

    if (result.length > 0) {
      res.status(200).json({
        status: true,
        message: 'id get successfully',
        data: result
      })

    } else {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      });
    }

    next();

  } catch (err) {
    res.status(400).send({ status: false, message: "Invalid token.", err: err.message });
  }
};

