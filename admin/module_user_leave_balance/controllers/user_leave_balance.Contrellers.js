const knex = require("../../../config/db");
require('dotenv').config();
const joi = require('joi');

let tblleave = 'leave_availability';

exports.available = async (req, res) => {
    try {
        const { id } = req.query;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;

        const result = await knex(tblleave)
            .count('id as leaves_taken')
            .where({ user_id: id })
            .whereRaw('MONTH(date) = ?', [currentMonth]);

        const leavesTaken = result[0].leaves_taken || 0;
        const availableBalance = 12 - leavesTaken;

        res.json({
            user_id: id,
            leaves_taken: leavesTaken,
            available_balance: availableBalance
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: 'Failed to retrieve leave availability.',
            error: error.message,
        });
    }
};
