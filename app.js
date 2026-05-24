require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const mongoose = require('mongoose');
const { createSessionMiddleware } = require('./server/config/session');
const { attachUserToLocals } = require('./server/auth/auth');
const attachSiteGlobals = require('./server/middleware/siteGlobals');
const seedDemoUsers = require('./server/seed/seedUsers');
const seedPlatformData = require('./server/seed/seedPlatformData');
const seedSiteContent = require('./server/seed/seedSiteContent');
const seedDoctorData = require('./server/seed/seedDoctorData');
const seedPatientData = require('./server/seed/seedPatientData');

mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected');
        await seedDemoUsers({ verbose: false });
        await seedPlatformData();
        await seedSiteContent();
        await seedDoctorData();
        await seedPatientData();
    })
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

const PORT = process.env.PORT || 5000;

app.get('/favicon.ico', (req, res) => {
    res.type('image/svg+xml');
    res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(createSessionMiddleware());

app.use(attachUserToLocals);
app.use(attachSiteGlobals);

app.use(expressLayout);
app.set('layout', false);
app.set('view engine', 'ejs');

app.use('/auth', require('./server/routes/auth'));
app.use('/', require('./server/routes/doctor'));
app.use('/', require('./server/routes/doctorPages'));
app.use('/', require('./server/routes/patient'));
app.use('/', require('./server/routes/patientPages'));
app.use('/', require('./server/routes/dashboards'));
app.use('/', require('./server/routes/admin'));
app.use('/', require('./server/routes/adminPages'));
app.use('/', require('./server/routes/contact'));
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/errors'));

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log(`Server running at: http://localhost:${PORT}`);
});
