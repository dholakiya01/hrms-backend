const knex = require('../../../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const Joi = require('joi');
const moment = require('moment');

tblattenndance = 'user_attendance';

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

exports.userlist = async (req, res, next) => {
  try {
    const user_id = req.params.user_id;

    const currentDate = new Date().toISOString().split('T')[0];

    const attendanceData = await knex("user_attendance")
      .whereRaw(`DATE(checkin_datetime) = ?`, [currentDate])
      .select(knex.raw('GROUP_CONCAT(id) AS id'))
      .select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(total_duration_hours))) AS totalDuration'))
      .select(knex.raw('MIN(checkin_datetime) AS firstCheckin'))
      .select(knex.raw('MAX(checkout_datetime) AS lastCheckout'));

    if (!attendanceData || attendanceData.length === 0) {
      throw new Error('No attendance data found.');
    }

    const firstAttendance = attendanceData[0];
    const id = firstAttendance.id || '';
    const totalDuration = firstAttendance.totalDuration || '00:00:00';
    const firstCheckin = firstAttendance.firstCheckin || null;
    const lastCheckout = firstAttendance.lastCheckout || null;

    let grosshours = null;
    if (firstCheckin && lastCheckout) {
      const diffMilliseconds = new Date(lastCheckout) - new Date(firstCheckin);
      const diffSeconds = Math.floor(diffMilliseconds / 1000);
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      grosshours = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    res.status(200).json({
      status: true,
      message: "User List Attendance Logs",
      data: {
        id,
        totalDuration,
        grosshours,
      }
    });

  } catch (error) {
    res.status(500).json({ error: error });
  }
};

