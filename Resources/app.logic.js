if(typeof('bark')==='undefined'){
	var bark={};	
}

//Add the search provider manager
bark.searchProviders = require('search');
bark.searchProviders.registerProviders(bark.session.keys);

//Fetch the list of search providers
bark.session.providerList = bark.searchProviders.fetchProviderList();
//Set the default provider info to first one in the list			
bark.activeProvider={
	id:0,
	name:bark.session.providerList[0].name,
	format:bark.session.providerList[0].format,
	needRefresh:true
};

//Add the helpers commonjs library 
bark.helpers = require('helpers');
//Add Core Geo (From Prject Atlas)
bark.atlas=require('Atlas/atlas');
//Activate my location providers
bark.atlas.Find.buildProviders(bark.searchProviders.myLocationProviders());
//Check if Geo is enabled
bark.session.geoEnabled = bark.atlas.Geo.enabled();
Ti.API.info('bark.session.geoEnabled=' + bark.session.geoEnabled);

//This function let's us open the windows in a generic way
bark.pageManager=function(win){
	if(bark.session.isAndroid){
		win.open();
	}else{
		bark.tabs.currentTab.open(win);
	}
};
bark.moduleManager=(function (context) {
	context.requestedPage='';
	context.errorCallback=null;
	context.lastSearchTerm='';
	context.currentSearchTerm='';
	context.searchResults = function(results){
		Ti.App.fireEvent('app:finish_loading');
		if(!results.success){
			context.errorCallback(results.message);
			return;		
		}

		if((results.content!==undefined)&&(results.content!==null)){
			bark.activeProvider.needRefresh=false; //Mark the provider refreshed
			bark.session.searchResults = results; //Hold onto this for later
			context.lastSearchTerm=context.currentSearchTerm;
			context.pageBuilder(context.requestedPage,bark.session.searchResults);		
		}else{
			context.errorCallback("Oops we ran into a problem, please try again.");
			return;					
		}
		
	};
	context.need2Search=function(term){
		if((bark.session.searchResults===undefined)||(bark.session.searchResults===null)){
			return true;
		}
		if(bark.activeProvider.needRefresh){
			return true;
		}
		if(context.lastSearchTerm!==context.currentSearchTerm){
			return true;
		}
		return false;
	};
	context.doSearch =  function(pageName,term,errorCallback){
		Ti.App.fireEvent('app:start_loading',{msg:'Searching Please Wait...'});
		context.requestedPage=pageName; //Remember the page we are calling, we will need this later
		context.errorCallback=errorCallback; //Just in case we have an error, we use a callback to send it
		context.currentSearchTerm=term; //Remember our search term
		
		//Make sure we have location info
		if(bark.session.location===undefined || bark.session.location===null){
			errorCallback('Please select a location before searching');
			return;
		}
		
		if(!bark.session.location.isValid){
			errorCallback('Unable to find the entered locatio, please try another');
			return;
		}
		
		//Check if we need to actually search or if we've already got what we need
		if(!context.need2Search()){
			Ti.App.fireEvent('app:finish_loading');
			context.pageBuilder(context.requestedPage,bark.session.searchResults);	
			return;
		}
		//We first build our basic criteria
		var mySearch ={
			latitude:bark.session.location.latitude,
			longitude:bark.session.location.longitude
		};
		//If a search term is provided, we add that
		if((term!==undefined) && (term!==null)){
			if(term.length>0){
				mySearch.term=term.trim();
			}	
		}		
		//We add something special for Twitter
		if(bark.activeProvider.id===2){
			mySearch.radius="2km";
		}
		//Get the current provider
		var currentProvider = bark.searchProviders.fetchActiveProvider();
		//Turn our generic parameters into what the provider needs
		var myProviderSearchCriteria = currentProvider.buildSearchCriteria(mySearch);
		context.lastSearchTerm=term; //Remember for next time
		//We are now ready to search. We just pass in the criteria and a callback
		currentProvider.searchContent(myProviderSearchCriteria,this.searchResults);			
	};
	context.pageBuilder = function(pageName,searchResults){
		context.requestedPage=pageName;
		if((bark.poiWeb===undefined)||(bark.poiWeb===null)){
			bark.poiWeb = require('poi_web');
		}

		if(pageName==='ar'){
			
			 if((bark.poiAR===undefined)||(bark.poiAR===null)){
			 	Ti.App.fireEvent('app:start_loading',{msg:'Loading Camera. Please Wait...'});
				bark.poiAR = require('poi_camera');
			 }
			Ti.App.fireEvent('app:start_loading',{msg:'Loading Camera. Please Wait...'});
			 bark.poiAR.fetchCamera(bark);
			 				
			return;
		}
					
		if(pageName==='list'){
			if((bark.poiList===undefined)||(bark.poiList===null)){
				bark.poiList = require('poi_list');
				bark.ui.winList = bark.poiList.window(bark);
			}
			bark.pageManager(bark.ui.winList);	
		}
		
		if(pageName==='map'){
			if((bark.poiMap===undefined)||(bark.poiMap===null)){
				bark.poiMap = require('poi_map');
				bark.ui.winMap = bark.poiMap.window(bark);
			}		
			bark.pageManager(bark.ui.winMap);		
		}		
	};
			
	return context;
	
}(bark.moduleManager || {}));

bark.setProvider=function(providerIndex){
	bark.activeProvider.id=providerIndex;
	bark.activeProvider.name=bark.session.providerList[providerIndex].name;
	bark.activeProvider.format=bark.session.providerList[providerIndex].format;
	bark.activeProvider.needRefresh=true;
	bark.searchProviders.activateProvider(providerIndex);
};
