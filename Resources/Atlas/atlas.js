/*
 * Project Atlas
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/*jslint maxerr:1000 */
//Add protoypes we need
Number.prototype.toRad = function() {
   return this * Math.PI / 180;
};

Number.prototype.toDeg = function() {
   return this * 180 / Math.PI;
};

//Helper functions taken from php.js
function rad2deg (angle) {
   return angle * 57.29577951308232; 
};

function deg2rad (angle) {
   return (angle / 180) * Math.PI;
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

//These are the comment device geo methods
var _geo = {
	
	enabled : function(){
		
		if(!Ti.Geolocation.locationServicesEnabled){
			return false;
		}
		
		//If we're on iOS
		if (Ti.Platform.name !== 'android') {
			var authorization = Titanium.Geolocation.locationServicesAuthorization;
			if (authorization == Titanium.Geolocation.AUTHORIZATION_DENIED) {
				return false;
			}
			else if (authorization == Titanium.Geolocation.AUTHORIZATION_RESTRICTED) {
				return false;
			}			
		}
		
		return true;
	},
	//Wrapper around Ti functions to get Heading
	getCurrentHeading : function(callback){
		var results = {success:false};
		if(!_geo.enabled()){
			results.success=false;
			results.message="Your device's geo location services are not enabled";
			return results;
		}
		if(callback===null){
			results.success=false;
			results.message="No callback method provided";
			return results;
		}		
		Ti.Geolocation.getCurrentHeading(function(e){
			if (!e.success || e.error){
				results.success=false;
				if(Ti.Platform.name!=='android'){
					results.message=translateErrorCode(e.code);
				}else{
					results.message=translateErrorCode(e.error.code);	
				}
								
				if((callback!==null)&&(callback!==undefined)){
					callback(results);	
				}
				return;
			}
			results.success=true;	
			results.x = e.heading.x;
			results.y = e.heading.y;
			results.z = e.heading.z;
			results.magneticHeading = e.heading.magneticHeading;
			results.accuracy = e.heading.accuracy;
			results.trueHeading = e.heading.trueHeading;
			results.timestamp = e.heading.timestamp;
			if((callback!==null)&&(callback!==undefined)){
				callback(results);	
			}
		});		
	},
	//Wrapper around Ti functions to get GPS coordinates
	getCurrentCoordinates : function(callback){
		var results = {success:false};
		if(!_geo.enabled()){
			results.success=false;
			results.message="Your device's geo location services are not enabled";
			return results;
		}
		if(callback===null){
			results.success=false;
			results.message="No callback method provided";
			return results;
		}		
		Ti.Geolocation.getCurrentPosition(function(e){
			if (!e.success || e.error){
				results.success=false;
				Ti.API.info('atlas error ' + e.error);
				results.message=translateErrorCode(e.code);
				callback(results);	
				return;
			}
			
			if((e.coords.longitude===undefined)||(e.coords.longitude===null)||
			  (e.coords.latitude===undefined)||(e.coords.latitude===null)){
				results.success=false;
				results.message="Invalid coordinate information provided by device";
				callback(results);	
				return;				
			}
			
			results.success=true;			
			results.longitude = e.coords.longitude;
			results.latitude = e.coords.latitude;
			results.altitude = e.coords.altitude;
			results.heading = e.coords.heading;
			results.accuracy = e.coords.accuracy;
			results.speed = e.coords.speed;
			results.timestamp = e.coords.timestamp;
			results.altitudeAccuracy = e.coords.altitudeAccuracy;
			Ti.API.info('longitude=' + results.longitude);
			Ti.API.info('latitude=' + results.latitude);
			callback(results);	
		
		});		
	},
	//Method to setup all of the Ti.Geolocation values
	setup : function(setupDetails){
		if((setupDetails.purpose!==undefined)&&(setupDetails.purpose!==undefined)){
			Ti.Geolocation.purpose=setupDetails.purpose;
		}
		if((setupDetails.accuracy!==undefined)&&(setupDetails.accuracy!==undefined)){
			Ti.Geolocation.accuracy=setupDetails.accuracy;
		}	
		if((setupDetails.preferredProvider!==undefined)&&(setupDetails.preferredProvider!==undefined)){
			Ti.Geolocation.preferredProvider=setupDetails.preferredProvider;
		}
		if((setupDetails.headingFilter!==undefined)&&(setupDetails.headingFilter!==undefined)){
			Ti.Geolocation.headingFilter=setupDetails.headingFilter;
		}
		if((setupDetails.distanceFilter!==undefined)&&(setupDetails.distanceFilter!==undefined)){
			Ti.Geolocation.distanceFilter=setupDetails.distanceFilter;
		}
	},
	setSccuracy : function(accuracy){
		// SET ACCURACY - THE FOLLOWING VALUES ARE SUPPORTED
		// Titanium.Geolocation.ACCURACY_BEST
		// Titanium.Geolocation.ACCURACY_NEAREST_TEN_METERS
		// Titanium.Geolocation.ACCURACY_HUNDRED_METERS
		// Titanium.Geolocation.ACCURACY_KILOMETER
		// Titanium.Geolocation.ACCURACY_THREE_KILOMETERS		
		Ti.Geolocation.accuracy = accuracy;
	},
	setPreferredProvider : function(preferredProvider){
		Ti.Geolocation.preferredProvider = preferredProvider;
	},
	setPurpose : function(purpose){
		Ti.Geolocation.purpose = purpose;
	}
};

//If geo is enabled try to set some defaults
if(_geo.enabled()){
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
	Ti.Geolocation.preferredProvider = "gps";
	Ti.Geolocation.purpose = "GPS access for App usage";
	Ti.Geolocation.headingFilter = 90;
	Ti.Geolocation.distanceFilter = 10;
	if (Ti.Geolocation.hasCompass){
		//  TURN OFF ANNOYING COMPASS INTERFERENCE MESSAGE
		Ti.Geolocation.showCalibration = false;
	}
}

var _math = {
	
	addDistance2Coords : function (lat,lon,bearing,distance) {
		var radius = 6371000; //Meters
		var adjustedLat = rad2deg(Math.asin(Math.sin(deg2rad(lat)) * Math.cos(distance / radius) + Math.cos(deg2rad(lat)) * Math.sin(distance / radius) * Math.cos(deg2rad(bearing))));
		var adjustedLon = rad2deg(deg2rad(lon) + Math.atan2(Math.sin(deg2rad(bearing)) * Math.sin(distance / radius) * Math.cos(deg2rad(lat)), Math.cos(distance / radius) - Math.sin(deg2rad(lat)) * Math.sin(deg2rad(adjustedLat))));
		 return {lat:adjustedLat,lon:adjustedLon}; 
	},
	
	distanceBetweenCoords: function(lat1, lon1, lat2, lon2) {
		//http://www.codecodex.com/wiki/Calculate_distance_between_two_points_on_a_globe#JavaScript
		var R = 6371000; // Meters
		var dLat = (lat2-lat1)*Math.PI/180;  
		var dLon = (lon2-lon1)*Math.PI/180;   
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +  
		        Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *   
		        Math.sin(dLon/2) * Math.sin(dLon/2);   
		var c = 2 * Math.asin(Math.sqrt(a));   
		var distance = R * c; //In meters
		
		return distance;
	},
	
	bearing : function(lat1, lon1, lat2, lon2){
		//Source Movable Type Scripts
		//http://www.movable-type.co.uk/scripts/latlong.html
		  var calcLat1 = lat1 * Math.PI/180;
		  var calcLat2 = lat2 * Math.PI/180;
		  var dlng = (lon2 - lon1) * Math.PI/180;
		
		  var y = Math.sin(dlng) * Math.cos(calcLat2);
		  var x = Math.cos(calcLat1) * Math.sin(calcLat2) -
		          Math.sin(calcLat1) * Math.cos(calcLat2) * Math.cos(dlng);
		  var brng = Math.atan2(y, x);
		  return brng;	
	},
	midPoint : function(lat1, lon1, lat2){
		//Source Movable Type Scripts
		//http://www.movable-type.co.uk/scripts/latlong.html
		var Bx = Math.cos(lat2) * Math.cos(lon1);
		var By = Math.cos(lat2) * Math.sin(lon1);
		var lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2),
                   Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) ); 
		var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
		return {
			lat:lat3,
			lon:lon3
		};
	},
	meters2Miles : function(meters){
		var miles = meters * 0.00062137119;
		return miles;
	},
	miles2Meters : function(miles){
		if(miles===0){
			return 0;
		}
		var meters = miles * 1609.344;
		return meters;
	}	
};


