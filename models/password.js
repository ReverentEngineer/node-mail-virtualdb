const pbkdf2 = require('crypto').pbkdf2;
const randomBytes = require('crypto').randomBytes;

function checkPassword(password, hash, callback) {
    var hashSplit = hash.split('$');
    var salt = hashSplit[2]
    var iterations = Number(hashSplit[3])
    var hash = hashSplit[4]
    const digest = 'sha1'
    const keylen = 20
    pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
        if (err) {
            callback(err, null);
        } else if (derivedKey.toString('hex') == hash) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
}

function createPassword(password, callback) {
    const digest = 'sha1'
    const keylen = 20
    const iterations = 5000;
    randomBytes(8, function(err, buffer) {
        if (err) {
            return callback(err, null)
        } else {
            var salt = buffer.toString('hex');
            pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
                if (err) {
                    callback(err, null);
                } else {
                    var formattedPassword = '{PBKDF2}$1$' + salt + '$' + iterations + '$' + derivedKey.toString('hex');
                    callback(null, formattedPassword);
                }
            });
        }
    });
}

module.exports.check = checkPassword;
module.exports.create = createPassword;
