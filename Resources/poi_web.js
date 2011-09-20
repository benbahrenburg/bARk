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
			font:{fontWeight:'bold',fontSize:18},
			textAlign:'left'
		});	
	header.add(headerLabel);
	
	return header;	
};

function iphoneHeader(win){

	var bDone = Ti.UI.createButton({
		systemButton:Ti.UI.iPhone.SystemButton.DONE
	});
	bDone.addEventListener('click', function(){
		win.close();
	});
	
	var bAction = Ti.UI.createButton({
		systemButton:Ti.UI.iPhone.SystemButton.ACTION
	});
	bAction.addEventListener('click', function(){
		//TODO : Add more stuff here
	});
	
	win.leftNavButton=bAction;
	win.rightNavButton=bDone;
	return win;
};

exports.AndroidHeader=androidHeader;

exports.iPhoneHeader=iphoneHeader;

exports.window=function(winTitle,link){
	var winConfig = {backgroundImage:'./Images/Backgrounds/cloth_back.png',title:winTitle};
	var win = bark.helpers.makeWindow(winConfig);
	var webViewTopPadding = 0;

	//Set our headers
	if(bark.session.isAndroid){
		webViewTopPadding=45;
		win.add(androidHeader(winTitle));		
	}else{
		win=iphoneHeader(win);	
	}		

	var webView = Ti.UI.createWebView({
		url:link,
		top:webViewTopPadding,
		bottom:0
	});
	
	win.add(webView);
	
	return win;
};