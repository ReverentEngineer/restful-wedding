var express = require('express');
var router = express.Router();
var passport = require('passport');
var db = require('../models/db');
const async = require('async');
const Op = require('sequelize').Op;

router.use(function (req, res, next) {
    if (req.app.get('env') == 'development') {
        return next();
    } else if (req.isAuthenticated()) {
        return next()
    } else {
        return res.status(401).render('error', { message: 'Unauthorized' });
    }
})

router.get('/', function (req, res) {
    var promises = {
        wedding: {
            invited: db.Guest.count(),
            accepts: db.Guest.count({ where: { 'attending': true }}),
            regrets: db.Guest.count({ where: { 'attending': false }}),
            noresponses: db.Guest.count({ where: { 'attending': { [Op.eq]: null }}})
        },
        rehearsal: {
            invited: db.Guest.count({ where: { 'rehearsal_dinner': true }}),
            accepts: db.Guest.count({ where: { 'attending': true, 'rehearsal_dinner': true }}),
            regrets: db.Guest.count({ where: { 'attending': false, 'rehearsal_dinner': true }}),
            noresponses: db.Guest.count({ where: { 'attending': { [Op.eq]: null }, 'rehearsal_dinner': true}})
        }
    }

    Promise.all([promises.wedding.invited, 
        promises.wedding.accepts, 
        promises.wedding.regrets, 
        promises.wedding.noresponses,
        promises.rehearsal.invited,
        promises.rehearsal.accepts,
        promises.rehearsal.regrets,
        promises.rehearsal.noresponses,
    ]).then(counts => {
        return res.render('summary', 
            { 
                wedding: {
                    invited: counts[0],
                    accepts: counts[1],
                    regrets: counts[2],
                    noresponses: counts[3]
                },
                rehearsal: {
                    invited: counts[4],
                    accepts: counts[5],
                    regrets: counts[6],
                    noresponses: counts[7]
                }
            });
    });
});

function guestView (req, res) {
    async.parallel({ 
        guests: function (callback) {
            db.Guest.findAll({ include: [db.Household, db.Meal] })
                .then(guests =>{
                    callback(null, guests);
                });
        },
        households: function (callback) {
            db.Household.findAll()
                .then(households =>{
                    callback(null, households);
                });
        },
        meals: function (callback) {
            db.Meal.findAll()
                .then(meals => {
                    callback(null, meals);
                });
        }
    }, function (err, results) {
        return res.render('guests', results);
    });
}


router.get('/guests', guestView);

router.post('/guests', function (req, res) {
    if (req.body.action == "add") {
        db.Guest.create({ 
            name: req.body.name,
            email: req.body.email,
            rehearsal_dinner: req.body.rehearsal_dinner
        }).then(guest => {
            guest.setHousehold(req.body.household).then(() => {
                guest.setMeal(req.body.meal).then(() => {
                    return guestView(req, res);
                });
            });
        }).catch(error => {
            res.locals.userMessage = error.message;
            return guestView(req, res);
        });
    } else if (req.body.action == "delete") {
        db.Guest.destroy({ where: { id: req.body.id } });
        return guestView(req, res);
    }
});

function householdView(req, res) {
    db.Household.findAll().then(households => {
        res.render('households', { 'households': households });
    });
}

router.get('/households', householdView);

router.post('/households', function (req, res) {
    if (req.body.action == "add") {
        require('crypto').randomBytes(6, function (err, buffer) {
            var passcode = buffer.toString('base64');
            db.Household.create({name: req.body.name, passcode: passcode})
                .then(household => {
                    return householdView(req, res);

                });
        });
    } else if (req.body.action == "delete") {
        db.Household.destroy({ where: { id: req.body.id } })
            .then(() => {
                return householdView(req, res);
            });
    }
});


function mealOptionsView(req, res) {
    db.Meal.findAll().then(meals => {
        res.render('mealoptions', { 'meal_options': meals, } );
    });
}

router.get('/mealoptions', mealOptionsView);

router.post('/mealoptions', function (req, res) {
    if (req.body.action == "add") {
        db.Meal.create({ name: req.body.name, description: req.body.description })
            .then(meal => {
                return mealOptionsView(req, res);
            })
    } else if (req.body.action == "delete") {
        db.Meal.destroy({ where: { id: req.body.id } })
            .then(() => {
                return mealOptionsView(req, res);
            });
    } else {
        return res.status(400).send("Bad Request");
    }
});

router.get('/message', function (req, res) {
    if ('mailFrom' in req.app.locals) {
        res.render('message');
    } else {
        return res.render('error', { message: 'Mail not enabled.', });
    }
});

router.post('/message', function (req, res) {
    if ('mailFrom' in req.app.locals) {
        db.Guest.findAll({ attributes: [ 'email' ], where: { email: { [Op.ne]: null } } }).then(guests => {
            var emailList = guests.map(function (value) {
                return value.email;
            });

            for (var i = 0; i < emailList.length; i++) {
                var mailOptions = {
                    from: req.app.locals.mailFrom,
                    to: emailList[i],
                    subject: req.body.subject,
                    text: req.body.body
                };
                req.app.locals.mailer.sendMail(mailOptions);
            }
            return res.render('error', { message: 'Mail sent.', });
        });
    } else {
        return res.render('error', { message: 'Mail not enabled.'});
    }
});



module.exports = router;
