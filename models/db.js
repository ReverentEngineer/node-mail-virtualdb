const Sequelize = require('sequelize');
const execSync = require('child_process').execSync;

function initialize(uri) {
    const sequelize = new Sequelize(uri)

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
            }
        },
        password: {
            type: Sequelize.STRING
        },
        admin: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['username', 'domainId']
            }
        ]
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

    User.belongsTo(Domain);
    Alias.belongsTo(Domain);
    Alias.belongsToMany(User, { through: 'UserAliases' });

    return sequelize.sync()
        .then(() => {
            return {
                User: User,
                Alias: Alias,
                Domain: Domain
            }    

        });
}

module.exports.initialize = initialize;
