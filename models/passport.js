var passport = require('passport');
const config = require('config');
const db = require('./db')

function initPassport(db) {

    var GitHubStrategy = require('passport-github').Strategy;
    var admins = config.get('admins');

    passport.use(new GitHubStrategy({
        clientID: config.get('github_client_id'),
        clientSecret: config.get('github_client_secret'),
        callbackURL: config.get('github_callback_url')
    },
        function(accessToken, refreshToken, profile, cb) {
            if (admins.indexOf(profile.username) > -1) {
                db.User.findOrCreate({ where: { githubId: profile.id } })
                    .then(user => {
                        return cb(null, user[0]);
                    })
            } else {
                return cb(null, null);      
            }
        }
    ));

    function serialize(user, done) {
        done(null, user.id);
    }

    function deserialize(id, done) {
        db.User.findOne({ where: { id: id } }).then(user => {
            if (user) {
                return done(null, { id: user.id });
            } else {
                return done(null, null);
            }
        });
    };

    passport.serializeUser(serialize);
    passport.deserializeUser(deserialize);
    return passport;
} 

module.exports = initPassport;
