const session = require('express-session');
const { MongoStore } = require('connect-mongo');

function createSessionMiddleware() {
    const secret = process.env.SESSION_SECRET || 'doctorscares-secret-change-in-production';

    return session({
        name: 'doctorscares.sid',
        secret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 60 * 60 * 2,
            autoRemove: 'native',
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 2,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        },
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
    });
}

function setSessionUser(req, userPayload) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.user = userPayload;
            req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
        });
    });
}

module.exports = { createSessionMiddleware, saveSession, setSessionUser };