var _shapes = {
	createSqArea : function(lat1,lon1,lat2,lon2){
		var northPoint = Math.max(lat1,lat2);
		var southPoint = Math.min(lat1,lat2);
		var eastPoint = Math.max(lon1,lon2);
		var westPoint = Math.min(lon1,lon2);
		return {
		   NorthWest:{
		      lat:northPoint,
		      lon:westPoint
		   },
		   NorthEast : {
		    lat:northPoint,
		    lon:eastPoint
		   },
		   SouthWest:{
		      lat:southPoint,
		      lon:westPoint
		   },
		   SouthEast : {
		      lat:southPoint,
		      lon:eastPoint
		   },
		   width:_math.distanceBetweenCoords(northPoint, westPoint, northPoint, eastPoint),
		   height:_math.distanceBetweenCoords(northPoint, eastPoint, southPoint, eastPoint),
		   isInSqArea : function(lat,lon){
		   	return (
		   		((lat<northPoint)||(lat==northPoint))&&
		   		((lat>southPoint)||(lat==southPoint))&&
		   		((lon<eastPoint)||(lon==eastPoint))&&
		   		((lon>southPoint)||(lon==southPoint))
		   	);
		   }
		 };
	}
};

var test =[];

var _providers = [];
var _activeProvider =null;
	
var _find = {

	buildProviders : function(providerList){	
		
		if(providerList===undefined || providerList===null || providerList.length===0){
			throw "you need at least one provider";
		}
		_providers=[]; //Reset
		var iLength = providerList.length;
		for (var iLoop=0;iLoop < iLength;iLoop++){
			
			if(providerList[iLoop].providerPath!==undefined && 
			   providerList[iLoop].providerPath!==null && 
			   providerList[iLoop].providerPath.length > 0){
				_providers.push(require(providerList[iLoop].providerPath));
			}			
		}
		
		_activeProvider=_providers[0];
	},
	setProviderById : function(providerId){
		_activeProvider=_providers[providerId];
	},
	doReverseGeo : function(latitude,longitude,callback){
		if(_activeProvider===null){
			throw "something went wrong try to build providers again";
		}
		
		_activeProvider.reverseGeo(latitude,longitude,callback);
	},
	doForwardGeo : function(address,callback){
		if(_activeProvider===null){
			throw "something went wrong try to build providers again";
		}
		
		_activeProvider.forwardGeo(address,callback);
	}
	
};


//Set the functions so they are available via exports
exports.Math = _math;
exports.Shapes = _shapes;
exports.Geo = _geo;
exports.Find=_find;