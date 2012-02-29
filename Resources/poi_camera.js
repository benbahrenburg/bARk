/*jslint maxerr:10000 */
//-----------------------------------------------------------
/*
 * Parts of this file where taken from, inspired by,
 * or otherwise leveraged from the Arti project.
 * 
 * Please check out the origional project at
 * https://github.com/appcelerator-titans/ARti
 * 
 * ARTi like bARk is also under the 
 * Apache Public License (version 2)
 */
//-----------------------------------------------------------


//-----------------------------------------------------------
/*
 * bARk
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------

var _maxDistance = 0; //The _maxDistance is used to layout all of the radar points properly
var _deviceBearing = 0; //Current bearing of the device.
var yellow='#ded32a';
var _bearingChanged=true;
var _timerId = null;
var _isSimulator=false;
var _infoView=null;
var _bark=null;

function setDeviceBearing(bearing){
	_deviceBearing=bearing;
};
function setMaxDistance(distance){
	_maxDistance=distance;
};

function convertMeters2KM(value){
	if(value===0){
		return 0;
	}
	
	return value/1000;
};

function Bearing(point1, point2) {
  var lat1 = point1.latitude * Math.PI/180;
  var lat2 = point2.latitude * Math.PI/180;
  var dlng = (point2.longitude - point1.longitude) * Math.PI/180;

  var y = Math.sin(dlng) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
  var brng = Math.atan2(y, x);
  return brng;
};
	
Number.prototype.toRad = function() {
   return this * Math.PI / 180;
};

Number.prototype.toDeg = function() {
   return this * 180 / Math.PI;
};
function ComputeXDelta(relAngle,viewAngleX) {
    var res = Math.sin(relAngle) / Math.sin(viewAngleX /2);
    return res;
};

function cleanUpOnClose(){
	if(_timerId!==null){
		clearInterval(_timerId);
	}			
};	
	
exports.headingCallback=function(e){
	if (e.error){
		var errMsg = Ti.UI.createAlertDialog({title:'Error',message:e.code});
		errMsg.show();
		return;
	}

	_bearingChanged=true;
	_deviceBearing = e.heading.magneticHeading.toRad();
};
exports.setupGPSHeadingInfo=function(){
	Ti.Geolocation.preferredProvider = "gps";//We want to use GPS here
	Ti.Geolocation.purpose = "bARK demo"; //Set the info
	Ti.Geolocation.showCalibration = true; //Ask the user to calibrate
	Ti.Geolocation.headingFilter = 1; //Set the filter to 1 so it will fire when you move your hand
};
exports.updateInfoWindow=null;

exports.mgtInfoWindow=function(contentName,contentMore,link,distance){
	if(_infoView.visible===false){
		_infoView.visible=true;
	}
	exports.updateInfoWindow(contentName,contentMore,link,distance);
};
exports.showItemDetail=null;
exports.fetchDetailView = function(){
	var vwBackground = Ti.UI.createView({
										backgroundColor:'#000',
										top:0,
										left:0,
										right:0,
										bottom:0,
										//opacity:0.8,
										zIndex:9001,
										visible:false
										});
	var vwCloseImg = Ti.UI.createView({
										backgroundImage:'./Images/close_icon.png',
										height:34,
										width:34,
										top:15,
										right:3,
										zIndex:9002
										});
	var nameLabel = Ti.UI.createLabel({
		text: 'test',
		color: '#ded32a',
		textAlign: "left",
		left:5,
		width:200,
		top: 13,
		height: 35,
		zIndex:9003,
		font: {fontSize: 24, fontFamily:"HelveticaNeue-Bold"}
	});
	
	if(!_bark.session.isAndroid){
		vwBackground.add(vwCloseImg);		
	}

	vwBackground.add(nameLabel);

	vwCloseImg.addEventListener('click', function(e){	
		vwBackground.visible=false;
	});	

	var offset = (_bark.session.isAndroid)? 50 : 100;
	if(_isSimulator){
		offset = (_bark.session.isAndroid)? 45 : 50;
	}
	var webView = Ti.UI.createWebView({
		top:offset,
		bottom:0,
		zIndex:9004,
		opacity:1
	});
	vwBackground.add(webView);
		
	function showItemDetail(itemTitle,itemUrl){
		vwBackground.visible=true;
		nameLabel.text=itemTitle;
		webView.url=itemUrl;
	}
	exports.showItemDetail=showItemDetail;
	return vwBackground;	
};
exports.fetchInfoView=function(){
	_infoView = Ti.UI.createView({
		height:100,
		width:250,
		visible:false,
		bottom:(_isSimulator)? 50 :10,
		backgroundColor:'#e7e7e8',
		zIndex:9000
		});
	var vwClose = Ti.UI.createView({top:1,right:3,width:20,height:20,backgroundImage:'./Images/dark_x-2.png'});
	_infoView.add(vwClose);
	
	vwClose.addEventListener('click', function(e){
		_infoView.visible=false;
	});
	
	var vwMore = Ti.UI.createView({bottom:3,right:3,width:20,height:20,backgroundImage:'./Images/dark_more.png'});
	_infoView.add(vwMore);

	vwMore.addEventListener('click', function(e){
		exports.showItemDetail(_infoView.itemInfo.contentName,_infoView.itemInfo.link);
	});

	var nameLabel = Ti.UI.createLabel({
		text: '',
		color: '#000',
		textAlign: "left",
		left:5,
		width:200,
		top: 1,
		height: 20,
		font: {fontSize: 16, fontFamily:"HelveticaNeue-Bold"}
	});
	_infoView.add(nameLabel);
	var vwLine = Ti.UI.createView({top:20,left:0, right:0,backgroundColor:'#999',height:2});
	_infoView.add(vwLine);
	
	var moreLabel = Ti.UI.createLabel({
		text: '',
		color: '#000',
		textAlign: "left",
		left:15,
		width:200,
		top: 25,
		height: 40, //Make sure we are formatting correctly
		font: {fontSize: 12, fontFamily:"HelveticaNeue"}
	});
	_infoView.add(moreLabel);	
		
	var distanceLabel = Ti.UI.createLabel({
		text: '',
		color: '#000',
		textAlign: "left",
		left:5,
		width:125,
		bottom: 0,
		height: 18,
		visible:false,
		font: {fontSize: 12, fontFamily:"HelveticaNeue"}
	});
	_infoView.add(distanceLabel);
			
	function updateInfoWindow(contentName,contentMore,link,distance){
		nameLabel.text=contentName;
		moreLabel.text=contentMore;
		moreLabel.height=((contentMore.length<100)? 40 :60);
		_infoView.itemInfo={
			contentName:contentName,
			contentMore:contentMore,
			link:link
		};
		
		if((distance!==null)&&((distance+'').length>0)){
			distanceLabel.visible=true;
			var distUnit ='m';		
			if(distance>1000){
				distance=distance/1000;
				distUnit='km';
			}
			//Round to the nearest unit
			distance=Math.ceil(distance);	
			distanceLabel.text='Distance ' + distance + ' ' + distUnit;			
		}else{
			distanceLabel.visible=false;
		}
	
	};
	
	exports.updateInfoWindow=updateInfoWindow; //Expose to the world	
	
	return _infoView;
};

exports.createPlace=function(contentItem,itemOpacity,itemScale,tmatrix,distanceFromMe){
	var vwItem = Ti.UI.createView({
		height: 60,
		width: 229,
		x: 0,
		name: contentItem.name,
		location: {latitude:contentItem.latitude, longitude:contentItem.longitude},
		distance:distanceFromMe,
		scale: itemScale,
		top:150,
		transform: tmatrix,
		contentItem:contentItem,
		backgroundColor:'#000',
		borderColor:yellow,
		borderRadius:(_bark.session.isAndroid)? 0 : 5
	});
	
	var nameLabel = Ti.UI.createLabel({
		text: contentItem.name,
		color: yellow,
		textAlign: "left",
		width: 185,
		top: 5,
		left: 5,
		font: {fontSize: 12, fontFamily:"HelveticaNeue-Bold"},
		height: 20
	});
	
	vwItem.add(nameLabel);

	var contentMore=contentItem.text;
	if(_bark.activeProvider.format.list.secondLabel=='address'){
		contentMore=contentItem.address;
	}		

	var vwLine1 = Ti.UI.createView({height:1,backgroundColor:'#fff',width: 180,top:24,left:5});
	vwItem.add(vwLine1);
	var moreLabel = Ti.UI.createLabel({
		text: contentMore,
		color: yellow,
		textAlign: "left",
		width: 185,
		top: 25,
		left: 5,
		font: {fontSize: 11, fontFamily:"HelveticaNeue"},
		height: 20
	});
	vwItem.add(moreLabel);

	vwItem.addEventListener('click', function(e){
		
		if((contentItem.site_link!==undefined)&&(contentItem.site_link!==null)){
			if(contentItem.site_link.trim().length>0){
				var contentMore=contentItem.text;
				if(_bark.activeProvider.format.list.secondLabel=='address'){
					contentMore=contentItem.address;
				}
				exports.mgtInfoWindow(contentItem.name,contentMore,contentItem.site_link,vwItem.distance);
			}			
		}
	});			
	return vwItem;		
};

function getTargetView(){
	var targetArea = Ti.UI.createView({
		height: 62,
		width: 62,
		borderRadius: 30,
		top:5,
		right: 5,
		opacity: 0.5,
		zIndex:810
	});
	
	return targetArea;
};
exports.buildOveraly=function(win,itemCount){
	var vwOverlay = Ti.UI.createView({
		backgroundColor:'transparent',
		top:0
		});
	
	var vwItemCount = Ti.UI.createView({
		left:5,
		top:5,
		height:25,
		width:125,
		backgroundColor:'#000',
		borderRadius:5,
		opacity:0.7,
		zIndex:800
	});
	vwOverlay.add(vwItemCount);

	var itemMsg = Ti.UI.createLabel({
		text:'Results Found: ' + itemCount,
		color:'#fff',
		font:{fontSize:12,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		textAlign:'center',
		width:125,
		height:20
	});
	vwItemCount.add(itemMsg);
	
	var vwDoneButton = Ti.UI.createView({
		right:5,
		top:65,
		height:42,
		width:62,
		backgroundImage:'./Images/button_black.png',
		zIndex:801
	});
	
	if(Ti.Platform.name !=='android'){
		vwOverlay.add(vwDoneButton);	
	}
		
	var DoneButtonLabel = Ti.UI.createLabel({
			text:'Done',
			left:5,
			right:5,
			top:7,
			height:25,
			color:yellow,
			font:{fontWeight:'bold',fontSize:20},
			textAlign:'center'
		});	
	vwDoneButton.add(DoneButtonLabel);
		
	vwDoneButton.addEventListener('click', function(){
		cleanUpOnClose();
		if(_isSimulator){
			win.close({animated:false}); //Close without animation to avoid it jumping around	
		}else{
			Ti.Geolocation.removeEventListener('heading', exports.headingCallback);
			Ti.Media.hideCamera();
			win.close({animated:false}); //Close without animation to avoid it jumping around			
		}
	});

	var vwPhoto = Ti.UI.createView({
		right:62,
		top:5,
		height:42,
		width:62,
		backgroundImage:'./Images/button_black.png',
		zIndex:802
	});
	vwOverlay.add(vwPhoto);		

	vwPhoto.addEventListener('click', function(){
		if(_isSimulator){
			Ti.UI.createAlertDialog({
							title:'Sorry',
							message:"Can't run a the simulator"
							}).show();
			return;
		}
		
		var askDialog = Ti.UI.createAlertDialog({
							title:'Photo',
							message:'Take a photo of this?',
							buttonNames:['Cancel','Save']
						});
		
		askDialog.addEventListener('click', function(e){
			if(e.index===1){
				Ti.Media.takePicture();		
			}
		});		
		askDialog.show();

	});
	
	var vwCameraIcon = Ti.UI.createView({top:5,left:15,width:30,height:30,backgroundImage:'./Images/light_camera.png'});
	vwPhoto.add(vwCameraIcon);
	
	var vwTarget = Ti.UI.createButton({
		backgroundImage: "./Images/target2.png",
		height: 62,
		width: 62,
		top:5,
		right:5,
		touchEnabled: false,
		zIndex:803
	});
	
	vwOverlay.add(vwTarget);
	
	_infoView=exports.fetchInfoView();
	vwOverlay.add(_infoView);
	vwOverlay.add(exports.fetchDetailView()); //Add item details view. THis is the pop-up when you press more
	return vwOverlay;	
};

function getSlider(){
	//Add a slider if we are in the simulator
	var slider = Ti.UI.createSlider({
		backgroundColor:'transparent',
		thumbImage:'./Images/eye_green32.png',
		highlightedThumbImage:'./Images/eye_red32.png',
		zIndex:1000,
		min: 0,
		max: 10,
		value: 0,
		width: 300,
		bottom: 10
	});
	return slider;
};

exports.updateTarget=function(targetArea,contentCount) {	
	for (var i = 0; i < contentCount; i++) {
		var dist = convertMeters2KM(_bark.atlas.Math.distanceBetweenCoords(_bark.session.location.latitude, 
														 _bark.session.location.longitude, 
														 _bark.session.searchResults.content[i].latitude, 		
														 _bark.session.searchResults.content[i].longitude));
		var horizAngle = Bearing(_bark.session.location, _bark.session.searchResults.content[i]);	
		var ro = 28 * dist / _maxDistance;
		var centerX = 28 + ro * Math.sin(horizAngle);
		var centerY = 28 - ro * Math.cos(horizAngle);

		var point = Ti.UI.createView({
			height: 4,
			width: 4,
			backgroundColor: "#fff",
			borderRadius: 2,
			top: centerY - 2,
			left: centerX - 2
		});
		targetArea.add(point);
	}
};
exports.fetchSimulatorWindow=function(){
	var win = Ti.UI.createWindow({
		tabBarHidden:true,
		navBarHidden:true,
		fullscreen:true
	});
	if(Ti.Platform.name =='android'){
		//Force the orientations
		win.orientationModes = [
			Ti.UI.LANDSCAPE_LEFT,
			Ti.UI.LANDSCAPE_RIGHT
		];			
	}else{
		// //Force the orientations
		win.orientationModes = [
			Ti.UI.PORTRAIT
		];			
	}

	//Set the background to something more exciting
	if(_bark.session.isAndroid){
		win.backgroundImage='./Images/Backgrounds/landscape_moon.png';
	}else{
		win.backgroundImage='./Images/Backgrounds/portrait_moon.png';
	}
	return win;
};
function iOSLayout(onScreen){
	/*
	 * This section was taken fro ARTi and modified to work on Android
	 * I recommend you check out the origional at https://github.com/appcelerator-titans/ARti
	 */
	var centerX = Ti.Platform.displayCaps.platformWidth/2;	
	var centerY = Ti.Platform.displayCaps.platformHeight/2;		
	var viewAngleX = (15).toRad();	//This is an estimation of the total viewing angle that you see.
	for (var iLoop= 0; iLoop < onScreen.length; iLoop++) {			
		var totalDeep 		= 1;	//This variable determines how var to layer the items on the screen	
		var horizAngle1 	= Bearing(_bark.session.location, onScreen[iLoop].location);
		var relAngleH1 		= horizAngle1 - _deviceBearing;
		var xDelta1 		= ComputeXDelta(relAngleH1,viewAngleX);
		var viewCenterX1	= xDelta1 * centerX + centerX;	//This is related to the global centerX & Y
		
		var t = Ti.UI.create2DMatrix().scale(1);		
		t.tx = viewCenterX1 - 130;	//This sets our left and right movements
		
		onScreen[iLoop].x = viewCenterX1;	//This helps with the comparison in the following conditionals
				
		for (var k=0; k < onScreen.length; k++) {
			if (viewCenterX1 == onScreen[k].x) {
				break;
			} else {
				/*
				This loop with the conditional looks for overlap on the location views. If it overlays, it adds 55px to the 
				overlaped one and pushes it down. Improvement here could be to cap the limit, tie this in with 
				the accelerometer, and also reset it. This is an area for performance improvements, but
				gives a simple example of what can be done for quick sorting.
				*/
				if ((onScreen[k].x < onScreen[iLoop].x + 229) || (onScreen[k].x > onScreen[iLoop].x - 229)) {						
						var ty = 55 * totalDeep;
							t.ty = ty;
						totalDeep++;
					} else {
						t.ty = 0;
						totalDeep--;
					}
	
				}				
		}
		//We perform the transformation after all of that!
		onScreen[iLoop].transform = t;
		onScreen[iLoop].zIndex=10; //Make sure we're not setting on our controls
	}			
};
function AndroidLayout(onScreen){
	/*
	 * This section was taken fro ARTi and modified to work on Android
	 * I recommend you check out the origional at https://github.com/appcelerator-titans/ARti
	 */
	var moveIt=null;
	var screenLength = onScreen.length;
	var centerX = Ti.Platform.displayCaps.platformWidth/2;	
	var centerY = Ti.Platform.displayCaps.platformHeight/2;		
	var viewAngleX = (15).toRad();	//This is an estimation of the total viewing angle that you see.	
	var zIndexCounter = 100;
	
	for (var iLoop= 0; iLoop < screenLength; iLoop++) {
			zIndexCounter ++;
			var totalDeep 		= 1;
			var horizAngle1 	= Bearing(_bark.session.location, onScreen[iLoop].location);
			var relAngleH1 		= horizAngle1 - _deviceBearing;
			var xDelta1 		= ComputeXDelta(relAngleH1,viewAngleX);
			var viewCenterX1	= xDelta1 * centerX + centerX;	//This is related to the global centerX & Y
			
			//Get our current coordinates
			var t ={
				x:onScreen[iLoop].center.x,
				y:onScreen[iLoop].center.y
			};
			t.x = viewCenterX1 - 130;	//This sets our left and right movements
			onScreen[iLoop].x = viewCenterX1;	//This helps with the comparison in the following conditionals
 									
			for (var k=0; k < onScreen.length; k++) {
				zIndexCounter ++;
				if (viewCenterX1 == onScreen[k].x) {
					break;
				} else {
					/*
					This loop with the conditional looks for overlap on the location views. If it overlays, it adds 55px to the 
					overlaped one and pushes it down. Improvement here could be to cap the limit, tie this in with 
					the accelerometer, and also reset it. This is an area for performance improvements, but
					gives a simple example of what can be done for quick sorting.
					*/
					if ((onScreen[k].x < onScreen[iLoop].x + 229) || (onScreen[k].x > onScreen[iLoop].x - 229)) {						
							var ty = 60 * totalDeep;
								t.y = ty;
							totalDeep++;
						} else {
							t.y = 0;
							totalDeep--;
						}
		
					}				
			}
			// //Based on where we are on the screen move the tags
			 moveIt = Ti.UI.createAnimation({center:{x:t.x,y:t.y},duration:0});
			 onScreen[iLoop].animate(moveIt);
			//onScreen[iLoop].zIndex=parseInt(zIndexCounter);//This will blow-up the intent in 1.8	
	}	
};


