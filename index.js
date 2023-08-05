const express = require('express');
var cors = require('cors')
const app = express();
var bodyParser = require('body-parser');
const admin = require('../hrms-backend/admin/handler');


app.use(cors());
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(admin);
// app.use('/uploads',express.static('./uploads/user-profile'))
app.use('/uploads/user-profile', express.static('./uploads/user-profile'));

//run app
app.listen(4000, () => console.log('HYY MAYAL I AM LIVE ON PORT 4000' ));
