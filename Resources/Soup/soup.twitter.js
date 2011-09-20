/*jslint maxerr:1000 */

//-----------------------------------------------------------
//	Provider Name : Twitter
//	Provider Version: 1
//
//	Public exports:
//	exports.providerName  -> Gives the name of the provider
//
//	exports.providerVersion -> Gives the version of the provider
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
function safeTrim(value){
	if((value===null)||(value===undefined)){
		return '';
	}else{
		return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	
	}	
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
function queryStringify(obj, sep, eq) {
    sep = sep || "&";
    eq = eq || "=";
    var qs = [], key, escape = encodeURIComponent;
    for (key in obj){
    	if (obj.hasOwnProperty(key)) {
        	qs.push(escape(key) + eq + escape(String(obj[key])));
       }
    }
    return qs.join(sep);
};
function buildPlacesUrl(searchParameters){
	var baseUrl ="http://api.twitter.com/1/geo/search.json?";
	if((searchParameters.latitude!==undefined)&&(searchParameters.latitude!==null)&&
	   (searchParameters.longitude!==undefined)&&(searchParameters.longitude!==null)){
	   	if(IsNumeric(searchParameters.latitude)&&IsNumeric(searchParameters.longitude)){
	   		baseUrl+="lat="+searchParameters.latitude+"&long="+searchParameters.longitude;
			delete searchParameters.latitude;
			delete searchParameters.longitude;			
	   	}
	   }	
	var otherParams = safeTrim(queryStringify(searchParameters));
	if(otherParams.length>0){
		baseUrl+='&'+ otherParams;
	}
	return baseUrl;
};

function midPoint(lat1, lon1, lat2,lon2){
		//Source Movable Type Scripts
		//http://www.movable-type.co.uk/scripts/latlong.html
		var Bx = Math.cos(lat2) * Math.cos(lon1);
		var By = Math.cos(lat2) * Math.sin(lon1);
		var lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2),
                   Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) ); 
		var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
		return {
			lat:lat3,
			lng:lon3
		};
};
function getPlaceCoord(place){
	var coords = null;
	if((place.contained_within!==undefined) && 
	   (place.contained_within!==null)){
	   	if(place.contained_within.length>0){
	   	 var box = place.contained_within[0].bounding_box;
	   	 if((box.coordinates!==undefined) && (box.coordinates!==null)){
		  	if(box.coordinates.length>0){
		  		var boxCoords = box.coordinates[0];
		  		if(boxCoords.length===4){
					var pointOne = (boxCoords[0] + '').split(',');
					var pointTwo = (boxCoords[1] + '').split(',');
								
					return {
						lat:((parseFloat(pointOne[1])+parseFloat(pointTwo[1]))/2),
						lng:((parseFloat(pointOne[0])+parseFloat(pointTwo[0]))/2)
					};		  			
		  		}	  		
		  	}
		   }
	   	}
	 }
	return coords;
};
function findFirstPlaceType(places,placeType){
	var iLength = places.result.places.length;
	var placeFound = {found:false,id:null,lat:null,lng:null};
	for (var iLoop=0;iLoop < iLength;iLoop++){
		if(places.result.places[iLoop].place_type.toUpperCase()===placeType.toUpperCase()){
			placeFound.found=true;
			placeFound.id = places.result.places[iLoop].id;
			var coords=getPlaceCoord(places.result.places[iLoop]);
			if(coords!==null){
				placeFound.lat=coords.lat;
				placeFound.lng=coords.lng;
			}
			break;
		}
	}
	
	return placeFound;
};
function getBestPlaceType(places){
	var place = findFirstPlaceType(places,'NEIGHBORHOOD');
	if(!place.found){
		place = findFirstPlaceType(places,'CITY');
	}
	if(!place.found){
		place = findFirstPlaceType(places,'ADMIN');
	}
	if(!place.found){
		place=null;
	}
	return place;
};

