const fs = require('fs')
const config_path = process.env.CONFIG_PATH || 'config.json';

function read(key, callback) {
    return fs.readFile(config_path, (err, data) => {
        if(err) return callback(err, null);
        const config = JSON.parse(data);
        if (key in config) {
            callback(null, config[key]);
        } else {
            callback(new Error('Key does not exist in config'), null);
        }
    });
}

function write(key, value) {
    return fs.readFile(config_path, (err, data) => {
        var config = {}
        if (!err) {
            config = JSON.parse(data);
        } 
        config[key] = value;
        fs.writeFile(config_path, JSON.stringify(config), (err) => {
            if (err) throw err;
        });
    });
}

module.exports.read = read;
module.exports.write = write;
