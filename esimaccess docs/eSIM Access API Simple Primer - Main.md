

API Steps for Single eSIM Purchase and Top Up
Lifecycle StepsTypeNameDescriptionKey to PassKey output
1Actions ( API  Enpoint Requests )
## View Balance
Retrieves USD account balance
needed for eSIM purchases.n/aUSD Balance - "balance": 940000"/balance/query
2Actions ( API  Enpoint Requests )
## View Plans - Single
View a single plan's price and
details."packageCode":"",JSON - Plan name, ID, Price and size/package/list
## View Plans - Array
View a country plans or all plans
price and details for all countries."locationCode": "JP",JSON Array - Plan name, ID, Price and size
## /package/list
3Actions ( API  Enpoint Requests )
## Order - Single
Place an eSIM order"packageCode":"US_1_7", "count":1,
Order Number - "orderNo":
## "B23051616050537"
## /esim/order
Order - ArrayPlace multiple eSIM order
Plan Names, Qty "packageCode":"
US_1_7",   "count":10,
"orderNo": "B23051616050537"/esim/order
4Triggers ( Webhook )
eSIM Order Ready
Triggers when an eSIM that was
just purchased, is ready to be
retrieved.
## ORDER_STATUS
Order Ready - orderNo,  "orderStatus":
## "GOT_RESOURCE"
5Actions ( API  Enpoint Requests )
## View Order - Single
View the eSIM profile of the
previously placed order.
orderNo
JSON - esimList - iccid, qr code - esim
payload
## /esim/query
## View Order - Array
View the eSIM profiles of the
previously placed orders.
orderNo
JSON Array - esimList - iccid, qr code - esims
payload
## /esim/query
6Actions ( API  Enpoint Requests )
## View Usage
View the data usage of a specivic
planiccid
Current Usage Data - orderUsage,
expiredTime/esim/query
7Triggers ( Webhook )
## Low Balance
Triggers when an esim data
usage is below 100 MB.DATA_USAGERemaining Data - "remain":12123,
Low ValidityTriggers when 1 day leftVALIDITY_USAGE1 Day remaining
8Actions ( API  Enpoint Requests )
## View - Top Up Plans
View the top up plans available to
a specivic eSIM."iccid":"" "type":"",JSON Array - Plan name, ID, Price and size /package/list
9Actions ( API  Enpoint Requests )
## Order Top Up
Add additional data to an existing
plan.iccid, packagecode:"US_1_7_topup"
New Validity and added Data - totalVolume,
totalDuration/esim/topup
optionalActions ( API  Enpoint Requests )
CancelRefund an unused order.iccidsuccess/esim/revoke
optionalActions ( API  Enpoint Requests )
SususpendPause a eSIM profile in useiccidsuccess/esim/suspend
optionalActions ( API  Enpoint Requests )
UnsuspendUn-pause an esim profile in useiccidsuccess/esim/unsuspend
optionalActions ( API  Enpoint Requests )
RevokeCancel an esim profile in use.iccidsuccess/esim/revoke