function getCoordinates(apiResults){
	var results = null;
	var coordsAr=null;
	//First we try the easy way. Twitter gives us a Geo Property
	if((apiResults.geo!==undefined)&& (apiResults.geo!==null)){
		if((apiResults.geo.coordinates!==undefined)&& (apiResults.geo.coordinates!==null)){
			if(apiResults.geo.coordinates.length==2){
				results = {
					latitude:apiResults.geo.coordinates[0],
					longitude:apiResults.geo.coordinates[1]
				};
			}
		}
	}else{
		//If there isn't a Geo Property, then check the location property
		if((apiResults.location!==undefined) && (apiResults.location!==null)){
			//The location property is a mess so we will need to parse
			//It looks like there can be anything before the : character
			if((apiResults.location.indexOf(":")>-1)&&(apiResults.location.indexOf(":")>-1)){
				var prefixPos = apiResults.location.indexOf(":") + 1;
				//Make sure we don't generate any errors
				if((prefixPos>apiResults.location.length)||(prefixPos===apiResults.location.length)){
					return null;
				}
				var mashedCoords = safeTrim(apiResults.location.substring(prefixPos,apiResults.location.length));
				if(mashedCoords.length===0){
					return null;
				}
				coordsAr=mashedCoords.split(",");
				if(coordsAr.length!==2){
					return null;
				}
				var lat=safeTrim(coordsAr[0]);
				var lng=safeTrim(coordsAr[1]);
				//Make sure they are numbers, trust is low when we have to parse
				if(IsNumeric(lat)&&IsNumeric(lng)){
					results = {
						latitude:lat,
						longitude:lng
					};						
				}					
			}
		}
	}
	return results;
};

	
function formatToStandardReturn(apiResults,searchParameters){
	var outputResults ={};
	var record={};
	var coords = null;
	if((apiResults.results===undefined)||(apiResults.results===null)||(apiResults.results.length===0)){
		outputResults.success=false;
		outputResults.message='No search results returned from Twitter';
		return outputResults;
	}
		
	 var data = apiResults.results; //Create a shortcut
	 var iLength = data.length;
	 var iLoop=0;
	 outputResults.success=true;
	 outputResults.content=[];
	 for (iLoop=0;iLoop < iLength;iLoop++){
		 	
			 record={
			 	 id:iLoop,
				 name: data[iLoop].from_user,
				 address:null,
				 image_url:data[iLoop].profile_image_url,
				 phone : null,
				 web : null,
				 email : null,			
				 site_link : 'http://twitter.com/' + data[iLoop].from_user + '/status/' + data[iLoop].id_str,
				 text : data[iLoop].text,
				 date_info : data[iLoop].created_at
			 };	
		 
		 	 coords=getCoordinates(data[iLoop]);
		 	 
		 	 if(coords!==null){
				record.latitude = coords.latitude;
				record.longitude = coords.longitude;	 	 	
		 	 }else{
				record.latitude = searchParameters.latitude;
				record.longitude = searchParameters.longitude;	 	 	
		 	 }

			//Add the full raw form data returned by the search provider's native API
			record.raw_data=data[iLoop];
			outputResults.content.push(record);	
				
	 }
	
	 return outputResults;
};

function doSearchWithPlace(places,searchParameters,mainCaller){
	var results = {success:false};
	var place = getBestPlaceType(places);
	if(!place.found){
		results.success=false;
		results.message= "Unable to find a twitter place nearby. Try entering a search term";
		mainCaller(results);
		return;
	}
	//Update the search params with the place coordinates
	if((place.lat!==null)&& (place.lat!==null)){
		if((!isNaN(place.lat))&& (!isNaN(place.lat))){
			searchParameters.latitude=place.lat;
			searchParameters.longitude=place.lng;			
		}	
	}

	var query = "http://search.twitter.com/search.json?q=place%3A"+place.id;	
	var done = false;
	var xhr = Ti.Network.createHTTPClient();
	xhr.onload = function(){
		if (this.readyState == 4 && !done) {
			var apiResults = JSON.parse(this.responseText);
			done=true;
			if(apiResults.error){
				results.success=false;
				results.message=apiResults.error[0].message;
				mainCaller(results);
				return;
			}			
			mainCaller(formatToStandardReturn(apiResults,searchParameters));
		}	
	};
	xhr.onerror = function(exr){
		Ti.API.info('error=' + exr.error);
		results.success=false;
		results.message= exr.error;
		mainCaller(results);		
	};
	
	xhr.open('GET',query);
	xhr.send();	
};
function doPlacesSearch(searchParameters,mainCaller){
	var results = {success:false};
	var qryParam = JSON.parse(JSON.stringify(searchParameters));
	var query = buildPlacesUrl(qryParam);
	var done = false;
	var xhr = Ti.Network.createHTTPClient();
	xhr.onload = function(){
		if (this.readyState == 4 && !done) {
			var apiResults = JSON.parse(this.responseText);
			done=true;
			if(apiResults.error){
				results.success=false;
				results.message=apiResults.error;
				mainCaller(results);
				return;
			}
			if(apiResults.result.places.count===0){
				results.success=false;
				results.message= 'Nearby Places not found on Twitter';
				mainCaller(results);	
				return;
			}
			doSearchWithPlace(apiResults,searchParameters,mainCaller);
		}	
	};
	xhr.onerror = function(exr){
		Ti.API.info('error=' + exr.error);
		results.success=false;
		results.message= exr.error;
		mainCaller(results);		
	};			
	
	xhr.open('GET',query);
	xhr.send();	
};

