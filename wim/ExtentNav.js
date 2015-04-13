
/*
	Copyright: 2012 WiM - USGS
	Author: Blake Draper, USGS Wisconsin Internet Mapping
	Created: December 7, 2012
*/

dojo.provide("wim.ExtentNav");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._WidgetBase");
dojo.require("dijit._OnDijitClickMixin");

dojo.require("esri.map");
dojo.require("esri.toolbars.Navigation");

dojo.declare("wim.ExtentNav", [dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin], 
{
  templatePath: dojo.moduleUrl("wim", "templates/ExtentNav.html"),
  
  baseClass: "extentNav",  
  attachedMapID : null,
  initExtent: null,
  
  constructor: function (){
	  
  },
  
  postCreate: function () {
	  
	  dojo.connect(navToolbar, "onExtentHistoryChange", extentHistoryChangeHandler);
	  
	  function extentHistoryChangeHandler() {
        dijit.byId("back").disabled = navToolbar.isFirstExtent(dojo.byId(map));
        dijit.byId("fwd").disabled = navToolbar.isLastExtent(dojo.byId(map));
      }	
	  
   },
   
		
  _onBackClick: function() {
		navToolbar.zoomToPrevExtent();
  },
  
  _onFwdClick: function () {
	  navToolbar.zoomToNextExtent();
  },
  
  _onFullClick: function () {
	 map.setExtent(this.initExtent);
	 
  }
  
});