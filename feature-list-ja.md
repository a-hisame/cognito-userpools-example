# Cognito UserPoolsの使い方

具体的なパラメータが出てきた場合は以下の値を仮定する。

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

### ユーザの新規登録

* API - [SignUp](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_SignUp.html)

ユーザの登録が成功した場合、事前に設定していた媒体に確認用コードが届きます。


### ユーザの認証

* API - [ConfirmSignUp](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_ConfirmSignUp.html)

ユーザ登録時に送られてきた認証コードを入力することで、そのユーザが有効になります。


### ユーザでのログイン

以下の2APIについては公式に公開はされていません (cognito-idpのAPIです)。

* API - GetAuthenticationDetails (Use first)
  
  * Using "account username" and "App Client Id"
  
* API - Authenticate (Use second)
  
  * Generate authentication requrest by using GetAuthenticationDetails result
  * Using "account username", "App Client Id" and "password"
  * Send an encoded request

第一段階のAPIでログイン用の暗号化情報を取得します。
その後、その情報を利用してパスワードを含めた認証情報を送付します。


#### Response

ログインに成功した場合、以下の構造のオブジェクトが返ってきます。

```javascript
{
  AccessToken: '*[YOUR-ACCESS-TOKEN]*',
  ExpiresIn: 3600,
  IdToken: '*[YOUR-ID-TOKEN]*',
  RefreshToken: '*[YOUR-REFRESH-TOKEN]*',
  TokenType: 'Bearer'
}
```

AccessTokenはCognito UserPools用に利用します。
例えば、該当トークンがどのユーザのものなのかは
[GetUser API](https://docs.aws.amazon.com/ja_jp/cognito-user-identity-pools/latest/APIReference/API_GetUser.html)
を使うことで判断できます (同時に、ログインの有無も判断できます)。

IdTokenはCognito Identity用のものです。
このIDを使うことで、一時的なIAMを利用可能なセッション情報を得ることができます。


#### Definitions

もしログインAPIを使いたいなら、以下の予定を加える必要があります (将来的にはおそらく実装されますが...)
追加先は `aws-sdk/apis/cognito-idp-20YY-MM-DD.min.json` (node.js) です。

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

ここからはCognito Identityの機能を利用します。

Following APIs belong Cognito Identity.

* API - [GetId](http://docs.aws.amazon.com/ja_jp/cognitoidentity/latest/APIReference/API_GetId.html)
  
  * Get ID for Cognito Identity

* API - [GetCredentialsForIdentity](http://docs.aws.amazon.com/ja_jp/cognitoidentity/latest/APIReference/API_GetCredentialsForIdentity.html)
  
  * Get Authorized Session ID


aws-cliを利用したサンプルは以下の通りです。

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

ここで得られる(AccessKeyId, SecretKey, SessionToken)の組が一時IAMです。
このIAMはプログラムだけでなく、設定ファイルに書いても(期限が切れるまでは)使えます。