exports.Checkin = async (req, res, next) => {
  try {
    const { checkin_datetime, user_id } = req.body;

    const user = await knex('users').where({ id: user_id }).first();

    if (!user || !user_id) {
      res.status(400).json({
        status: false,
        message: "User Not Found"
      });
      return;
    }

    const checkinDateTime = new Date();

    let insertData = {
      user_id,
      checkin_datetime: checkinDateTime,
      auto_checkout_datetime: null,
    };


    const [checkinId] = await knex('user_attendance').insert(insertData, 'id');

    if (checkinId) {
      const autoCheckoutTime = new Date(checkin_datetime);
      autoCheckoutTime.setHours(autoCheckoutTime.getHours() + 8);

      const timeout = autoCheckoutTime - Date.now();
      setTimeout(async () => {
        const updatedRows = await knex('user_attendance')
          .where({ id: checkinId })
          .update({ auto_checkout_datetime: autoCheckoutTime });

        if (updatedRows) {
          console.log('Auto-checkout successful');
        } else {
          console.log('Auto-checkout failed');
        }
      }, timeout);

      res.status(200).json({
        status: true,
        data: {
          id: checkinId,
          ...insertData,
          auto_checkout_datetime: autoCheckoutTime,
        },
        message: "Check-in Created Successfully"
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Failed to create check-in"
      });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.Checkout = async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceRecord = await knex('user_attendance')
      .where("id", id)
      .first();

    if (!attendanceRecord) {
      res.status(200).json({
        status: false,
        message: "Check-in Not Found"
      });
      return;
    }
    const checkoutDateTime = new Date();

    const checkinDatetime = attendanceRecord.checkin_datetime;
    const totalDurationHours = calculateDurationHours(checkinDatetime, checkoutDateTime);

    let updateData = {
      checkout_datetime: checkoutDateTime,
      total_duration_hours: totalDurationHours,
      updated_at: new Date()
    };

    const result = await knex('user_attendance')
      .where({ id })
      .update(updateData);

    if (result) {
      res.json({
        status: true,
        message: "Checkout Updated Successfully",
        data: {
          id: id,
          checkout_datetime: checkoutDateTime,
          total_duration_hours: totalDurationHours,
          updated_at: dateFormateChange(updateData.updated_at)
        },
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Failed to update checkout"
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

function calculateDurationHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const durationMillis = endDate - startDate;
  const durationSeconds = Math.floor(durationMillis / 1000) % 60;
  const durationMinutes = Math.floor(durationMillis / (1000 * 60)) % 60;
  const durationHours = Math.floor(durationMillis / (1000 * 60 * 60));

  const formattedDuration = `${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;

  return formattedDuration;
}

exports.time = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const currentDate = new Date().toISOString().split('T')[0];

    const attendanceData = await knex('user_attendance')
      .whereRaw(`user_id = ? AND DATE(checkin_datetime) = ?`, [user_id, currentDate])
      .select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(total_duration_hours))) AS totalDuration'))
      .select(knex.raw('MIN(checkin_datetime) AS firstCheckin'))
      .select(knex.raw('MAX(checkout_datetime) AS lastCheckout'));

    if (!attendanceData || attendanceData.length === 0) {
      throw new Error('No attendance data found.');
    }

    const firstAttendance = attendanceData[0];

    const totalDuration = firstAttendance.totalDuration || '00:00:00';
    const firstCheckin = firstAttendance.firstCheckin || null;
    const lastCheckout = firstAttendance.lastCheckout || null;

    let grosshours = null;
    if (firstCheckin && lastCheckout) {
      const diffMilliseconds = new Date(lastCheckout) - new Date(firstCheckin);
      const diffSeconds = Math.floor(diffMilliseconds / 1000);
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      grosshours = moment().hours(hours).minutes(minutes).seconds(seconds).format('HH:mm:ss');
    }

    res.status(200).json({
      status: true,
      message: 'User Attendance Logs',
      data: {
        totalDuration,
        grosshours,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceLogs = async (req, res, next) => {
  try {
    const { user_id, month, year } = req.params;

    const officeData = await knex('company_settings')
      .select('data_value')
      .where('data_key', 'office_start_time')
      .first();

    const officeStartTime = officeData.data_value;

    const officeStartMoment = moment(officeStartTime, 'HH:mm:ss');

    const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').toDate();
    const endDate = moment(startDate).endOf('month').toDate();

    const attendanceData = await knex('user_attendance')
      .select(knex.raw('DATE_FORMAT(checkin_datetime, "%D-%m-%y") AS date'))
      .select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(total_duration_hours))) AS totalDuration'))
      .select(knex.raw('MIN(checkin_datetime) AS firstCheckin'))
      .select(knex.raw('MAX(checkout_datetime) AS lastCheckout'))
      .where('user_id', user_id)
      .where(function () {
        this.whereBetween('checkin_datetime', [startDate, endDate])
          .orWhereBetween('checkout_datetime', [startDate, endDate])
          .orWhere(function () {
            this.where('checkin_datetime', '<', startDate)
              .andWhere('checkout_datetime', '>', endDate);
          });
      })
      .groupByRaw('DATE_FORMAT(checkin_datetime, "%D-%m-%y")')
      .orderByRaw('DATE_FORMAT(checkin_datetime, "%D-%m-%y") DESC');

    const attendanceLogs = attendanceData.map((data) => {
      let arrivalStatus = '';
      const firstCheckin = data.firstCheckin || null;
      const lastCheckout = data.lastCheckout || null;
      let grossHours = null;
      let lateness = null;

      if (firstCheckin && lastCheckout) {
        const diffMilliseconds = new Date(lastCheckout) - new Date(firstCheckin);
        const diffSeconds = Math.floor(diffMilliseconds / 1000);
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        grossHours = moment().hours(hours).minutes(minutes).seconds(seconds).format('HH:mm:ss');

        const checkinTime = moment(firstCheckin);
        const difference = checkinTime.diff(officeStartMoment);

        if (difference > 0) {
          const duration = moment.duration(difference);
          const latenessHours = duration.hours().toString().padStart(2, '0');
          const latenessMinutes = duration.minutes().toString().padStart(2, '0');
          const latenessSeconds = duration.seconds().toString().padStart(2, '0');
          lateness = `${latenessHours}:${latenessMinutes}:${latenessSeconds} `;
          arrivalStatus = 'Late';
        } else {
          const duration = moment.duration(-difference);
          const earlyHours = duration.hours().toString().padStart(2, '0');
          const earlyMinutes = duration.minutes().toString().padStart(2, '0');
          const earlySeconds = duration.seconds().toString().padStart(2, '0');
          lateness = `${earlyHours}:${earlyMinutes}:${earlySeconds}  `;
          arrivalStatus = 'Early';
        }
      }

      const totalDuration = data.totalDuration ? data.totalDuration : '00:00:00';
      const formattedDate = moment(data.date, 'DD-MM-YY').format('DD MMMM YYYY');

      return {
        formattedDate,
        totalDuration,
        grossHours,
        arrival: {
          time: lateness,
          status: arrivalStatus,
        }
      };
    });

    res.status(200).json({
      status: true,
      message: 'User Attendance Logs',
      data: attendanceLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};