function buildOnScreen(places){
	/*
	 * This section was taken fro ARTi and modified to work on Android
	 * I recommend you check out the origional at https://github.com/appcelerator-titans/ARti
	 */	
	var onScreen = [];	//This array will hold the views that are actively on the viewable area of the screen
	var centerX = Ti.Platform.displayCaps.platformWidth/2;	
	var centerY = Ti.Platform.displayCaps.platformHeight/2;	
		
	var iLength = places.length;
	var viewAngleX = (15).toRad();	//This is an estimation of the total viewing angle that you see.
		
	for (var iLoop = 0; iLoop < iLength; iLoop++) {
		var horizAngle = Bearing(_bark.session.location, _bark.session.searchResults.content[iLoop]);
		var relAngleH = horizAngle - _deviceBearing;
		
		//This handy code cuts out a lot of overprocessing
		if (relAngleH.toDeg() >= 90 && relAngleH.toDeg() <= 270) {
			continue;
		}
		
		var xDelta = Math.sin(relAngleH) / Math.sin(viewAngleX /2);
		var viewCenterX = xDelta * centerX + centerX;
		places[iLoop].x = viewCenterX - 130;

				
		//This checks the right and left of the screen to see if the view is visible.
         if (places[iLoop].x > Ti.Platform.displayCaps.platformWidth + 130 || (places[iLoop].x + 130) < -229) {
              places[iLoop].hide();
          } else {
			onScreen.push(places[iLoop]);
            places[iLoop].show();
         }
	}	
	
	return onScreen;		
};	
function addPlacesToOverlay(OverlayView,places){
	var placesCount = places.lenght;
	for (var iLoop=0; iLoop < placesCount; iLoop++) {
		OverlayView.add(places[iLoop]);
	}
	
	return OverlayView;	
};

