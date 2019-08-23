const config = require('config');
const Sequelize = require('sequelize');

var dbstorage = process.env.WEDDING_DB || './wedding.db';
if (process.env.NODE_ENV == 'development') {
    dbstorage = ':memory:'
}


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbstorage
});

const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: Sequelize.STRING
    },
    githubId: {
        type: Sequelize.INTEGER,
        unique: true
    },
});

const Household = sequelize.define('household', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING
    },
    passcode: {
        type: Sequelize.STRING
    },
    notes: {
        type: Sequelize.TEXT
    }
});

const Guest = sequelize.define('guest', { 
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        validate: {
            is: {
                args: /^[a-z '\.]+$/i,
                msg: "Invalid name provided."
            }
        }
    },
    attending: {
        type: Sequelize.BOOLEAN
    },
    shuttle: {
        type: Sequelize.BOOLEAN,
    },
    rehearsal_dinner: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
    }
});

const Meal = sequelize.define('meal', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.TEXT
    },
});

Guest.belongsTo(Household);
Guest.belongsTo(Meal);
Household.hasMany(Guest);

function initialize() {
    return sequelize.sync();
}

module.exports.initialize = initialize;
module.exports.Household = Household;
module.exports.Guest = Guest;
module.exports.Meal = Meal;
module.exports.User = User;
