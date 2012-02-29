/*jslint maxerr:10000 */
//-----------------------------------------------------------
/*
 * bARk
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------
String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };
Ti.UI.setBackgroundColor('#000');

//Set the application namspaces 
var bark={ui:{},session:{needGeoRefresh:true,keys:{}},atlas:{ti:{}}};
//Set what platform we're using as a property
bark.session.isAndroid = (Ti.Platform.name =='android');
if(!bark.session.isAndroid){
	Ti.UI.iPhone.statusBarStyle = Ti.UI.iPhone.StatusBar.OPAQUE_BLACK;	
}
//Create Android Indicator
bark.ui.droidActInd = Ti.UI.createActivityIndicator({height:30,width:30,message:'Loading...'});
//Bring in the core App logic components and API key Info
Ti.include('/Soup/apikeys.js','app.logic.js');

Ti.App.addEventListener('app:start_loading', function(e){
	var msg = (e.msg===undefined) ? 'Please wait...' : e.msg; 
	//We need to reference platform here due to how Android uses threads
	if(Ti.Platform.name!=='android'){
		if(bark.ui.iOSWaiting!==undefined && bark.ui.iOSWaiting!==null){
			bark.ui.iOSWaiting.close();
		}
		bark.ui.iOSWaiting = bark.helpers.iOSWaitingWindow(msg);
		bark.ui.iOSWaiting.open();
	}else{
		bark.ui.droidActInd.hide();
		bark.ui.droidActInd.message=msg;
		bark.ui.droidActInd.show();
	}
});

Ti.App.addEventListener('app:finish_loading', function(e){
	if(Ti.Platform.name!=='android'){
		if(bark.ui.iOSWaiting!==undefined && bark.ui.iOSWaiting!==null){
			bark.ui.iOSWaiting.close();
		}
	}else{
		bark.ui.droidActInd.hide();
	}
});
Ti.App.addEventListener('app:searchLocationChanged', function(e){
	var isValid = (e.isValid===undefined)? false : e.isValid;
	
	var location={
		isValid:e.isValid,
		address:e.address,
		city:e.city,
		regionCode:e.regionCode,
		countryCode:e.countryCode,
		latitude:e.latitude,
		longitude:e.longitude
	};
	
	bark.activeProvider.needRefresh=true;	
	bark.session.location=location;
});

//Load the main window
bark.ui.winMain = require('main_ui').window(bark);

//Based on platfomr launch the App in a specific way
//We need to reference platform here due to how Android uses threads
if(Ti.Platform.name!=='android'){
	bark.tabs = new bark.helpers.AppTabGroup({window: bark.ui.winMain});
	bark.tabs.open();
}else{
	bark.ui.winMain.open();
}