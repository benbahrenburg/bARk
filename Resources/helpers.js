/*jslint maxerr:10000 */
//-----------------------------------------------------------
/*
 * bARk
 * Copyright (c) 2009-2011 by Benjamin Bahrenburg All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//-----------------------------------------------------------
exports.AppTabGroup = function() {
	//Thanks Kevin Whinnery for the sample 
	//https://github.com/appcelerator-developer-relations/Forging-Titanium/blob/master/ep-006
	var instance = Ti.UI.createTabGroup();

	//loop through tab objects and add them to the tab group
	for (var i = 0, l = arguments.length; i < l; i++) {
		var tab = Ti.UI.createTab(arguments[i]);
		//on initialization, we track the current tab as the first one added
		if (i === 0) {
			instance.currentTab = tab;
		}
		instance.addTab(tab);
	}

	//track the current tab for the tab group
	instance.addEventListener('focus', function(e) {
		instance.currentTab = e.tab;
	});

	return instance;
};
exports.iOSWaitingWindow=function(Message){
	var messageWin = Ti.UI.createWindow({touchEnabled:false});
	var messageView = Ti.UI.createView({
			height:450,
			width:310,
			backgroundColor:'#000',
			opacity:0.7
	});
	var messageLabel = Ti.UI.createLabel({
			color:'#fff',
			width:275,
			height:'auto',
			font:{
				fontFamily:'Helvetica Neue',
				fontSize:24				
			},
			textAlign:'center',
			top:275
	});
	var messageActivity = Ti.UI.createActivityIndicator({
		style:Ti.UI.iPhone.ActivityIndicatorStyle.BIG,
		top:150,
		height:150,
		width:10
		});
	
	messageWin.add(messageView);
	messageWin.add(messageActivity);
	messageWin.add(messageLabel);

	messageLabel.text = Message;
	messageActivity.show();
		
	return messageWin;
};
exports.makeWindow = function(a){
	a = a || {};
	var win = Ti.UI.createWindow(a);
	//Force the orientations
	win.orientationModes = [
		Ti.UI.PORTRAIT
	];
	win.tabBarHidden=true;
	win.barColor='#000';
	win.backButtonTitleImage='./Images/icon_arrow_left.png';
	win.navBarHidden = (Ti.Platform.name == 'android');	
	return win;	
};	


exports.createHorizontalTab=function(options,providerList,selectCallback){

	var listLength = providerList.length;
	var totalLength = 0;
	var leftOffset = 10;
	var leftOffsetCount = 0;
	
	var scrollView = Titanium.UI.createScrollView({
		contentWidth:500,
		contentHeight:75,
		height:85,
		left:2,
		right:2,
		verticalBounce:false
	});

	if(options.top!==undefined){
		scrollView.top=options.top;
	}
		
	if(options.borderColor!==undefined){
		scrollView.borderColor=options.borderColor;
	}

	if(options.borderWidth!==undefined){
		scrollView.borderWidth=options.borderWidth;
	}

	if(options.borderRadius!==undefined){
		scrollView.borderRadius=options.borderRadius;
	}

	if(options.backgroundImage!==undefined){
		scrollView.backgroundImage=options.backgroundImage;
	}	
	if(options.backgroundColor!==undefined){
		scrollView.backgroundColor=options.backgroundColor;
	}
	

	function resetFormatting(){
	 	var oldSelectedObjects = scrollView.children;
	 	var iLength = oldSelectedObjects.length;
	 	var prop = null;
	 	if(oldSelectedObjects){
	 		for (var iLoop = 0; iLoop < iLength; iLoop++) {
	 			prop = oldSelectedObjects[iLoop].prop; //Create a shortcut

				if(prop.backgroundColor!==undefined){
					oldSelectedObjects[iLoop].backgroundColor=prop.backgroundColor;
				}
				
				if(prop.backgroundImage!==undefined){
					oldSelectedObjects[iLoop].backgroundImage=prop.backgroundImage;
				}
		
	 			if(prop.borderColor!==undefined){
					oldSelectedObjects[iLoop].borderColor=prop.borderColor;
				}			

				if(prop.borderRadius!==undefined){
					oldSelectedObjects[iLoop].borderRadius=prop.borderRadius;
				}	
		
				if(prop.borderWidth!==undefined){
					oldSelectedObjects[iLoop].borderWidth=prop.borderWidth;
				}	
		
	 		}
	 	}
	
	};
	 
	function selectObject(selectedObject) {
	 	resetFormatting();
	 	var prop = selectedObject.prop; //Create a shortcut

		if(prop.selectedBackgroundColor!==undefined){
			selectedObject.backgroundColor=prop.selectedBackgroundColor;
		}

		if(prop.selectedBackgroundImage!==undefined){
			selectedObject.backgroundImage=prop.selectedBackgroundImage;
		}
						
		if(prop.selectedBorderColor!==undefined){
			selectedObject.borderColor=prop.selectedBorderColor;
		}			

		if(prop.selectedBorderRadius!==undefined){
			selectedObject.borderRadius=prop.selectedBorderRadius;
		}	

		if(prop.selectedBorderWidth!==undefined){
			selectedObject.borderWidth=prop.selectedBorderWidth;
		}			
		
		if((selectCallback!==null)&&(selectCallback!==undefined)){
			selectCallback(selectedObject.prop.index);
		}
	};

	function setDefault(){
	 	var oldSelectedObjects = scrollView.children;
	 	var iLength = oldSelectedObjects.length;
	 	if(iLength>0){
	 		selectObject(oldSelectedObjects[0]);
	 	}		
	};	 
	function createTabView(leftOffset,prop){
	
		var vw = Ti.UI.createView({
			width:prop.width,
			backgroundColor:'#fff',
			height:prop.height,
			index:prop.index,
			left:leftOffset,
			prop:prop
		});	
		
		if(prop.backgroundColor!==undefined){
			vw.backgroundColor=prop.backgroundColor;
		}

		if(prop.borderColor!==undefined){
			vw.borderColor=prop.borderColor;
		}			

		if(prop.borderRadius!==undefined){
			vw.borderRadius=prop.borderRadius;
		}	

		if(prop.borderWidth!==undefined){
			vw.borderWidth=prop.borderWidth;
		}	
			
		vw.addEventListener('click', function(e) {
	     	selectObject(e.source);
	    });
		
		return vw;
	};
	
	for (var iLoop = 0; iLoop < listLength; iLoop++) {
		leftOffsetCount=(leftOffset+totalLength);
		scrollView.add(createTabView(leftOffsetCount,providerList[iLoop]));
		totalLength=(leftOffsetCount+providerList[iLoop].width);
	}
	
	scrollView.contentWidth=totalLength;
	setDefault();
	return scrollView;
};
