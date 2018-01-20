# bchtolegacy

Converts new cash address format to legacy address format for bitcoincash

## For browsers

Get the minimized version on the dist folder.

## Api

```js
BCH.toLegacyAddress('bitcoincash:qpmtetdtqpy5yhflnmmv8s35gkqfdnfdtywdqvue4p') 
// converts to legacy address -> 1BppmEwfuWCB3mbGqah2YuQZEZQGK3MfWc

BCH.toCashAddress('1BppmEwfuWCB3mbGqah2YuQZEZQGK3MfWc')
// converts to new cash address -> bitcoincash:qpmtetdtqpy5yhflnmmv8s35gkqfdnfdtywdqvue4p
```