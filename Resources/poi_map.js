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

exports.buildMapAnnotate=function(itemContent){
	
	var vwImg = Ti.UI.createImageView({
				top:bark.activeProvider.format.list.imageTop,
				left:bark.activeProvider.format.list.imageLeft,
				width:bark.activeProvider.format.list.imageWidth,
				height:bark.activeProvider.format.list.imageHeight,
				image:itemContent.image_url,
				defaultImage:'./Images/light_pictures.png'
		});
	var point = Ti.Map.createAnnotation({
		latitude:itemContent.latitude,
		longitude:itemContent.longitude,
		title:itemContent.name,
		leftView:vwImg,
		animate:true,
		itemTitle:itemContent.name,
		itemId:itemContent.id,
		itemUrl:itemContent.site_link
	});	

	 var nextInfo=itemContent.text;
	 if(bark.activeProvider.format.map.secondLabel=='address'){
		 nextInfo=itemContent.address;
	 }
 	
	 if(bark.session.isAndroid){
		point.pinImage = "./Images/map-pin.png";
		point.subtitle=nextInfo;
	 }else{	 	
	 	point.rightButton= Titanium.UI.iPhone.SystemButton.DISCLOSURE;
		point.pincolor=Ti.Map.ANNOTATION_GREEN;
		point.subtitle=nextInfo;		
	 }
	
	return point;
};

exports.window=function(){
	var winConfig = {backgroundImage:'./Images/Backgrounds/cloth_back.png',title:'bARK Map'};
	var win = bark.helpers.makeWindow(winConfig);
	
	//Set our headers if we are on android
	if(bark.session.isAndroid){
		win.add(androidHeader(winConfig.title));	
	}	

	var mapView = Ti.Map.createView({
		top:((bark.session.isAndroid) ? 45 : 0),
		mapType: Ti.Map.STANDARD_TYPE,
		region:{latitude:bark.session.location.latitude, longitude:bark.session.location.longitude, latitudeDelta:0.01, longitudeDelta:0.01},
		animate:true,
		regionFit:true,
		userLocation:true
	});	

	win.add(mapView);	

	mapView.addEventListener('click',function(evt){
		// map event properties
		var annotation = evt.annotation;
		var title = evt.title;
		var clickSource = evt.clicksource;
		Ti.API.info('Map clickSource=' + clickSource);
		try{
			if((evt.clicksource == 'rightButton')||(Ti.Platform.name =='android')){
				var visitUrl = (evt.annotation)?evt.annotation.itemUrl:'';
				var visitTitle = (evt.annotation)?evt.annotation.itemTitle:'';	
				if(visitUrl!==null){
					if(visitUrl.trim().length>0){
						var web = bark.poiWeb.window(visitTitle,visitUrl);
						web.open({modal:true});
					}
				}
			}
		}catch(err) {
		 	Ti.API.info('Map click Error=' + err);
		}

	});
					
	win.addEventListener('open', function(e){
		var content = bark.session.searchResults.content; //Shortcut
		var iLength = content.length;
		//Remove any pins that are already there
		mapView.removeAllAnnotations();
		//Set the location to make sure we've got it right
		mapView.setLocation({latitude:bark.session.location.latitude, longitude:bark.session.location.longitude, latitudeDelta:0.01, longitudeDelta:0.01});
		//Start adding map pins	
		for (var iLoop=0; iLoop < iLength; iLoop++){
			mapView.addAnnotation(exports.buildMapAnnotate(content[iLoop]));
		}	
	});	
	return win;	
};