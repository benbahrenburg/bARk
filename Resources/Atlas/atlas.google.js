/*jslint maxerr:1000 */
/*
 * Project Atlas
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//*************************************************************
//		Go to http://code.google.com/apis/maps/index.html
//		and check the licening terms to make sure it is compatible
//		with your application
//*************************************************************
//-----------------------------------------------------------
//	Provider Name : Google
//	Provider Version: 1
//
//
//	Public exports:
//	exports.providerName  -> Gives the name of the provider
//
//	exports.providerVersion -> Gives the version of the provider
//
//	exports.capabilities	-> Provies a list of the providers capabilities
//
//	exports.providerSetup -> Provides the provider setup details
//							such as api and other keys
//
//	exports.providerCleanup -> Provides the provider with any clean-up instructions
//
//	exports.providerSetupFromByFile -> Loads setup information
//									from a file. The file path
//									is from the Resources directory
//
//	exports.reverseGeo -> Performs a reverse geolocation lookup
//						  using the coordinates provided.
//
//		success :true/false this provides an indicator if there is an error,
//		message: if there is a message this will tell us what it is,
//		location:
// 		{
// 			address : if available the Address of the coordinates provided
// 			city : if available the City of the coordinates provided
// 			regionCode : if available the Region (state, provance) code will be provided 
// 			countryCode : Country code of the coordinates provided,
// 			latitude : latitude value used in the lookup, 
// 			longitude : longitude value used in the lookup,
// 		}
//
//	exports.forwardGeo -> Performs the search and provides the results
//							to a callback method in the following format:
//
//		success :true/false this provides an indicator if there is an error,
//		message: if there is a message this will tell us what it is,
//		location:
// 		{
// 			address : Address or location used in search,
// 			city : if available the City, 
// 			regionCode : if available the Region (state, provance) code will be provided,
// 			countryCode : if available Country code,
// 			latitude : latitude value, 
// 			longitude : longitude value,
// 		}
//

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//	PRIVATE HELPER FUNCTIONS START HERE
//	Scroll down to see what exports are available.
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
function IsNumeric(input){
    var RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return (RE.test(input));
};
function safeTrim(value){
	if((value===null)||(value===undefined)){
		return '';
	}else{
		return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	
	}	
};
function findCodeInResults(resultSet,matchCode){
	var iLoop=0;
		if((resultSet.results===undefined)||(resultSet.results===null)){
			return '';
		}
        var maxSize=resultSet.results.length;
        var iAddressLoop=0;
        var returnCode='';
        for (iLoop=0;iLoop < maxSize;iLoop++){
                if(resultSet.results[iLoop].address_components!==undefined){
                        var addressCount = resultSet.results[iLoop].address_components.length;
                        for (iAddressLoop=0;iAddressLoop < addressCount;iAddressLoop++){
                                var iAdrTypeLoop=0;
                                var iAdrTypeCount=resultSet.results[iLoop].address_components[iAddressLoop].types.length;
                                for (iAdrTypeLoop=0;iAdrTypeLoop < iAdrTypeCount;iAdrTypeLoop++){
                                        if(resultSet.results[iLoop].address_components[iAddressLoop].types[iAdrTypeLoop].toUpperCase()==matchCode.toUpperCase()){
                                           returnCode=resultSet.results[iLoop].address_components[iAddressLoop].short_name.toUpperCase();
                                           break;                                                          
                                        }
                                }

                        }
                }                               

        }
        return returnCode;       
};

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//	PRIVATE HELPER FUNCTIONS END HERE
//	Scroll down to see what exports are available.
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//	PUBLIC EXPORTS START HERE
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

//-----------------------------------------------------------
//	Provider Name
//-----------------------------------------------------------
exports.ProviderName="Google";
//-----------------------------------------------------------
//	Provider Version
//-----------------------------------------------------------
exports.ProviderVersion=1;
//-----------------------------------------------------------
//	Provider Capabilities
//	This provides a list of the capabilities
//	of the content provider, such as the ability
//	to support radius filters or forward geo lookups
//-----------------------------------------------------------
exports.capabilities ={
	hasReverseGeo:true,
	reverseGeoAccuracy:'high',
	hasForwardGeo:true,
	forwardGeoAccuracy:'high'
};
//-----------------------------------------------------------
//	Many of the search APIs require API Key Information
//	This method can be used to set this information programmatically
//
//	Please note this will be different for each search provider
//
//------------------------------------------------
exports.providerSetup=function(providerDetails){};
//-----------------------------------------------------------
//	Many of the geo APIs require API Key Information
//	This method can be used to set this information by loading
//	the api information from a file.
//	
//	It is important to note the path provide should be from
//	the RESOURCES directory ie it isn't a relative path.
//	
//	Please note this will be different for each search provider
//
//------------------------------------------------
exports.providerSetupFromByFile=function(filePathFromResourceDir){};
//-----------------------------------------------------------
//	Provider Clean-up
//	This method contains any of the instructions needed
//	to shutdown the provider when the user has finished
//-----------------------------------------------------------
exports.providerCleanup=function(providerDetails){};


exports.reverseGeo=function(latitude,longitude,callback){
	Ti.API.info('In google provider');
	var results = {success:false};
	if(callback===null){
		throw "No callback method provided";
	}	
	if(!IsNumeric(latitude)){
		results.success=false;
		results.message= "latitude value of " + latitude + " is not a valid number";
		callback(results);
		return;
	}
	if(!IsNumeric(longitude)){
		results.success=false;
		results.message= "longitude value of " + longitude + " is not a valid number";
		callback(results);
		return;		
	}

	var query = "http://maps.google.com/maps/api/geocode/json?latlng="+ latitude +"," + longitude + "&sensor=false";
		var done = false;
		var xhr = Ti.Network.createHTTPClient();
		xhr.onload = function(){
			if (this.readyState == 4 && !done) {
				// convert the response JSON text into a JavaScript object
				var googleResults =JSON.parse(this.responseText);
				done=true;
				if((googleResults.results===null)||(googleResults.results===undefined)){
					results.success=false;
					results.message= 'Invalid return from Google';
					callback(results);	
					return;				
				}
				Ti.API.info('Results back');
				if(googleResults.results.length===0){
					results.success=false;
					results.message= 'No address information provided';
					callback(results);
					return;					
				}
				Ti.API.info('ddd 1');
				results.success=true;
				Ti.API.info('googleResults.results[0].formatted_address' + googleResults.results[0].formatted_address);
				Ti.API.info('locality' + findCodeInResults(googleResults.results[0],'LOCALITY'));
				Ti.API.info('regionCode' + findCodeInResults(googleResults.results[0],'administrative_area_level_1'));
				Ti.API.info('countryCode' + findCodeInResults(googleResults.results[0],'COUNTRY'));
				
				results.location = {
					address:googleResults.results[0].formatted_address,
					city:findCodeInResults(googleResults.results[0],'LOCALITY'),
					regionCode:findCodeInResults(googleResults.results[0],'administrative_area_level_1'),
					countryCode:findCodeInResults(googleResults.results[0],'COUNTRY'),
					latitude:latitude,
					longitude:longitude					
				};
				Ti.API.info('Google provider success');
				callback(results);
			}	
		};
		xhr.onerror = function(e){
			results.success=false;
			results.message= e.error;
			callback(results);
			return;					
		};			
      xhr.open('GET',query);
  	  xhr.send();
  	  		
};

//This is the standard interface for forward Geo
exports.forwardGeo=function(address,callback){
	var results = {success:false};
	if(callback===null){
		throw "No callback method provided";
	}	
	if(address===null){
		results.success=false;
		results.message= "No address provided";
		callback(results);
		return;
	}
	
	//TODO: Add logic
};
