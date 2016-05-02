var BigInteger = require('node-jsbn');
var sjcl = require('sjcl');
var sjclbytes = require('./sjcl-bytes.js')
var moment = require('moment');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var AuthenticationHelper = require('./AuthenticationHelper.js');

var Authentication = function(userPoolId, clientId, username, password) {
    var userPoolId = userPoolId;
    var clientId = clientId;
    var username = username;
    var password = password;
    return {
        getUserPoolId: function() { return userPoolId; },
        getClientId: function() { return clientId; },
        getUsername: function() { return username; },
        getPassword: function() { return password; },
        to_str: function() {
            return 'Auth[UserPoolId=' + userPoolId +
                ',ClientId=' + clientId + ', Username=' + username +']';
        }
    };
};

var authenticate = function(auth, callback) {
    var authHelper = new AuthenticationHelper(auth.getUserPoolId().split('_')[1]);
    var client = new AWS.CognitoIdentityServiceProvider();
    console.log(auth.to_str());
    client.getAuthenticationDetails({
        ClientId : auth.getClientId(),
        Username : auth.getUsername(),
        SrpA : authHelper.getLargeAValue().toString(16),
        ValidationData : []
    }, function(err, data) {
        if (err) {
            console.log('auth-details error');
            return callback.onFailure(err);
        }
        serverBValue = new BigInteger(data.SrpB, 16);
        salt = new BigInteger(data.Salt, 16);
        
        var hkdf = authHelper.getPasswordAuthenticationKey(auth.getUsername(), auth.getPassword(), serverBValue, salt);
        var secretBlockBits = sjclbytes.toBits(data.SecretBlock);

        var mac = new sjcl.misc.hmac(hkdf, sjcl.hash.sha256);
        mac.update(sjcl.codec.utf8String.toBits(auth.getUserPoolId().split('_')[1]));
        mac.update(sjcl.codec.utf8String.toBits(auth.getUsername()));
        mac.update(secretBlockBits);

        var now = moment().utc();
        var dateNow = now.format('ddd MMM D HH:mm:ss UTC YYYY');
        mac.update(sjcl.codec.utf8String.toBits(dateNow));
        
        var signature = mac.digest();
        var signatureBytes = sjclbytes.fromBits(signature);

        var signatureBuffer = new ArrayBuffer(32);
        var bufView = new Uint8Array(signatureBuffer);

        for (var i = 0; i < signatureBytes.length; i ++) {
            bufView[i] = signatureBytes[i];
        }
        
        var passwordClaim = {
            SecretBlock : data.SecretBlock,
            Signature : bufView
        };

        client.authenticate ({
            ClientId : auth.getClientId(),
            Username : auth.getUsername(),
            PasswordClaim : passwordClaim,
            Timestamp : now.toDate()
        }, function (errAuthenticate, dataAuthenticate) {
            if (errAuthenticate) {
                return callback.onFailure(errAuthenticate);
            }

            var codeDeliveryDetails = dataAuthenticate.CodeDeliveryDetails;
            if (codeDeliveryDetails == null) {
                return callback.onSuccess(dataAuthenticate.AuthenticationResult);
            } else {
                return callback.mfaRequired(codeDeliveryDetails);
            }
        }); // client.authenticate
    }); // getAuthenticationDetails
};


module.exports.Authentication = Authentication;
module.exports.authenticate = authenticate;