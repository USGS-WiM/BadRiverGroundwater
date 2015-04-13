//02.07.13 -ESM- Created

/*
	Copyright: 2013 WiM - USGS
	Author: Erik Myers, USGS Wisconsin Internet Mapping
	Created: February 7, 2013	
*/

//THE OLD DOJO WAY...
	
dojo.provide("wim.BasicPopup");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._OnDijitClickMixin");
dojo.require("dijit._WidgetBase");
dojo.require("dojo.fx");

dojo.require("esri.map");
dojo.require("esri.dijit.Popup");
dojo.require("esri.layers.FeatureLayer");


dojo.declare("wim.BasicPopup", [ dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin ],
{
	templatePath: dojo.moduleUrl("wim","templates/BasicPopup.html"),
	
	/* Define your component custom attributes here ... */
	baseClass: "basicPopup",
	attachedMapID: null,
	
	constructor: function() {
		//add here anything that will be executed in the widget initialization.
		alert("constructor")
	},	
		
	//iconClick handler
	_onIconClick: function(){
		if (dojo.getStyle("basicPopupInner", "display") != "none"){
			dojo.setStyle("basicPopupInner", "display", "none");
		}
	},
	
	


	//WILL CONNECT TO ESRI POPUP LOGIC BELOW
	postCreate: function(){
		
		
		dojo.connect(map, "onClick", function(evt){
			alert('onclick function')
			/*var query = new esri.tasks.Query();
			query.gemoetry - pointToExtent(map, evt.mapPoint,5);
			var deferred = featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
			map.infoWindow.setFeatures([deferred]);
			map.infoWindow.show(evt.mapPoint);*/
				
		});
	
		// add here anything that will be executed in after the DOM is loaded and ready.
		// For example, adding events on the dojo attach points is suitable here.	
		
				
		// Attach an onclick event on the user name node.		
		/*dojo.connect(this.nameNode, "onclick", function (event) {
			alert("The selected name is: " + localTitle);
		});	*/
	}
	
});