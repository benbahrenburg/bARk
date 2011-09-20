/*jslint maxerr:10000 */
//-----------------------------------------------------------
/*
 * bARk
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------

function androidHeader(headerTitle){
	var yellow='#ded32a';
	var header = Ti.UI.createView({top:0,height:40,left:0,right:0,backgroundImage:'./Images/block_black.png'});
	var headerLabel = Ti.UI.createLabel({
			text:headerTitle,
			left:5,
			top:5,
			height:25,
			width:'auto',
			color:yellow,
			font:{fontWeight:'bold',fontSize:20},
			textAlign:'left'
		});	
	header.add(headerLabel);
	
	return header;	
};

exports.AndroidHeader=androidHeader;

exports.window=function(){
	var _providerIndex=0;
	var _searchTerm='';
	var yellow='#ded32a';
	var winConfig = {backgroundImage:'./Images/Backgrounds/cloth_back.png',title:'bARk',exitOnClose:true};
	var win = bark.helpers.makeWindow(winConfig);
	var locationInfo = null; //Local location info cache
	var options={backgroundImage:'./Images/Backgrounds/cloth_back100.png',top:0};
	var containerTop = Ti.UI.createView({top:(bark.session.isAndroid)? 40 : 0,height:165,left:0,right:0,layout:'vertical',backgroundImage:'./Images/block_black.png'});
	var containerBody = Ti.UI.createView({top:0,bottom:50,left:0,right:0,layout:'vertical'});
	var containerBottom = Ti.UI.createView({bottom:0,height:50,left:0,right:0,layout:'horizontal',backgroundImage:'./Images/block_black.png'});
	win.add(containerBody);
	win.add(containerBottom);

	//Set our headers
	if(bark.session.isAndroid){
		win.add(androidHeader('bARK'));	
	}

	function displayError(msg){
		Ti.API.info(msg);
		Ti.UI.createAlertDialog({title:"We're having troubles",message:msg}).show();
	};
	
	function canSearch(){
		var results = {doSearch:true,msg:null};
		if(!Ti.Network.online){
			results.doSearch=false;
			results.msg="Unable to find a network connection, please check your connection and try again.";
			return results;			
		};
		if(locationInfo===null){
			results.doSearch=false;
			results.msg="Please select a location before searching";
			return results;
		}

		if(!locationInfo.isValid){
			results.doSearch=false;
			results.msg="Unable to find your location, please try another";
			return results;
		}
				
		return results;
	};
	var lblSearch = Ti.UI.createLabel({
			text:'Search Using: ' + bark.activeProvider.name,
			top:5,
			left:7,
			height:25,
			right:7,
			color:yellow,
			font:{fontWeight:'bold',fontSize:16},
			textAlign:'left'
		});
	
	containerTop.add(lblSearch);
	
	function onTabStripChange(index){		
		bark.setProvider(index);	
		lblSearch.text='Search Using: ' + bark.activeProvider.name;	
	};
	
	var tabStrip = bark.helpers.createHorizontalTab(options,bark.session.providerList,onTabStripChange);
	containerTop.add(tabStrip);
	
	var txtTerm = Ti.UI.createTextField({
				top:3,
				height:35,
				left:7,
				right:7,
				hintText:'Enter an optional search term',
				borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
				returnKeyType:Ti.UI.RETURNKEY_DONE,
				clearButtonMode:Ti.UI.INPUT_BUTTONMODE_ONFOCUS
		});

	containerTop.add(txtTerm);
	
	containerBody.add(containerTop);
	
	containerBody.addEventListener('click', function(e) {
		txtTerm.blur();
	});
	
	var vwCamera = Ti.UI.createView({
		backgroundImage:'./Images/block_black.png',
		height:50,
		left:10,
		right:10,
		top:10
	});

	containerBody.add(vwCamera);
	
	var vwCameraIcon = Ti.UI.createView({top:10,left:10,width:30,height:30,backgroundImage:'./Images/light_camera.png'});
	vwCamera.add(vwCameraIcon);
	
	var lblAR = Ti.UI.createLabel({
			text:'View your search using Augmented Reality',
			left:60,
			top:5,
			height:40,
			width:175,
			color:yellow,
			font:{fontWeight:'bold',fontSize:14},
			textAlign:'left'
		});	
	vwCamera.add(lblAR);

	var vwCameraMore = Ti.UI.createView({top:15,right:10,width:25,height:25,backgroundImage:'./Images/light_more.png'});
	vwCamera.add(vwCameraMore);

	vwCamera.addEventListener('click', function(e) {
		var validate = canSearch();
		if(validate.doSearch){
			bark.moduleManager.doSearch("ar",txtTerm.value,displayError);		
		}else{
			displayError(validate.msg);
		}
	});
	
		
	var vwList = Ti.UI.createView({
		backgroundImage:'./Images/block_black.png',
		height:50,
		left:10,
		right:10,
		top:10
	});
	
	containerBody.add(vwList);

	vwList.addEventListener('click', function(e) {
		var validate = canSearch();
		if(validate.doSearch){
			bark.moduleManager.doSearch("list",txtTerm.value,displayError);		
		}else{
			displayError(validate.msg);
		}
	});

	var vwListIcon = Ti.UI.createView({top:10,left:10,width:30,height:30,backgroundImage:'./Images/light_list.png'});
	vwList.add(vwListIcon);
		
	var lblList = Ti.UI.createLabel({
			text:'View a list of your search',
			left:60,
			top:5,
			height:40,
			width:175,
			color:yellow,
			font:{fontWeight:'bold',fontSize:14},
			textAlign:'left'
		});	
	vwList.add(lblList);

	var vwListMore = Ti.UI.createView({top:15,right:10,width:25,height:25,backgroundImage:'./Images/light_more.png'});
	vwList.add(vwListMore);
			
	var vwMap = Ti.UI.createView({
		backgroundImage:'./Images/block_black.png',
		height:50,
		left:10,
		right:10,
		top:10
	});
	
	containerBody.add(vwMap);

	vwMap.addEventListener('click', function(e) {
		var validate = canSearch();
		if(validate.doSearch){
			bark.moduleManager.doSearch("map",txtTerm.value,displayError);			
		}else{
			displayError(validate.msg);
		}
	});
	
	var vwMapIcon = Ti.UI.createView({top:10,left:10,width:30,height:30,backgroundImage:'./Images/light_pin.png'});
	vwMap.add(vwMapIcon);
	
	var lblMap = Ti.UI.createLabel({
			text:'View a map of your search results',
			left:60,
			top:5,
			height:40,
			width:175,
			color:yellow,
			font:{fontWeight:'bold',fontSize:14},
			textAlign:'left'
		});	
	vwMap.add(lblMap);

	var vwMapMore = Ti.UI.createView({top:15,right:10,width:25,height:25,backgroundImage:'./Images/light_more.png'});
	vwMap.add(vwMapMore);
		
	var bFind = Ti.UI.createView({top:15,height:25,width:25,left:3,backgroundImage:'./Images/light_locate.png'});
	containerBottom.add(bFind);
	
	var lblLocation = Ti.UI.createLabel({
			text:'Tap to select location',
			left:10,
			top:5,
			height:40,
			width:(Ti.Platform.displayCaps.platformWidth-60),
			color:yellow,
			font:{fontWeight:'bold',fontSize:14},
			textAlign:'left'
		});
	
	containerBottom.add(lblLocation);
	
	function findLocationFromAddress(){
		
	};
	
	function updateLocationText(result){
		Ti.App.fireEvent('app:finish_loading');
		if(result.success){
			lblLocation.text=result.location.address;	
		}else{
			lblLocation.text="Unable to find location";
		}
		
		if((result.location===undefined)||(result.location===null)){
			locationInfo={isValid:false};
		}else{
			locationInfo=result.location;
			locationInfo.isValid=result.success;			
		}

		Ti.API.info('update location text result.success =' + result.success);
		Ti.App.fireEvent('app:searchLocationChanged',
		{
			isValid:result.success,
			address:result.location.address,
			city:result.location.city,
			regionCode : result.location.regionCode,
			countryCode: result.location.countryCode,
			latitude:result.location.latitude,
			longitude:result.location.longitude
		});		
	};
	
	function loadTimeLocation(results){
		if(results.success){
			bark.atlas.Find.doReverseGeo(results.latitude,results.longitude,updateLocationText);	
		}else{
			Ti.API.info('Location failed due to ' + results.message);
			Ti.App.fireEvent('app:finish_loading');
		}		
	};
	function findCurrentLocation(results){
		if(results.success){
			bark.atlas.Find.doReverseGeo(results.latitude,results.longitude,updateLocationText);	
		}else{
			Ti.API.info('Location failed due to ' + results.message);
			Ti.App.fireEvent('app:finish_loading');
			displayError('Unable to find your location please try again.');	
		}
	};
	
	function findCoords(isOnLoad){
		if(!Ti.Network.online){
			displayError("Unable to find a network connection, please check your connection and try again.");		
		}else{
			Ti.App.fireEvent('app:start_loading',{msg:'Locating Please Wait...'});
			bark.atlas.Geo.getCurrentCoordinates(((isOnLoad)? loadTimeLocation : findCurrentLocation));	
		}
	}
	bFind.addEventListener('click', function(e) {
		findCoords(false);	
	});
	
	//If we need to do a lookup on load figure that out
	if(bark.session.needGeoRefresh && bark.session.geoEnabled){
		findCoords(true);
	}	

	Ti.App.addEventListener('win:set_portrait', function(e){
		win.orientationModes = [];
		win.orientationModes = [Ti.UI.PORTRAIT];
		Ti.UI.orientation = Ti.UI.PORTRAIT;
	});	
	
	return win;
};