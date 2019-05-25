const Sequelize = require('sequelize');
const execSync = require('child_process').execSync;
const config = require('config'); 

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.get('dbpath')
});

const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: Sequelize.STRING,
        is: {
            args: /^[a-z0-9.]+$/i,
            msg: 'Invalid username.'
        },
        unique: true
    },
    password: {
        type: Sequelize.STRING
    },
    admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

const Alias = sequelize.define('alias', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    alias: {
        type: Sequelize.STRING,
        validate: {
            is: {
                args: /^[a-z0-9.]+$/i,
                msg: 'Invalid alias.'
            }
        }
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['alias', 'domainId']
        }
    ]
});

const Domain = sequelize.define('domain', { 
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    domain: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
            is: {
                args: /^[a-z0-9.]+$/i,
                msg: "Invalid name provided."
            }
        }
    },
    selector: {
        type: Sequelize.STRING,
        defaultValue: 'mail'
    },
    dkim_key: {
        type: Sequelize.STRING,
        defaultValue: function () {
            return execSync('openssl genrsa 1024').toString('base64')
        }
    }
});

Alias.belongsTo(Domain);
Alias.belongsToMany(User, { through: 'UserAliases' });

function initialize() {
    return sequelize.sync()
}

module.exports.initialize = initialize;
module.exports.User = User;
module.exports.Alias = Alias;
module.exports.Domain = Domain;
