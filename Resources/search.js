/*jslint maxerr:10000 */
//-----------------------------------------------------------
/*
 * bARk
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------

var _providers=[];
var _activeProvider=null;
exports.fetchActiveProvider=function(){
	return _activeProvider;
};
function addTwitter(){
	var provider=require('Soup/soup.twitter');
	_providers.push(provider);
};
function addYahooLocal(keys){
	var provider=require('Soup/soup.yahoolocal');
	provider.contentSetup(keys.yahooLocation);
	_providers.push(provider);		
};
function addYelp(keys){
	var provider=require('Soup/soup.yelp');
	provider.contentSetup(keys.yelp);
	_providers.push(provider);	
};
function addFourSquare(keys){
	var provider=require('Soup/soup.foursquare');
	provider.contentSetup(keys.fourSquareKey);
	_providers.push(provider);	
};
exports.registerProviders=function(keys){
	_providers=[];
	addFourSquare(keys);
	addYelp(keys);
	addTwitter();
	addYahooLocal(keys);
	exports.activateProvider(0);
};
exports.activateProvider=function(providerIndex){
	_activeProvider=_providers[providerIndex];
};
exports.fetchProviderList=function(){
	var iHeight=75;
	var iWidth=125;
	var providerList = [
			{selectedBackgroundImage:'./Images/Logos/foursquare.png',backgroundImage:'./Images/Logos/foursquare.png',index:0,name:'FourSquare',height:iHeight,width:iWidth,borderColor:'#000',selectedBorderColor:'yellow',borderWidth:3,selectedBorderWidth:1},
			{selectedBackgroundImage:'./Images/Logos/yelp.png',backgroundImage:'./Images/Logos/yelp.png',index:1,name:'Yelp!',height:iHeight,width:iWidth,borderColor:'#000',selectedBorderColor:'yellow',borderWidth:3,selectedBorderWidth:1},
			{selectedBackgroundImage:'./Images/Logos/twitter.png',backgroundImage:'./Images/Logos/twitter.png',index:2,name:'Twitter',height:iHeight,width:iWidth,borderColor:'#000',selectedBorderColor:'yellow',borderWidth:3,selectedBorderWidth:1},
			{selectedBackgroundImage:'./Images/Logos/yahoo_local.png',backgroundImage:'./Images/Logos/yahoo_local.png',index:3,name:'Yahoo Local',height:iHeight,width:iWidth,borderColor:'#000',selectedBorderColor:'yellow',borderWidth:3,selectedBorderWidth:1}
	];
	
	var fourSqFormat = {
		list:{
			imageTop:10,
			imageLeft:5,
			imageWidth:25,
			imageHeight:25,
			rowHeight:95,
			secondLabel:'address',
			secondLabelHeight:20,
			thirdLabelHeight:40
		},
		map:{
			secondLabel:'address'
		}
	};

	var yelpFormat = {
		list:{
			imageTop:10,
			imageLeft:5,
			imageWidth:25,
			imageHeight:25,
			rowHeight:100,
			secondLabel:'address',
			secondLabelHeight:20,
			thirdLabelHeight:40
		},
		map:{
			secondLabel:'address'
		}
	};

	var twitterFormat = {
		list:{
			imageTop:10,
			imageLeft:5,
			imageWidth:25,
			imageHeight:25,
			rowHeight:130,
			secondLabel:'text',
			secondLabelHeight:60,
			thirdLabelHeight:20
		},
		map:{
			secondLabel:'text'
		}
	};

	var yahooFormat = {
		list:{
			imageTop:10,
			imageLeft:5,
			imageWidth:25,
			imageHeight:25,
			rowHeight:100,
			secondLabel:'address',
			secondLabelHeight:20,
			thirdLabelHeight:40
		},
		map:{
			secondLabel:'address'
		}
	};
				
	providerList[0].format=fourSqFormat;
	providerList[1].format=yelpFormat;
	providerList[2].format=twitterFormat;
	providerList[3].format=yahooFormat;
	
	return providerList;			
};

exports.myLocationProviders=function(){
	var myProviders = [
		{providerPath:"Atlas/atlas.ti"},
		{providerPath:"Atlas/atlas.google"}
	];
	
	return myProviders;
};