exports.fetchPlace=function(itemContent){
	/*
	 * Parts of this section was taken fro ARTi and modified to work on Android
	 * I recommend you check out the origional at https://github.com/appcelerator-titans/ARti
	 *
	 * Based on the distance we set the opacity & scale of the entire location.
	 *  This is done based on the distance of the items in an if then statement.
	*/
	var distance 	=  _bark.atlas.Math.distanceBetweenCoords(_bark.session.location.latitude, 
														 _bark.session.location.longitude, 
														 itemContent.latitude, 
														 itemContent.longitude);
	var distanceKM=convertMeters2KM(distance);												 
	var itemOpacity = ((1/distanceKM) > 0.8) ? 0.8 : (1/distanceKM).toFixed(2);
	var itemScale 	= ((1/distanceKM) > 0.9 ) ? 0.75 : (1/distanceKM).toFixed(2);	//Scale is set here, smaller based on distance.
	var tmatrix = Ti.UI.create2DMatrix().scale(itemScale);				//We set the scale here to avoid "flashes" when rotating	

	var horizAngle = Bearing(_bark.session.location, itemContent);
													
	//This little section here will help with the poltting of our radar view.
	//We need to establish the max distance for the plotting to work properly.
	if (distanceKM > _maxDistance) {
		setMaxDistance(distanceKM);
	}
	
	var place = exports.createPlace(itemContent,itemOpacity,itemScale,tmatrix,distance);
	place.hide();	
	
	return place;
};
exports.makeLandscape=null;