function doSearch(searchParameters,mainCaller){
	var results = {success:false};
	var query ="http://search.twitter.com/search.json?";
	var qryParam = JSON.parse(JSON.stringify(searchParameters));
	query += "geocode=" + qryParam.latitude + ',' + qryParam.longitude;
	delete qryParam.latitude; //Remove so this param wont be considered as part of queryStringify
	delete qryParam.longitude;//Remove so this param wont be considered as part of queryStringify	
	if((qryParam.radius!==undefined)&&(qryParam.radius!==null)){
		query+=',' + qryParam.radius;
		//Check if radius provided, if it is just a number make it km
		if(IsNumeric(qryParam.radius)){
			query+='km';
		}
		delete qryParam.radius;	//Remove so this param wont be considered as part of queryStringify
	}	
	//Build the rest of the parameters
	var params = safeTrim(queryStringify(qryParam));
	if(params.length>0){
		query+= '&' + params;
	}

	var done = false;
	var xhr = Ti.Network.createHTTPClient();
	xhr.onload = function(){
		if (this.readyState == 4 && !done) {
			var apiResults = JSON.parse(this.responseText);
			done=true;
			if(apiResults.error){
				results.success=false;
				results.message=apiResults.error[0].message;
				mainCaller(results);
				return;
			}
			if(apiResults.results.count===0){
				results.success=false;
				results.message= 'No Nearby tweets found';
				mainCaller(results);	
				return;
			}
			mainCaller(formatToStandardReturn(apiResults,searchParameters));
		}	
	};
	xhr.onerror = function(exr){
		Ti.API.info('error=' + exr.error);
		results.success=false;
		results.message= exr.error;
		mainCaller(results);		
	};			
	
	xhr.open('GET',query);
	xhr.send();		
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
exports.providerName='Twitter';
//-----------------------------------------------------------
//	Provider Version
//-----------------------------------------------------------
exports.providerVersion=1;

//-----------------------------------------------------------
//	Many of the search APIs require API Key Information
//	This method can be used to set this information programmatically
//	
//	Please note this will be different for each search provider
//
//	For this twitter provider we are using APIs that do not
//	require authentication, but be careful they are rate limited
//
//-----------------------------------------------------------
exports.contentSetup=function(setupDetails){
	Ti.API.info('This twitter provider does not require authentication');
	Ti.API.info('Anything you pass in here will be ignored');
	Ti.API.info("We're just using the public API");
	Ti.API.info("But there is a rate limit so be careful");
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
//	For this twitter provider we are using APIs that do not
//	require authentication, but be careful they are rate limited
//
//-----------------------------------------------------------
exports.contentSetupFromByFile=function(filePathFromResourceDir){
	Ti.API.info('This twitter provider does not require authentication');
	Ti.API.info('Anything you pass in here will be ignored');
	Ti.API.info("We're just using the public API");
	Ti.API.info("But there is a rate limit so be careful");
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
	if((criteria.latitude!==undefined)&&(criteria.latitude!==null)&&
	   (criteria.longitude!==undefined)&&(criteria.longitude!==null)){
	   	if(IsNumeric(criteria.latitude)&&IsNumeric(criteria.longitude)){
	   		platformSpecificCriteria.latitude=criteria.latitude;
	   		platformSpecificCriteria.longitude=criteria.longitude;
	   	}
	   }

	 
	 if((criteria.term!==undefined)&&(criteria.term!==null)){
	 	platformSpecificCriteria.q=criteria.term;
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
	
	if((searchParameters===undefined)||(searchParameters===null)){
		results.success=false;
		results.message="Please provide search criteria";
		callback(results);
		return; 		
	}
	
	if((searchParameters.latitude===undefined)||(searchParameters.latitude===null)||
	 (searchParameters.longitude===undefined)||(searchParameters.longitude===null)){
		results.success=false;
		results.message="Latitude & longitude must be provided to perform a search";
		callback(results);
		return; 		
	}
	
	//If there is no search term the provider will find the nearest place
	//and return all of the tweets associated with that place
	if((searchParameters.q!==undefined)&&(searchParameters.q!==null)){
		//Since a term is provided we can just use the standard search
		doSearch(searchParameters,callback);
	}else{
		//Since no term is provided we're going to find the nearest place
		//and return the tweets for the place
		doPlacesSearch(searchParameters,callback);	
	}
};
