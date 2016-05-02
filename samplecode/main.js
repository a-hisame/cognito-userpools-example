var Authentication = require('./Authentication.js');

var userPoolId = 'us-east-********';
var appClientId = '###############';
var username = 'example';
var password = 'password';

var auth = Authentication.Authentication(userPoolId, appClientId, username, password);

Authentication.authenticate(auth, {
    onSuccess: function (result) {
        console.log(result);
    },
    onFailure: function(err) {
        console.log(err);
    },
    mfaRequired: function(result) {
        console.log(result);
    },
});