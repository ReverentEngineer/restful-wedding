var express = require('express');
var async   = require('async');
var router  = express.Router();
var db      = require('../models/db');
var path    = require('path');

function authenticate(req, res, next) {
    if (req.session.household_id || process.env.NODE_ENV == 'test') {
        return next();
    } else {
        if (req.method == "POST") {
            db.Household.findOne({ attributes: ['name', 'id'], where: { passcode: req.body.inputPasscode } })
                .then(household => {
                    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    if (household) {
                        console.log("Household " + household.name + " logged in from " + ip);
                        req.session.household_id = household.id;
                        return res.status(200).send();
                    } else {
                        console.log("Invalid login attempt from " + ip);
                        return res.status(401).send();
                    }
                }).catch(error => {
                    return res.status(500).send(error.message);
                });
        } else { 
            return res.status(401).send();
        }
    }
}

router.use(authenticate);

router.get('/', function(req, res) {
    db.Household.findOne({ attributes: ['notes'], where: { id: req.session.household_id }, include: [{ model: db.Guest, attributes: ['id', 'name', 'attending', 'email'], include: [ { model: db.Meal, attributes: [ 'name', 'description'] } ] }] })
        .then(household => {
            if (household) {
                return res.json(household);
            } else {
                return res.status(500).send("Internal server error");
            }   
        }).catch(error => {
            return res.status(500).send(error.message);
        });
});

router.post('/', function (req, res) {
    db.Household.findOne({ where: { id: req.session.household_id }, include: [{ model: db.Guest, required: true }] })
        .then(household => {
            if (household) {
                household.notes = req.body.notes;
                household.save();
                if ('guests' in req.body) {
                    for (var i = 0; (i < req.body.guests.length) && (i < household.guests.length); i++) {
                        household.guests[i].attending = req.body.guests[i].attending;
                        household.guests[i].email = req.body.guests[i].email;
                        household.guests[i].save();
                    }
                }
                return res.status(200).json({ "message" : "Success" });
            } else {
                return res.status(500).json({ "message" : "Internal server error" });
            }   
        }).catch(error => {
            return res.status(500).json({ "message": error.message });
        });
});

module.exports = router;
