/*jslint maxerr:1000 */
/*
 * Project Soup
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------
//	Provider Name : Yahoo Local
//	Provider Version: 1
//
//	You can get your Yahoo Local Key at the below url:
//	http://developer.yahoo.com/search/local/V3/localSearch.html
//
//	Before you get started make sure you read the Yahoo terms of service to make sure your usage is allowed.
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
//				id: This is an unique int within the search results based on the order the results are returned
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
	return ((apiInfo.appid!==null)&&(apiInfo.appid!==undefined));
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
function getAddress(ResultRow){
	var address = '';
	if((ResultRow.Address!==undefined)&&(ResultRow.Address!==null)){
		address+=ResultRow.Address;
	}
	if((ResultRow.City!==undefined)&&(ResultRow.City!==null)){
		address+=' ' + ResultRow.City;
	}
	if((ResultRow.State!==undefined)&&(ResultRow.State!==null)){
		address+=' ' + ResultRow.State;
	}	
	return safeTrim(address);
};
function getErrorMsg(results){
	if((results.Error.Message===undefined)||(results.Error.Message===null)){
		return results.Error.Title;
	}else{
		return results.Error.Message[0];
	}
};
function formatToStandardReturn(results){
	var outputResults ={};
	
	if((results.Error!==undefined)&&(results.Error!==null)){
		outputResults.success=false;
		outputResults.message=getErrorMsg(results);
		return outputResults;
	}
	var data = results.ResultSet.Result; //Create a shortcut
	var iLength = data.length;
	var iLoop=0;
	outputResults.success=true;
	outputResults.content=[];
	for (iLoop=0;iLoop < iLength;iLoop++){
		outputResults.content.push({
			id:iLoop,
			name: data[iLoop].Title,
			address: getAddress(data[iLoop]),
			image_url:null,
			phone : data[iLoop].Phone,
			web : null,
			email : null,			
			site_link : data[iLoop].Url,
			latitude : data[iLoop].Latitude,
			longitude : data[iLoop].Longitude,
			text : null,
			date_info : null,						
			raw_data : data[iLoop] //Add the full raw form data returned by the search provider's native API
		});	
	}
	
	return outputResults;	
};
function buildUrl(searchParameters){
	var baseUrl ="http://local.yahooapis.com/LocalSearchService/V3/localSearch?appid=" + _apiDetails.appid;

	if((searchParameters.query===undefined)||(searchParameters.query===null)){
		searchParameters.query="*"; //Add wildcard
	}
	//Add query element
	baseUrl+= '&query=' + '"' + searchParameters.query + '"'; 

	if((searchParameters.latitude!==undefined)&&(searchParameters.latitude!==null)&&
	   (searchParameters.longitude!==undefined)&&(searchParameters.longitude!==null)){
	   	if(IsNumeric(searchParameters.latitude)&&IsNumeric(searchParameters.longitude)){
			baseUrl+='&latitude=' + searchParameters.latitude + '&longitude=' + searchParameters.longitude;
			searchParameters.location=null;
	   	}
	 }	
	 
	 if((searchParameters.location!==undefined)&&(searchParameters.location!==null)){
	 	baseUrl+='&location=' + searchTermTokenize(searchParameters.location); 
	 }
	 
	 if((searchParameters.radius!==undefined)&&(searchParameters.radius!==null)){
	 	//Make sure we don't go below 1
	 	searchParameters.radius=(searchParameters.radius<1)? 1 : searchParameters.radius;
	 	baseUrl+='&radius=' + searchParameters.radius; 
	 }	
	 if((searchParameters.results===undefined)||(searchParameters.results===null)){
	 	searchParameters.results=20; 
	 }	 
	 //Make sure no one sneaks by adding more then 20 results
	 searchParameters.results = (searchParameters.results>20) ? 20 : searchParameters.results;
	 baseUrl+="&results=" + searchParameters.results;
	 baseUrl+="&output=json";
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
exports.providerName='YahooLocal';
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
	locationTextSearch:true,
	radiusSearch:true,
	termSearch:true
};
//-----------------------------------------------------------
//	Many of the search APIs require API Key Information
//	This method can be used to set this information programmatically
//	
//	Please note this will be different for each search provider
//
// 		{ 
// 			appid: "YOUR_API_ID", 
// 		}
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
//	For the Yahoo Local provider you need to have an the following
//	in your file.
//
// 		{ 
// 			appid: "YOUR_API_ID", 
// 		}
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
	var hasCoordinatesSet = false;
	
	if((criteria.latitude!==undefined)&&(criteria.latitude!==null)&&
	   (criteria.longitude!==undefined)&&(criteria.longitude!==null)){
	   	if(IsNumeric(criteria.latitude)&&IsNumeric(criteria.longitude)){
	   		hasCoordinatesSet=true;
	   		platformSpecificCriteria.latitude=criteria.latitude;
	   		platformSpecificCriteria.longitude=criteria.longitude;
	   	}
	   }
	   
	 if((criteria.address!==undefined)&&(criteria.address!==null)){
	 	if(!hasCoordinatesSet){
	 		platformSpecificCriteria.location=criteria.address;
	 	}
	 }
	 
	 if((criteria.term!==undefined)&&(criteria.term!==null)){
	 	platformSpecificCriteria.query=criteria.term;
	 }
 
	 if((criteria.radius!==undefined)&&(criteria.radius!==null)){
	 	platformSpecificCriteria.radius=criteria.radius;
	 }	 
	 
	  return platformSpecificCriteria;
};

//-----------------------------------------------------------
//	This method performs the search and provides a collection
//	to the callback method in the following format:
//	
//	You can read more about the native call here:
//	http://developer.yahoo.com/search/local/V3/localSearch.html
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
	
	//Check that we have at least some location info to use
	if((searchParameters.latitude===undefined)||(searchParameters.latitude===null)||
	  (searchParameters.longitude===undefined)||(searchParameters.longitude===null)){
	 	if((searchParameters.location===undefined)||(searchParameters.location===null)){
			results.success=false;
			results.message="An address or latitude & longitude must be provided to perform a search";
			callback(results);
			return;	 		
	 	}
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

//	PUBLIC EXPORTS END HERE
