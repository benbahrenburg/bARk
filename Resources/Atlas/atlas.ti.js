/*jslint maxerr:1000 */
/*
 * Project Atlas
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------
//	Provider Name : Titanium
//	Provider Version: 1
//
//	These methods are part of the Titanium mobile SDK
//	Learn more about them at http://developer.appcelerator.com
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
function translateErrorCode(code) {
	if (code === null) {
		return 'Unknown';
	}
	switch (code) {
		case Ti.Geolocation.ERROR_LOCATION_UNKNOWN:
			return "Location unknown";
		case Ti.Geolocation.ERROR_DENIED:
			return "Access denied";
		case Ti.Geolocation.ERROR_NETWORK:
			return "Network error";
		case Ti.Geolocation.ERROR_HEADING_FAILURE:
			return "Failure to detect heading";
		case Ti.Geolocation.ERROR_REGION_MONITORING_DENIED:
			return "Region monitoring access denied";
		case Ti.Geolocation.ERROR_REGION_MONITORING_FAILURE:
			return "Region monitoring access failure";
		case Ti.Geolocation.ERROR_REGION_MONITORING_DELAYED:
			return "Region monitoring setup delayed";
		default:
			return 'Unknown';
	}
};

function safeTrim(value){
	if((value===null)||(value===undefined)){
		return '';
	}else{
		return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	
	}	
};

function findCountryCode(place){
	//Account for the differences between Android & iOS reverse geo return
	if((place.country_code!==undefined)&&(place.country_code!==null)){
		return safeTrim(place.country_code);
	}else{
		if((place.countryCode!==undefined)&&(place.countryCode!==null)){
			return safeTrim(place.countryCode);
		}else{
			return null;
		}
	}
};	

function getUSCAStateCode(address){
	var arPlaces = [];
	var offset=2;
	arPlaces=address.split(',');
	var iLength = arPlaces.length;
	iLength=((iLength-offset)>-1)? (iLength-offset): 0;
	var stateCode = safeTrim(arPlaces[iLength]);
	if(stateCode.length>2){
		stateCode=stateCode.substring(0,2);
	}
	return stateCode;		
};

function getRegionCode(countryCode,address){
	var regionCode = null;
	
	if((countryCode=='US')||(countryCode=='CA')){
		regionCode=getUSCAStateCode(safeTrim(address));
	}
		
	return regionCode;
};
//Fix an issue with empty quotes being returned from the provider
function fixEmptyQuotes(value){
	var parts = value.split(',');
	var iLength = parts.length;
	var results = '';
	var checkValue ='';
	for (var iLoop = 0; iLoop < iLength; iLoop++) {
		checkValue=safeTrim(parts[iLoop]); 
		if(safeTrim(parts[iLoop]).length>0){
			results+=((iLoop===0)?'':', ') +  checkValue; 
		}
	}
	
	return results;
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
exports.ProviderName="Titanium";
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
//	No provider key or other setup information is needed
//	for the native Titanium provider.  Any values passed
//	into this method will be ignored.	
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
//	No provider key or other setup information is needed
//	for the native Titanium provider.  Any values passed
//	into this method will be ignored.	
//------------------------------------------------
exports.providerSetupFromByFile=function(filePathFromResourceDir){};
//-----------------------------------------------------------
//	Provider Clean-up
//	This method contains any of the instructions needed
//	to shutdown the provider when the user has finished
//-----------------------------------------------------------
exports.providerCleanup=function(providerDetails){};

//This is the standard interface for reverseGeo
exports.reverseGeo=function(latitude,longitude,callback){
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
	
	Ti.Geolocation.reverseGeocoder(latitude,longitude,function(evt){

		if(evt.success){
			var places = evt.places;

			if((places!==null)&&(places.length>0)){
				results.success=true;
				results.location = {
					address:safeTrim(fixEmptyQuotes(places[0].address)),
					city:null,
					regionCode:getRegionCode(safeTrim(places[0].address)),
					countryCode:findCountryCode(places[0]),
					latitude:latitude,
					longitude:longitude
				};

			}else{
				results.success=false;
				results.message="No address found";				
			}
			if((callback!==null)&&(callback!==undefined)){
				callback(results);	
			}
		}else{
			results.success=false;
			results.message=translateErrorCode(evt.code);
			if((callback!==null)&&(callback!==undefined)){
				callback(results);	
			}
		}
	});	
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
		
	Ti.Geolocation.forwardGeocoder(address,function(evt){
		if(evt.success){
			results.success=true;
			results.latitude=evt.latitude;
			results.longitude=evt.longitude;
			if((callback!==null)&&(callback!==undefined)){
				callback(results);	
			}			
		}else{
			results.success=false;
			results.message=translateErrorCode(evt.code);
			if((callback!==null)&&(callback!==undefined)){
				callback(results);	
			}			
		}
	});	
};