

eSIM Access API
Partner API
Deliver eSIM data plan packages via the eSIM Access HTTP API. Step by step overview.
## Quick Start
 Create an account at eSIM Access
 Deposit funds for testing and refunding
 Copy your AccessCode
 Add your AccessCode below and run in your terminal or powershell to make your first API call
## Version - V1
Version 1 - OCT 11, 2022 - Initial Release
Version 1.1 - JUN 6, 2023 - Updates:
Single Profile ordering changed to batch Profile ordering [via Order Profiles request]
Offline post-paying changed to online pre-paying [via Order Profiles request]
esim/list endpoint removed, status function found in esim/query
Cancel, Suspend, Unsuspend and Revoke functions added
Country filter added to Query All Data Packages
Webook for order status checking added
Version 1.2 - JUL 26, 2023 - Updates:
Added Top Up endpoint for adding data to existing eSIM profiles
Query available Top Up plans with iccid or packageCode
Price and amount optional when ordering a profile
bash
curl --location --request POST 'https://api.esimaccess.com/api/v1/open/balance/query'
--header 'RT-AccessCode: YOUR_ACCCESS_CODE'
## --data ''
powershell
curl -Uri "https://api.esimaccess.com/api/v1/open/balance/query" `
-Method POST `
-Headers @{"RT-AccessCode"="YOUR_ACCESS_CODE"} `
-Body ""

Version 1.3 - DEC 12, 2023 - Updates:
Adds slug as an alias to package code
Adds additional package data like speed, network, and favorite
## Version 1.4 Mar 12, 2024 - Updates:
Add SMS send to iccid ability
Adds ability to write webhooks
## Version 1.5 July 28, 2024 - Updates:
Adds daypass plans with periodNum parameter in Order Profiles
Adds rate limit of 8 requests per second
## Version 1.6 Dec 20, 2024 - Updates:
Adds fields supportTopUpType and ipExport
## Update Mar 8, 2025
Adds additional webhook for low balance now at 25% and 10% remaining
Adds balance check endpoint with last updated date
## Update Mar 19, 2025
Adds two new enpoints for balance check and current regions
## Update May 28, 2025
Add new webhooks - SMDP_EVENT which give SM-DP+ server events
## Update July 24, 2025
Top Up packages can be added after esim is created.
## Update Dec 2, 2025
Adds datatype search fuppolicy result when viewing data packages.
Environments and Endpoints
## Sandbox:
There is no Sandbox environment. Cancel eSIM orders as needed in our live environment. Request funds for testing.
## Production:
https://api.esimaccess.com
Image assets:
https://static.redteago.com/
## Authentication

Requst your API keys in your online account.
## Standards
Time codes are presented in UTC. Country codes use Alpha-2 ISO. Data values are in Bytes.
## Status
Server status tracked via postman monitors.
## Rate Limit
8 API request per second are allowed.
## Error Codes
CodeMessage
000001Server error
000101Request header (mandatory) is null
000102Wrong request header format
000103This https request method (get/post ) is not
supported
000104Request in invalid JSON format
000105Request parameters (mandatory) are not contained
000106Request parameter (mandatory) is null
000107The length of the request parameter does not meet
the requirement.
101001The timestamp of the request has expired.
101002This IP is in the blocklist.
101003Request signature mismatch.

AUTHORIZATIONAPI Key
KeyRT-AccessCode
## Value
200002This operation is not allowed due to the order status.
200005Package price error. Check price.
200006Total order price amount is wrong. Check prices.
200007Insufficient account balance
200008Order parameters error, please contact customer
service.
200009Abnormal order status
200010Profile is being downloaded for the order.
200011Insufficient available Profiles for the package, please
contact the customer service.
310201The bundle.code does not exist.
310211The data_plan_location.id does not exist.
310221The currencyId does not exist.
310231The carrierId does not exist.
310241The packageCode does not exist.
310243The package does not exist
## API
Authentication methods
Key in Header
Use the AccessCode as the API key in header authentication method.
HMAC Signature
HMAC-SHA256 signature calculation (hash-based message authentication code) uses a secret key to generate a
unique signature for a message. The signature is then used to verify the authenticity of the message.
## Request Header Authenticaion

AUTHORIZATIONAPI Key
This folder is using API Key from collectioneSIM Access API
https://api.esimaccess.com/api/v1/open/package/list
Calculation by HMAC-SHA256:
signData = Timestamp + RequestID + AccessCode + RequestBody
signature = HMACSHA256(signData, SecretCode)
## Signature Example
NameDescription
RT-AccessCodeAccess Key found in your account, used in signData
RT-RequestIDRequest ID with the uuid.v4() method generates a
new random UUID (Universally Unique Identifier).
RT-SignatureSignature (HexString) of the request
RT-TimestampRequest sending timestamp (in milliseconds) as a
string
SecretKeyUsed in the signature request, found in your account.
java
// Concatenate RT-Timestamp, RT-RequestID, RT-AccessCode, and requestBody into one string.
// This string, signStr, will be used as the data to hash in the HMAC-SHA256 function.
String signStr = RT-Timestamp  +  RT-RequestID + RT-AccessCode + requestBody
// Generate an HMAC-SHA256 hash of the signStr using the secretKey.
// The resulting hash is converted to all lowercase characters for standardization purposes
sign = HMACSha256(signStr, secretKey).toLowerCase();
## Plain Text
## Timestamp=1628670421
RequestID=4ce9d9cdac9e4e17b3a2c66c358c1ce2
AccessCode=11111
SecretKey=1111
RequestBody={"imsi":"326543826"}
signStr=16286704214ce9d9cdac9e4e17b3a2c66c358c1ce211111{"imsi":"326543826"}
Signature=7EB765E27DF5373DEA2DBC8C41A7D9557743E46C8054750F3D851B3FD01D0835
POSTGet All Data Packages
Request a list of all the available data packages offered. Optionally filter by country or region.

Additionaly request all of the Top Up plans available for a specific packageCode , slug or ICCID. Specific top
ups work with specific plans. In general, countries can be reloaded with same country top up and region with same
region top up.
## Request Parameters
## Reponse Parameters
NameTypeMOCDescriptionExample
locationCodeStringoptionalFilter by Alpha-2
ISO Country
## Code
!RG = Regional
!GL = Global
## JP
## !GL
## !RG
typeStringoptionalBASE - Default
product list
TOPUP - Top up
product list
## BASE
## TOPUP
packageCodeStringoptionalUsed with
TOPUP to view
top up package
for a
packageCode
## JC016
slugStringoptionalslug is alias
ofpackageCod
e
## AU_1_7
iccidStringoptionalInclude iccid
with TOPUP to
see available
## 4858498474737
## 2838
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed.
null
errorMessageStringoptionalError code
explanation
null
objObjectoptionalnull : failed.
## Success
includes:
packageList

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/esim/order
DomainTypeMOCDescriptionExample
packageListListmandatoryAvailable data
packages,
including:
packageCode
name price
currencyCode
volume
unusedValidTi
me duration
durationUnit
location
description
activeType
packageCodeStringmandatoryPackage codeJC016
slugStringmandatoryPackage aliasAU_1_7
nameStringmandatoryPackage nameAsia 11
countries 1GB
## 30 Days
priceIntegermandatoryPackage price,
value * 10,000
## 10000
json
## {
"locationCode": "",
"type":"TOPUP",
"slug":"VN_0.1_7",
"packageCode":"",
## "iccid":""
## }
POSTOrder Profiles
Order profiles individualy or in batch. After successful ordering, the SM-DP+ server will return the OrderNo and

allocate profiles asynchronously for the order.
To make an order
 Provide a uniqe transactionId for each order. Duplicate transactionId will be identified as the same
request.
 Provide the packageCode or slug of the data package(s) you will order.
 Provide the count for each package needed.
 Optional price check: Provide the price and multiply with count for the total cost to provide the amount.
 Optional period: For daily plans include the periodNum corresponding to the number of days of the plan.
A successful order will generate an orderNo. Query all the allocated profiles in the endpoint
## /api/v1/open/esim/query
## Request Parameters
## Response Parameters
NameTypeMOCDescriptionExample
transactionI
d
StringmandatoryUser generated
unique
transaction ID.
Max 50 chars,
utf8mb4. If the
request is retired,
it needs to be
contained;
otherwise, a new
transaction will
be created.
## ABC-210-
2s7Fr
amountLongoptionalTotal order
amount
## 20000
packageInfoLi
st
ListmandatorypackageCode
or slug ,
count ,
price
DomainTypeMOCDescriptionExample
packageCodeStringmandatoryOrder with
slug or
packageCode
(prefer slug)a
## AU_1_7
## JC016
countIntegermandatoryNumber of
packages to be
ordered
## 2
priceIntegeroptionalPackage price,
value * 10,000
## (10000 = $1.00)
## 10000
periodNumIntegeroptionalDays of a daily
plan. From 1-365.
## 7

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/esim/query
NameTypeMOCDescriptionExample
successStringmandatorytrue: success
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed.
null
errorMessageStringoptionalError code
explanation
null
objObjectoptionalIncludes:
orderNo
DomainTypeMOCDescriptionExample
orderNoStringmandatoryOrder numberB221020100753
## 11
json
## {
"transactionId":"your_txn_id",
## "amount":15000,
"packageInfoList": [{
"packageCode":"7aa948d363",
## "count":1,
## "price":15000
## }]
## }
POSTQuery All Allocated Profiles
Query all eSIM profiles for both new eSIMs, and in use eSIMs.
## Get New Orders
Query by orderNo or startTime and endTime range with paging options.

Use orderNo to request newly orderd eSIM profiles. The response will return the eSIM payload after all the allocated
profiles are asynchronously allocated by the server. Expect wait times of up to 30 seconds. You can order up to 30
eSIMs in one batch and all profiles will be returnd with orderNo results.
If the profiles are not yet ready for download, the error will be returned (error code will be 200010, meaning SM-DP+
is still allocating profiles for the order).
Use the webhook notification "notifyType":"ORDER_STATUS" to inform your first get eSIM request.
ORDER_STATUS webhook will trigger when the eSIM profiles have been created and ready for retrival.
Get Status of Existing Orders
Use esimTranNo , orderNo , or iccid to request the status of an eSIM including it's current orderUsage and
eSIMStatus. Or use startTime and endTime range. esimTranNo and iccid will return a single eSIM, while
orderNo will return the batch order of eSIMs.
Important Note: The value of orderUsage is updated within 2-3 hours after eSIM is in use.
Note: iccids are resued, thus the suggested method of eSIM status check is via esimTranNo.
Note: Rate limiting limits to 8 requests per second.
Understanding eSIM Profile Status
Results of several paramaters can identify the current state of any eSIM profile. For example:
## Request Parameters
eSIM StatussmdpStatusesimStatusorderUsageeid
NewRELEASEDGOT_RESOURCE0""
OnboardENABLEDIN_USE
## GOT_RESOURCE
## 0"890...222"
In UseENABLED
## DISABLED
## IN_USE123"890...222"
DepletedENABLED
## DISABLED
## USED_UP999"890...222"
DeletedDELETEDUSED_UP
## IN_USE
## 999"890...222"

## Response Parameters
NameTypeMOCDescriptionExample
orderNoStringoptionalOrder numberB221020638192
## 4
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
startTimeStringoptionalStarting time
(ISO UTC time)
## 2010-06-
## 30T01:20+00:0
## 0
endTimeStringoptionalEnd time (ISO
UTC time)
## 2010-06-
## 30T02:20+00:0
## 0
pagerPageParammandatoryPage parameters:
pageSize
pageNum
DomainTypeMOCDescriptionExample
pageSizeIntegermandatoryPage size, value
range: [5, 500]
## 10
pageNumIntegermandatoryPage number,
value range: [1,
## 10000]
## 1
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes:
esimList
pager

DomainTypeMOCDescriptionExample
pagerPageParammandatoryIncludes:
pageSize
pageNum
esimListListmandatoryList of eSIM
## Profiles,
including:
esimTranNo
orderNo
imsi iccid
ac
qrCodeUrl
smdpStatus
eid
activeType
expiredTime
totalVolume
totalDuratio
n
durationUnit
orderUsage
esimStatus
packageList
PageParam
## Domain
TypeMOCDescriptionExample
pageSizeIntegermandatoryPage size, range:
## [5, 500]
## 10
pageNumIntegermandatoryPage number,
value range: [1,
## 10000]
## 1
totalLongmandatoryTotal number of
## Profiles
## 120

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
eSIM DomainTypeMOCDescriptionExample
esimTranNoStringmandatoryeSIM transaction
number
## 2210270638191
## 2
orderNoStringmandatoryOrder numberB221027063819
## 24
imsiStringoptionalIMSI4540061098465
## 71
iccidStringoptionalICCID8985224528000
## 0942210
msisdnStringoptionalMSISDNxxxxx
smsStatusIntegermandatory0 Does not
support SMS 1
Can accept SMS
sent by mobile
phones and API
2 Only SMS
sent by API is
acceptable.
## 0
dataTypeIntegermandatory1.Data in Total
2.Daily Limit
## 1
eSIM DomainTypeMOCDescriptionExample
packageCodeStringmandatoryPackage IDCKH179
durationIntegermandatoryValid period of
the order
## 7
volumeLongmandatoryData volume (in
bytes) in the
order
## 1073741824
locationCodeStringmandatoryCountry code of
plan
## JP
json
## {
"orderNo":"B25080914060004",
## "iccid":"",
## "pager":{

https://api.esimaccess.com/api/v1/open/esim/cancel
pager:{
"pageNum":1,
"pageSize":50
## }
## }
POSTCancel Profile
Cancel an inactive, unused eSIM profile.
The eSIM price is refunded to your balance.
This operation is available when esimStatus is GOT_RESOURCE and smdpStatus is RELEASED meaning the
eSIM was created, but not installed on a device.
Cancel endpoint not available once user has used data with the eSIM.
It is reccomended to use the esimTranNo when making a cancel request.
Use the Cancel Profile endpoint to make refunds, test eSIM purchases and return the value of unused eSIM to your
account balance.
## Request Parameters
## Response Parameters
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
esimTranNoStringoptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/esim/suspend
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes{}
json
## {
"esimTranNo": "23120118156818"
## }
POSTSuspend Profile
Request to suspend or pause data service to an esim profile.
## Request Parameters

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
htt  //  i  i/  i/ 1/   /  i /d
## Response Parameters
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
esimTranNoStringoptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes{}
json
## {
## "iccid":"89852245280001138065"
## }
POSTUnsuspend Profile

https://api.esimaccess.com/api/v1/open/esim/unsuspend
AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
Request to unsuspend or reactivate data service to an esim profile.
## Request Parameters
## Response Parameters
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
esimTranNoStringoptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes{}
json
## {
## "iccid":"89852245280001138065"
## }

https://api.esimaccess.com/api/v1/open/esim/revoke
AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
POSTRevoke Profile
Request to close and remove an active eSIM and data plan. Non-refundable.
## Request Parameters
## Response Parameters
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
esimTranNoStringoptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes{}
json
## {
## "iccid":"89852245280001138065"
## }

https://api.esimaccess.com/api/v1/open/balance/query
AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
https://api.esimaccess.com/api/v1/open/esim/topup
## }
POSTBalance Query
Query the balance of a merchant account. Balance is used when ordering data profiles.
## Request Parameters
## None.
## Reponse Parameters
NameTypeMOCDescriptionExample
successStringmandatorytrue:
succeeded
false: failed
true
errorCodeStringoptionalnull or 0
when successful.
Error code when
failed.
null
errorMessageStringoptionalExplanation of
the error code
null
objObjectoptionalIncludes:
balance
DomainTypeMOCDescriptionExample
balanceLongmandatoryMerchant
balance,
expressed
## *10000 (100000
## = $10.00)
## 100000
POSTTop Up
Before making a top up, it is reccomended to query the available top up plans (Get All Data Packages endpoint) for a
specific iccid , esimTranNoor packageCode first. This will give you available top up packages specific to this
eSIM. Learn more about top ups.

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
The top up endpoint allows an existing installed eSIM to be loaded with a new plan. To top up the plan, you need its
ICCID or esimTranNo and the compatible top up data plan packageCode.
Top ups can be requested while the eSIM is in New, In Use or Depleted status, but not after eSIM expiry.
## Request Parameters
## Respone Parameters
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID
(depreciated, use
esimTranNo )
## 8985224628000
## 1113119
esimTranNoStringoptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1
packageCodeStringrequiredUse a recharge
packageCode
starting with
"TOPUP_" or use
slug Learn
more
## TOPUP_SM001
## AU_1_7
amountStringoptionalPrice of package,
if used will be
## 10000
objTypeMOCDescriptionExample
transactionI
d
StringrequiredTransaction ID
returned
## TXN-123
iccidStringrequiredICCID of the
eSIM
## 8985224528000
## 1354019
expiredTimeLongrequiredNew date of
pakcage expiry
## 2023-08-
## 17T17:01:37+0
## 000
totalVolumeLongrequiredNew voulme of
data
## 4294967296
totalDuratio
n
IntegerrequiredNew duration in
days
## 28
orderUsageLongrequiredTotal data usage207239584

## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/webhook/save
AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/esim/sendSms
json
## {
"esimTranNo":"",
## "iccid":"89852000263213655345",
"packageCode":"TOPUP_JC172",
"transactionId": "1747191693771_topup_partner7"
## }
POSTSet Webhook
Set or update your webhook URL via an API call. You can find the result in your console account here.
You can also view the currently set webhook with the following endpoint:
## /api/v1/open/webhook/query
json
## {"webhook":"https://webhook.endpoint.site/unique-webhook"}
POSTSend SMS
This endpoint is used to send SMS to an eSIM via iccid or esimTranNo. Supported by some networks. Only
installed eSIMs that supports receiving SMS will work.
The smsStatus parameter in the /order and /package endpoints indicates whether the eSIM supports receiving
SMS ( "smsStatus": 1 or 2) . There is currently no cost for SMS delivery.
## Request Parameters

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/esim/usage/query
NameTypeMOCDescriptionExample
iccidStringoptionaleSIM ICCID8985224628000
## 1113119
esimTranNooptionalget from "Query
## All Allocated
## Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
## 2411131954210
## 1
messageString(500)requiredSMS message,
up to 500
characters.
"Thank you for
using our eSIM
service"
json
## {
"esimTranNo":"23072017992029",
"message":"Your Message!"
## }
POSTUsage Check
Check the data usage of up to 10 eSIMs via their esimTranNo. Returns the amout of dataUsage, the totalData
in the plan, and the lastUpdateTime timestamp of the most recent data used value update.
Important Note: Data usage is updated every 2-3 hours and is not real time.

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
https://api.esimaccess.com/api/v1/open/location/list
FieldTypeDescriptionExample
esimTranNoStringeSIM transaction
number
## 23072017992029
dataUsageLongData usage in Bytes1453344832
totalDataLongTotal data in Bytes5368709120
lastUpdateTimeStringThe timestamp for the
last call record update.
For file-based records,
this is the last full hour
of settlement; for
carrier data usage
notifications, it is the
settlement time
recorded in the
notification; for the
carrier’s real-time call
record API, it is the
time when the API was
called.
## 2025-03-
## 19T18:00:00+0000
json
## {
"esimTranNoList": ["25030303480009"]
## }
POSTSupported Regions
Check our currently supported countries and plan codes.

AUTHORIZATIONAPI Key
This request is using API Key from collectioneSIM Access API
## Bodyraw (json)
Each SubLocation object contains:
FieldTypeDescriptionExample
codeStringRegion codeES NA-3
nameStringRegion nameSpain North
## America
typeIntegerRegion type: 1 for
single-country, 2 for
multi-country
## 1
subLocationListSub-regions (exists
only when type = 2)
FieldTypeDescriptionExample
codeStringRegion code
nameStringRegion name
json
## {}
## Webhooks
## Endpoint Setup
Adding your webhook the first time will trigger a test webhook send. If you have a correctly working endpoint, you will
receive an CHECK_HEALTH event. If our test send fails, your endpoint cannot be saved. To check a valid endpoint try
https://webhook.site/
{"notifyType":"CHECK_HEALTH","content":{"orderNo":"1234567890","orderStatus":"Test"}}**
Set your webhook URL to receive POST requests** in your account.
The notifications contain a notifyType field indicating the event category and a content object with specific
details. Here are the types you can expect:
##  ORDER_STATUS
a Trigger: Sent when an eSIM is created and ready for retrieval.

b Key content field: orderStatus will be "GOT_RESOURCE".
c Example Use: Used to know when your eSIM order is ready for download.
##  SMDP_EVENT
a Trigger: Sent during real-time eSIM profile lifecycle events as they occur on the SM-DP+ server.
b Key content fields:
i eid: eUICC identifier of the device.
ii iccid: ID of the eSIM.
iii esimStatus: Current eSIM state (typically GOT_RESOURCE during provisioning, IN_USE when
active).
iv smdpStatus: SM-DP+ server status indicating the specific operation:
a DOWNLOAD: eSIM profile is being downloaded to the device.
b INSTALLATION: eSIM profile is being installed on the device.
c ENABLED: eSIM has been activated/enabled on the device.
d DISABLED: eSIM profile has been deactivated/disabled on the device..
e DELETED: eSIM profile has been removed from the device.
c Example Use: Track real-time eSIM provisioning progress and profile state changes for detailed lifecycle
monitoring.
##  ESIM_STATUS
a Trigger: Sent when the status of an individual eSIM changes after it has been allocated. This covers
various lifecycle events.
b Key content fields:
i esimStatus: Indicates the current state. Common values observed include:
a IN_USE: The eSIM has been installed/activated on a device.
b USED_UP: The eSIM data allowance has been fully consumed.
c USED_EXPIRED: The eSIM data is used up, and expired.
d UNUSED_EXPIRED: The eSIM expired with data remaining.
e CANCEL: The eSIM has been canceled / refunded.
f REVOKED: The eSIM profile has been revoked.
ii smdpStatus: SM-DP+ server status (e.g., ENABLED, DISABLED, RELEASED, DELETED,
## INSTALLATION).
c Example Use: Track activation, data exhaustion, expiration, or cancellations for specific eSIMs and notify
customers.
##  DATA_USAGE
a Trigger: 3 data usage webhooks will be sent when reaching 50% (0.5) data used, 80%(0.8) data used and
90%(0.9) data used.
b Key content fields:
i totalVolume: Total data allowance in bytes.
ii orderUsage: Data used so far in bytes.
iii remain: Remaining data in bytes.
iv remainThreshold : Values can be: 0.5, 0.2 and 0.1
c Example Use: Proactively notify end-users about low data balance.
##  VALIDITY_USAGE
a Trigger: Sent when the remaining validity period of an active eSIM reaches 1 day.
b Key content fields:
i remain: The remaining validity duration (e.g., 1).

ii durationUnit: The unit for the duration (e.g., "DAY").
iii expiredTime: The exact timestamp when the eSIM will expire.
iv totalDuration: The original validity duration.
c Example Use: Warn end-users that their plan is about to expire.
IP Whitelist
For additional security, you can whitelist the following sender IPs:
## 3.1.131.226
## 54.254.74.88
## 18.136.190.97
## 18.136.60.197
## 18.136.19.137
Note: The content object structure may vary slightly. Always inspect the received payload to understand all
available fields for each notifyType.
Look at our example webhook sending and test trigger form.
json
## {
"notifyType": "ORDER_STATUS",
## "content": {
"orderNo": "B23072016497499",
"orderStatus": "GOT_RESOURCE"
## }
## }
json
## {
"notifyType": "SMDP_EVENT",
"eventGenerateTime": "2025-09-11T13:28:09+0000",
"notifyId": "5fcc219e32dc484598d3fd700cf3738d",
## "content": {
## "eid": "89049032007108882600137544319616",
## "iccid": "8997250230000292199",
"esimStatus": "GOT_RESOURCE",
"smdpStatus": "DOWNLOAD",
"orderNo": "B25091113270004",
"esimTranNo": "25091113270004",
json
## {
"notifyType": "DATA_USAGE",
"eventGenerateTime": "2025-07-21T10:57:28Z",
"notifyId": "f776267e8d6745db8cc316e4c146ea0c",
## "content": {
"orderNo": "B25052822150009",
"transactionId": "unique_id_from_partner",
"  i""2 0 2822  0009"

AUTHORIZATIONAPI Key
This folder is using API Key from collectioneSIM Access API
"esimTranNo": "25052822150009",
## "iccid": "8943108170001029631",
"totalVolume": 53687091200,
"orderUsage": 48335585458,
json
## {
"notifyType": "VALIDITY_USAGE",
## "content": {
"orderNo": "B23072016497499",
"transactionId": "Your_txn_id",
## "iccid": "894310817000000003",
"durationUnit": "DAY",
"totalDuration": 30,
"expiredTime": "2024-01-11T08:10:19Z",
## "remain": 1
## }
json
## {
"notifyType": "ESIM_STATUS",
"eventGenerateTime": "2025-08-09T00:23:45Z",
"notifyId": "4038b3dfb1b050bf9f02501df67284f3",
## "content": {
"orderNo": "B25080823490018",
"esimTranNo": "25080323490020",
"transactionId": "e23111e4d07746889c7bce41cf3f1b16",
## "iccid": "89852000263413436720",
"esimStatus": "CANCEL",
"smdpStatus": "RELEASED"