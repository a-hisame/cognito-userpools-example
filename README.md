# README

This project is an example of using Cognito UserPools feature for server side user management.

I explain how to use the cognito-idp and cognito-identity APIs [here](./feature-list.md).

```
Notice: This is a toy program. so we re-write managed contents manually (not good way).
```


## How to use

I checked this code on `Node.js 4.4.3` (on Windows).

1. You setup Cognito UserPools and Identity
   ([see here](http://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/cognito-user-identity-pools.html),
   [for japanese](http://dev.classmethod.jp/cloud/aws/cognito-user-pool/) )
2. Create a Account on UserPools (example/password)
3. Setup required libraries `npm install aws-sdk node-jsbn sjcl moment`
4. Rewrite `[node-lib]/aws-sdk/apis/cognito-idp-20YY-MM-DD.min.json` following [this document](./feature-list.md)
5. Input your information into `samplecode/main.js`
6. run `cd samplecode && node main.js`


## References

* https://github.com/aws/amazon-cognito-identity-js


## Lisences

In this project, I referred and copied many codes from
[AuthenticationHelper.js (*1)](https://github.com/aws/amazon-cognito-identity-js/blob/master/src/AuthenticationHelper.js),
[CognitoUser.js (*2)](https://github.com/aws/amazon-cognito-identity-js/blob/master/src/CognitoUser.js) and
[codecBytes.js (*3)](https://github.com/bitwiseshiftleft/sjcl/blob/master/core/codecBytes.js).

These codes are not good format for node.js so I copied, rewrote and used here.

The (*1) and (*2) programs are under [the Amazon Software License](lisences/amazon-cognito-identity-js-LICENSE.txt) 
so these copied resources which `samplecode/Authentication.js` and `samplecode/AuthenticationHelper.js` are extends Amazon Software License.

And (*3) is under [BSD license](lisences/sjcl-LICENSE.txt) so `samplecode/sjcl-bytes.js` are extends BSD license too.

Other all commited resources are under the MIT-LICENSE.
