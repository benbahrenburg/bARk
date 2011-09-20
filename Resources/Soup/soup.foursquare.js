/*jslint maxerr:1000 */
/*
 * Project Soup
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------
//	Provider Name : FourSquare
//	Provider Version: 1
//
//	You can get your FourSquare Keys at the below url:
//	https://developer.foursquare.com/
//
//	Before you get started make sure you read the FourSqaure terms of service to make sure your usage is allowed.
//
//	Public exports:
//	exports.providerName  -> Gives the name of the provider
//
//	exports.providerVersion -> Gives the version of the provider
//
//	exports.capabilities	-> Provies a list of the providers capabilities
//
//	exports.contentSetup -> Provides the provider setup details
//							such as api and other keys
//
//	exports.contentSetupFromByFile -> Loads setup information
//									from a file. The file path
//									is from the Resources directory
//
//	exports.buildSearchCriteria -> Platform agnostic search criteria builder
//
//	The criteria object can have any of the following:
// 	{
// 		latitude: (optional) put your latitude value in this property, 
// 		longitude: (longitude) put your latitude value in this property,
// 		address: such as a city or street (if lat & lon are provide this is skipped)
// 		radius : this is used to determine the search radius if the provider supports this,
// 		term : narrow your by a specific term such as sushi
// 	}
//
//	exports.searchContent -> Performs the search and provides the results
//							to a callback method in the following format:
//
//		success :true/false this provides an indicator if there is an error,
//		message: if there is a message this will tell us what it is,
// 		content:[
// 			{
// 				name: This is the name of the search value,
// 				address: This is the address of the search value,
// 				image_url : Image Url to be displayed,
// 				phone: Phone number of the search result if applies otherwise is null,
// 				web: Web Address of the search result if applies otherwise is null,
// 				email: email address of the search result if applies otherwise is null,
// 				site_link : links to the content providers site entry,
// 				latitude: latitude of the search result,
// 				longitude: longitude of the search result,
// 				text : description or other text to be displayed
// 			}
// 		]

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//	PRIVATE HELPER FUNCTIONS START HERE
//	Scroll down to see what exports are available.
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
var _apiDetails=null;

function isValidApiDetails(apiInfo){
	if(apiInfo===null){
		return false;
	}	
	return ((apiInfo.client_id!==null)&&(apiInfo.client_id!==undefined)&&
			(apiInfo.client_secret!==null)&&(apiInfo.client_secret!==undefined));
};
function searchTermTokenize(searchTerm){
	return searchTerm.replace(' ','+');
};
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
function getIcon(categories){
	if((categories===undefined)||(categories===null)){
		return null;
	}
	if(categories.length===0){
		return null;
	}
	return categories[0].icon;
};
function getAddress(location){
	var address = '';
	if((location===undefined)||(location===null)){
		return null;
	}

	if((location.address!==undefined)&&(location.address!==null)){
		address+=' ' + location.address;
	}	
	if((location.city!==undefined)&&(location.city!==null)){
		address+=' ' + location.city;
	}
	if((location.state!==undefined)&&(location.state!==null)){
		address+=' ' + location.state;
	}	
	
	return safeTrim(address);
};
function getCoordinates(location,isLat){

	if((location===undefined)||(location===null)){
		return null;
	}

	if(isLat){
		if((location.lat!==undefined)&&(location.lat!==null)){
			return location.lat;	
		}else{
			return null;
		}			
	}else{
		if((location.lng!==undefined)&&(location.lng!==null)){
			return location.lng;	
		}else{
			return null;
		}		
	}
};
function formatToStandardReturn(results){
	 var outputResults ={};

	if((results.meta.errorType!==undefined)&&(results.meta.errorType!==null)){
		outputResults.success=false;
		outputResults.message=results.meta.errorDetail;
		return outputResults;
	}
	 var data = results.response.venues; //Create a shortcut
	 var iLength = data.length;
	 var iLoop=0;
	 outputResults.success=true;
	 outputResults.content=[];
	 for (iLoop=0;iLoop < iLength;iLoop++){
		 outputResults.content.push({
		 	 id:iLoop,
			 name: data[iLoop].name,
			 address: getAddress(data[iLoop].location),
			 image_url:getIcon(data[iLoop].categories),
			 phone : null,
			 web : null,
			 email : null,			
			 site_link : 'https://foursquare.com/venue/' + data[iLoop].id,
			 latitude : getCoordinates(data[iLoop].location,true),
			 longitude : getCoordinates(data[iLoop].location,false),
			 text : null,
			 date_info : null,
			 raw_data : data[iLoop] //Add the full raw form data returned by the search provider's native API 
		 });	
	 }
	
	 return outputResults;	
};
function zeroPad(value){
	return (value<10) ? '0' + value : value;
};
function buildUrl(searchParameters){
	var baseUrl ="https://api.foursquare.com/v2/venues/search?";
	//Add our API keys
	baseUrl+="&client_id=" + _apiDetails.client_id;
	baseUrl+="&client_secret=" + _apiDetails.client_secret;
	//Add Coordinates
	baseUrl+="&ll=" + searchParameters.ll;

	if((searchParameters.query!==undefined)&&(searchParameters.query!==null)){
		baseUrl+='&query=' + searchTermTokenize(searchParameters.query); 
	}
	 	
	//Add number of records returned
	if((searchParameters.limit===undefined)||(searchParameters.limit===null)){
 		searchParameters.limit=25; 
	}

	//Make sure no one sneaks by adding more then 20 results
	searchParameters.limit = (searchParameters.limit>50) ? 50 : searchParameters.limit;
	baseUrl+="&limit=" + searchParameters.limit;
	
	//Always call the most recent API
	baseUrl+="&v=" + new Date().getFullYear() + zeroPad(new Date().getMonth()+1) + zeroPad(new Date().getDate());
	
	return baseUrl; 
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
exports.providerName='FourSquare';
//-----------------------------------------------------------
//	Provider Version
//-----------------------------------------------------------
exports.providerVersion=1;
//-----------------------------------------------------------
//	Provider Capabilities
//	This provides a list of the capabilities
//	of the content provider, such as the ability
//	to support radius filters or forward geo lookups
//-----------------------------------------------------------
exports.capabilities ={
	coordinateSearch:true,
	locationTextSearch:false,
	radiusSearch:false,
	termSearch:true
};
//-----------------------------------------------------------
//	Many of the search APIs require API Key Information
//	This method can be used to set this information programmatically
//	
//	Please note this will be different for each search provider
//
//-----------------------------------------------------------
exports.contentSetup=function(setupDetails){
	if(!isValidApiDetails(setupDetails)){
		throw "invalid api key details provided";
	}		
	_apiDetails=setupDetails;	
};

//-----------------------------------------------------------
//	Many of the search APIs require API Key Information
//	This method can be used to set this information by loading
//	the api information from a file.
//	
//	It is important to note the path provide should be from
//	the RESOURCES directory ie it isn't a relative path.
//	
//	Please note this will be different for each search provider
//
//-----------------------------------------------------------
exports.contentSetupFromByFile=function(filePathFromResourceDir){
	var fileResults  = null;
	var file = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filePathFromResourceDir);
	if(file.exists()){
		var contents = JSON.parse(''+file.read());
		if(!isValidApiDetails(contents)){
			 throw "invalid api key details provided";
		 }			
		_apiDetails=contents;
	}else{
		throw "File " + filePathFromResourceDir + " do not exist. Make sure you start the path from the Resource directory.";
	}	
};

//-----------------------------------------------------------
//	This method provides an obstraction layer on top 
//	of each search providers criteria.
//
//	Pass an object with any of the following
//	properties and we will create the native format for you
//
//	Native API details can be found here:
//	https://developer.foursquare.com/docs/venues/search.html
//
//	The criteria object can have any of the following:
	// {
		// latitude: (optional) put your latitude value in this property, 
		// longitude: (longitude) put your latitude value in this property,
		// address: such as a city or street (if lat & lon are provide this is skipped)
		// radius : this is used to determine the search radius if the provider supports this,
		// term : narrow your by a specific term such as sushi
	// }
//-----------------------------------------------------------
exports.buildSearchCriteria=function(criteria){
	var platformSpecificCriteria = {};
	
	//FourSquare doesn't provide much in the way of filters, so we ignore most
	if((criteria.latitude!==undefined)&&(criteria.latitude!==null)&&
	   (criteria.longitude!==undefined)&&(criteria.longitude!==null)){
	   	if(IsNumeric(criteria.latitude)&&IsNumeric(criteria.longitude)){
	   		platformSpecificCriteria.ll=criteria.latitude + ',' + criteria.longitude;
	   	}
	   }
 	 
	 if((criteria.term!==undefined)&&(criteria.term!==null)){
	 	platformSpecificCriteria.query=criteria.term;
	 }
	 
	 return platformSpecificCriteria;
};

//-----------------------------------------------------------
//	This method performs the search and provides a collection
//	to the callback method in the following format:
//	
//	success :true/false this provides an indicator if there is an error,
//	message: if there is a message this will tell us what it is,
// content:[
	// {
		// name: This is the name of the search value,
		// address: This is the address of the search value,
		// image_url : Image Url to be displayed,
		// phone: Phone number of the search result if applies otherwise is null,
		// web: Web Address of the search result if applies otherwise is null,
		// email: email address of the search result if applies otherwise is null,
		// site_link : links to the content providers site entry,
		// latitude: latitude of the search result,
		// longitude: longitude of the search result,
		// text : description or other text to be displayed,
		// date_info : if available date/time information associated with the search record
	// }
// ]
//-----------------------------------------------------------
exports.searchContent=function(searchParameters,callback){
	var results = {success:false};
	if(callback===null){
		throw "No callback method provided";
	}	
	
	if(!isValidApiDetails(_apiDetails)){
		results.success=false;
		results.message= "invalid api key details provided";
		callback(results);
		return;
	}

	if((searchParameters===undefined)||(searchParameters===null)){
		results.success=false;
		results.message="Please provide search criteria";
		callback(results);
		return; 		
	}
	
	if((searchParameters.ll===undefined)||(searchParameters.ll===null)){
		results.success=false;
		results.message="Coordinate information has not been set, we are unable to perform a search";
		callback(results);
		return; 		
	}
		
	var query = buildUrl(searchParameters);
	var done = false;
	var xhr = Ti.Network.createHTTPClient();
	xhr.onload = function(){
		if (this.readyState == 4 && !done) {
			var apiResults = JSON.parse(this.responseText);
			done=true;
			callback(formatToStandardReturn(apiResults));
		}	
	};
	xhr.onerror = function(exr){
		Ti.API.info('error=' + exr.error);
		results.success=false;
		results.message= exr.error;
		callback(results);		
	};			
	
	xhr.open('GET',query);
	xhr.send();	
};
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//	PUBLIC EXPORTS END HERE

