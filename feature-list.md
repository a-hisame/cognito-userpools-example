# How to manage Cognito-UserPools Account

I assume below parameters;

## UserPools Parameters

* AWS Account: `123456789012`
* (User Pools) Pool Id: `us-east-1_********`
* App Name: `test`
* App Client Id: `###############`
* App Client Secret Key: None (non generated)

## Account

* Username: `example`
* Password: `password`
* Mail-Address: `example@example.com`

## Ideneity Pool Parameters

* Identity Pool Name: `test`
* (Identity) Identity pool ID: `us-east-1:xxxxxxxx-yyyyyy-zzzz-zzzz-xxxxxxxxxx`


## API

### SignUp

* API - [SignUp](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_SignUp.html)

After succeeded signup, your "DeliveryMedium" resource (e-mail or SMS) gets a verification code.


### ConfirmSignUp 

* API - [ConfirmSignUp](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_ConfirmSignUp.html)

Your new account will be enable after your verification code is accepted.


### Login

This API is not opened formally at 2016/05/02. We use following 2 cognito-idp APIs.

* API - GetAuthenticationDetails (Use first)
  
  * Using "account username" and "App Client Id"
  
* API - Authenticate (Use second)
  
  * Generate authentication requrest by using GetAuthenticationDetails result
  * Using "account username", "App Client Id" and "password"
  * Send an encoded request


On first step, you get authentication parameters for serialization.
After that you serialize and encode your authentication requests includes password and send it.


#### Response

If your login is succeeded, you get a following structure object.

```javascript
{
  AccessToken: '*[YOUR-ACCESS-TOKEN]*',
  ExpiresIn: 3600,
  IdToken: '*[YOUR-ID-TOKEN]*',
  RefreshToken: '*[YOUR-REFRESH-TOKEN]*',
  TokenType: 'Bearer'
}
```


"AccessToken" is for "cognito-idp" API such as [GetUser API](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_GetUser.html).
If you check a user is login or not, you can use "GetUser" API.

"IdToken" is for "cognito-identity" API.
Using this IdToken you can get session id tied temporary IAM role.


#### Definitions

If you want to use login APIs, you define following service interfaces into `aws-sdk/apis/cognito-idp-20YY-MM-DD.min.json` (node.js).

```json
"GetAuthenticationDetails":{
  "input":{
    "type":"structure",
    "required":[
      "ClientId","Username","SrpA"
    ],
    "members":{
      "ClientId":{"shape":"S15"},
      "SecretHash":{"shape":"S16"},
      "Username":{"shape":"Sd"},
      "SrpA":{},
      "ValidationData":{"shape":"Sq"}
    }
  },
  "output":{
    "type":"structure",
    "required":["Salt","SrpB","SecretBlock"],
    "members":{
      "Salt":{},
      "SrpB":{},
      "SecretBlock":{"type":"blob"},
      "Username":{"shape":"Sd"}
    }
  },
  "authtype": "none"
},
```

```javascript
"Authenticate":{
    "input":{
        "type":"structure",
        "required":[
            "ClientId" ,"Username" ,"PasswordClaim"
        ],
        "members":{
            "ClientId": {"shape":"S15"},
            "SecretHash":{"shape":"S16"},
            "Username":{"shape":"Sd"},
            "PasswordClaim":{
                "type":"structure",
                "members":{
                    "SecretBlock":{"type":"blob"},
                    "Signature":{"type":"blob"}
                },
                "sensitive":true
            },
            "Timestamp":{
                "type":"timestamp"
            }
        }
    },
    "output":{
        "type":"structure",
        "members":{
            "AuthenticationResult":{"shape":"S1a"},
            "AuthState":{},
            "CodeDeliveryDetails":{}
        }
    },
    "authtype": "none"
},
```

### Get Authorized IAM

Following APIs belong Cognito Identity.

* API - [GetId](http://docs.aws.amazon.com/ja_jp/cognitoidentity/latest/APIReference/API_GetId.html)
  
  * Get ID for Cognito Identity

* API - [GetCredentialsForIdentity](http://docs.aws.amazon.com/ja_jp/cognitoidentity/latest/APIReference/API_GetCredentialsForIdentity.html)
  
  * Get Authorized Session ID


This is example of aws-cli.

```bash
aws cognito-identity --region us-east-1 get-id --account-id 123456789012 \
  --identity-pool-id us-east-1:xxxxxxxx-yyyyyy-zzzz-zzzz-xxxxxxxxxx \
  --logins "{\"cognito-idp.us-east-1.amazonaws.com/us-east-1_********\":\"*[YOUR-ID-TOKEN]*\"}"

  > {
  >     "IdentityId": "us-east-1:dddddddd-cccc-bbbb-aaaa-000000000000"
  > }

aws cognito-identity --region us-east-1 get-credentials-for-identity \
  --identity-id us-east-1:dddddddd-cccc-bbbb-aaaa-000000000000 \
  --logins "{\"cognito-idp.us-east-1.amazonaws.com/us-east-1_********\":\"*[YOUR-ID-TOKEN]*\"}"

  > {
  >     "Credentials": {
  >         "SecretKey": "********",
  >         "SessionToken": "**************",
  >         "Expiration": 1400000000.0,
  >         "AccessKeyId": "*************"
  >     },
  >     "IdentityId": "us-east-1:dddddddd-cccc-bbbb-aaaa-000000000000"
  > }
```

This creadential of (AccessKeyId, SecretKey, SessionToken) tuple is IAM information.
You can use this credentials even if you write aws-config file (of cource until expired).
