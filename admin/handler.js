const express = require('express');
require ("dotenv").config();
const cors = require('cors');



const app = express();
app.use(cors());


const login = require('./module_auth/src/routes/Login.Routes');
const userRoute = require('./module_user/src/routes/User.Routes');
const skillRoute = require('./module_skill/routes/Skill.Routes');

const RoleRoutes = require('./module_roles/src/routes/Roles.Routes');
const CapabilitiesRoutes = require('./module_ capabilities/src/routes/Capabilitis.Routes');
const Attendance = require('../admin/module_ attendance/src/routes/Attendance.Routes');
const Leaves = require('./module_leave_type/routes/Leaves_type.Routes');
const user_leave = require('../admin/module_user_leave/routes/User_leave.Routes');
// const Leaveday = require('./module_leave_availability/routes/Availability.Routers');

app.use(express.json());
// app.use(express.static('public'))s
// app.use('/update', express.static('uploads/user-profile'));

app.use("/login",login)
app.use("/user",userRoute)
app.use("/skill",skillRoute)
app.use("/roles",RoleRoutes)
app.use("/capabilities",CapabilitiesRoutes)
app.use("/attendance",Attendance)
app.use("/leaves",Leaves)
app.use("/user_leave",user_leave)
// app.use("/leave",Leaveday)



module.exports = app;