exports.fetchCamera=function(bark){
	var updateTimer=null;
	var bearingListenerAdded = false;
	var bearingChanged = true;
	var places=[];
	var place = null;	
	_bark=bark; //Remember for later, we need this as globals changed in 1.8+
	
	//Unfortunately Android takes awhile
	if(bark.session.isAndroid){
		Ti.App.fireEvent('app:start_loading',{msg:'Loading Camera. Please Wait...'});
	}
	
	//Get the content count, this saves time later
	var contentCount = bark.session.searchResults.content.length;
	//Figure out if we're in the simulator, camera input is a problem if we are
	_isSimulator = ((Ti.Platform.model.toUpperCase() == "SIMULATOR")||(Ti.Platform.model.toUpperCase() == "GOOGLE_SDK"));

	//Create a window just in case we're in a simulator, since this is a demo you know we'll be in one most of the time
	var win = exports.fetchSimulatorWindow();
	
	//We do this to fake the android camera view
	if((bark.session.isAndroid) && (_isSimulator)){
		Ti.UI.orientation = Ti.UI.LANDSCAPE_LEFT;	
	}

	//Build our camera overlay base view
	var vwOverlay=exports.buildOveraly(win,contentCount);
	
	//Build a collection of places
	//For some reason Android makes us build this only in the way
	//Any other method causes the overlay view not to attach the places, odd
	for (var iLoop = 0; iLoop < contentCount; iLoop++) {
		place = exports.fetchPlace(bark.session.searchResults.content[iLoop]);
		vwOverlay.add(place);			
		places.push(place);			
	};		
			
	//Add that target that everyone loves
	var targetArea = getTargetView();
	//Add the target to the overlay view so we can see it
	vwOverlay.add(targetArea);
		
	//Update the target view to show all of those blips we like
	exports.updateTarget(targetArea,contentCount);
	
	function ManageScreen(places){
		var onScreen = buildOnScreen(places);
		if(bark.session.isAndroid){
			AndroidLayout(onScreen);	
		}else{
			 iOSLayout(onScreen);
		 }
	};
	
	//Make sure we're in landscape for Android
	function makeLandscape(){
		win.orientationModes = [];
		win.orientationModes = [Ti.UI.LANDSCAPE_LEFT,Ti.UI.LANDSCAPE_RIGHT ];
		Ti.UI.orientation = Ti.UI.LANDSCAPE_LEFT;		
	};
	exports.makeLandscape=makeLandscape;
	
	//Now we put everything together
	//No real magic here we just figure out 
	//if your in a simulator or the real thing and how what we just built
	if (_isSimulator) {
		//Add the slider so we can control direction
		var slider = getSlider();

		slider.addEventListener("change", function(e) {
			_deviceBearing = (e.value * 36).toRad();
			ManageScreen(places);
			targetArea.transform = Ti.UI.create2DMatrix().rotate((-_deviceBearing).toDeg());
		});
			
	vwOverlay.add(slider);			
		//Open a window, so that we can fake a camera output
		win.add(vwOverlay);
		//Move the slider alittle on load, hack to kick start everything
		setTimeout(function()
		{
			slider.value=1;
			
		},500);

		win.addEventListener('android:back', function(e){
			Ti.App.fireEvent('win:set_portrait');
			win.close();			
		});	
		win.addEventListener('close', function(e){			
			cleanUpOnClose();					
		});
		win.addEventListener('focus', function(e){
			setTimeout(function()
			{
				Ti.App.fireEvent('app:finish_loading');
				
			},500);				
					
		});
		bark.pageManager(win);

	} else {

		// //Setup what we need to get started
		exports.setupGPSHeadingInfo(); 
 		
		// EVENT LISTENER FOR COMPASS EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON HEADING FILTER)
		Ti.Geolocation.addEventListener('heading', exports.headingCallback);
		//Since the bearing will fire faster then we want to refresh 
		//create a timer to check
		_timerId=updateTimer = setInterval(function()
			{
				if (!_bearingChanged) {
					return;
				}
	
				try{
					//statusLabel.text='Calling manage screen ' + count;
					ManageScreen(places);
					targetArea.transform = Ti.UI.create2DMatrix().rotate((-_deviceBearing).toDeg());
					_bearingChanged=false;				
				 } catch(err) {
					var errMsg = Ti.UI.createAlertDialog({title:'Error',message:err});
					errMsg.show();
				}
			},250);
		

		//Unfortunately Android takes awhile to load, so kill the message after it is loaded
		Ti.App.fireEvent('app:finish_loading');
							
		 //We're running on a real device or we really screwed up
		 //This means we can now use the actual camera
		 //Add the overlay and give it a shot
		 //Still not sure how the iPad one will react here
		 Ti.Media.showCamera({
		    success:function(event) {
		    	//This saves the camera overlay to the gallery to do this we've got a few step process
		    	//First we need to create a view to get the camera output
				var cameraOutput = Ti.UI.createImageView({
		            width: Ti.Platform.displayCaps.platformWidth,
		            height: Ti.Platform.displayCaps.platformHeight,
		            top: 0,
		            left: 0,
		            image: event.media
		        });
		        //Next we add to the camera output the overlay
		        cameraOutput.add(vwOverlay);
		        //Now we can call toImage to convert everything
				var imgToSave = cameraOutput.toImage(function(e){
			       // First we need to create a temp file for the output
			        var tmpFile = Ti.Filesystem.applicationDataDirectory + "/barktemp.png";
			        var f = Ti.Filesystem.getFile(tmpFile);
			        //Since we can do this a few times make sure we delete it if this isn't our first time
			        if(f.exists()){
			        	f.deleteFile();
			        }
			        //Now we can write the blob to the file
			        f.write(e.blob);
		        	//File gets passed into the Gallery
			        Ti.Media.saveToPhotoGallery(f);
			        //Alert the user we've saved
					Ti.UI.createAlertDialog({title:'Saved',message:'This photo has been saved to your gallery'}).show();
					 //When we're done close the view
					 //TODO : we shoul take you back to the view, but for some reason it
					 //doesn't want to position correctly
					Ti.Geolocation.removeEventListener('heading', exports.headingCallback);
					Ti.Media.hideCamera();
					Ti.App.fireEvent('win:set_portrait');
					win.close({animated:false}); //Close without animation to avoid it jumping around
		     });		    	
		    },
		    cancel:function() {
				//On Android this will fire when the user presses the back button
				cleanUpOnClose();
				Ti.App.fireEvent('win:set_portrait');
				Ti.Geolocation.removeEventListener('heading', exports.headingCallback);		
		    },
		    error:function(error) {
		    	Ti.App.fireEvent('win:set_portrait');
		        var a = Ti.UI.createAlertDialog({title:'Camera'});
		        if (error.code == Ti.Media.NO_CAMERA) {
		            a.setMessage('Please run this test on device');
		        } else {
		            a.setMessage('Unexpected error: ' + error.code);
		        }
		        a.show();
		    },
		    overlay:vwOverlay,
			mediaTypes:Ti.Media.MEDIA_TYPE_PHOTO,		    
		    showControls:false,	// don't show system control
		    autohide:false 	// tell the system not to auto-hide and we'll do it ourself
		});
	}	
	
};

Ti.App.addEventListener('win:set_landscape', function(e){
	exports.makeLandscape();
});	