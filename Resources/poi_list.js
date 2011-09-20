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

function buildRow(itemIndex,itemContent,provider){
	var yellow='#ded32a';
	var row = Ti.UI.createTableViewRow({height:provider.format.list.rowHeight,selectedBackgroundColor:'#999', hasChild:false});
	var vwRow = Ti.UI.createView({left:5,right:5,backgroundImage:'./Images/block_black.png',top:5,bottom:5});
	var vwMore = Ti.UI.createView({top:25,right:5,width:25,height:25,backgroundImage:'./Images/light_more.png'});
	row.followUrl = itemContent.site_link;
	row.followTitle = itemContent.name;
	vwRow.add(vwMore);
	if(itemContent.image_url===null){
		itemContent.image_url='./Images/light_pictures.png';
	}
	var vwImg = Ti.UI.createImageView({
				top:provider.format.list.imageTop,
				left:provider.format.list.imageLeft,
				width:provider.format.list.imageWidth,
				height:provider.format.list.imageHeight,
				image:itemContent.image_url,
				defaultImage:'./Images/light_pictures.png'
		});
	vwRow.add(vwImg);
	
	var vwContent = Ti.UI.createView({left:30,right:30,layout:'vertical'});
	vwRow.add(vwContent);
	
	var label1 = Ti.UI.createLabel({
		text:itemContent.name,
		left:5,
		top:5,
		height:20,
		color:yellow,
		font:{fontWeight:'bold',fontSize:14},
		textAlign:'left'
	});
	vwContent.add(label1);
	var nextInfo=itemContent.text;
	if(provider.format.list.secondLabel=='address'){
		nextInfo=itemContent.address;
	}
	var label2 = Ti.UI.createLabel({
		text:nextInfo,
		left:5,
		right:5,
		top:0,
		height:provider.format.list.secondLabelHeight,
		color:yellow,
		font:{fontSize:12},
		textAlign:'left'
	});

	vwContent.add(label2);		
	
	var label3 = Ti.UI.createLabel({
		text:'Click to view on ' + provider.name,
		left:5,
		top:5,
		height:provider.format.list.thirdLabelHeight,
		color:yellow,
		font:{fontSize:10},
		textAlign:'left'
	});
	vwContent.add(label3);	
	if((itemContent.latitude!==null) && 
	   (itemContent.longitude!==null)&&
	   (!isNaN(itemContent.latitude))&&
	   (!isNaN(itemContent.longitude))){
		var distance = bark.atlas.Math.distanceBetweenCoords(bark.session.location.latitude, bark.session.location.longitude, itemContent.latitude, itemContent.longitude);
		var distUnit ='m';		
		if(distance>1000){
			distance=distance/1000;
			distUnit='km';
		}
		//Round to the nearest unit
		distance=Math.ceil(distance);
		var distanceLabel = Ti.UI.createLabel({
			text:distance + ' ' + distUnit,
			right:5,
			bottom:5,
			height:20,
			color:yellow,
			font:{fontWeight:'bold',fontSize:12},
			textAlign:'right'
		});
		vwRow.add(distanceLabel);	

	}
		
	row.className=itemIndex +'';

	row.add(vwRow);
	return row;		
};

function fetchTableViewData(searchResults,provider){
	var data = [];
	var iLength=searchResults.length;
	 for (var iLoop=0;iLoop < iLength;iLoop++){
	 	data.push(buildRow(iLoop,searchResults[iLoop],provider));
	 }	 
	 return data;
};

exports.window=function(){

	var winConfig = {backgroundImage:'./Images/Backgrounds/cloth_back.png',title:'bARK Search'};
	var win = bark.helpers.makeWindow(winConfig);

	//Set our headers
	if(bark.session.isAndroid){
		win.add(androidHeader(win.title));
	}	

	var tableView = Ti.UI.createTableView({
		top:(bark.session.isAndroid) ? 45 : 0,
		backgroundColor:'transparent',
		separatorColor:'transparent'
	});
	
	win.add(tableView);
	
	// create table view event listener
	tableView.addEventListener('click', function(e){
		if(e.rowData.followUrl!==null){
			if(e.rowData.followUrl.trim().length>0){
				var web = bark.poiWeb.window(e.rowData.followTitle,e.rowData.followUrl);
				web.open({modal:true});
			}
		}
	});

	win.addEventListener('open', function(e){
		var tableData = fetchTableViewData(bark.session.searchResults.content,bark.activeProvider);	
		tableView.setData(tableData);
	});	
		
	return win;
};