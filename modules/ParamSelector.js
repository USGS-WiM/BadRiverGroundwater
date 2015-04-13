
/*
	Copyright: 2012 WiM - USGS
	Author: Blake Draper, USGS Wisconsin Internet Mapping
	Created: April 24th, 2013
*/

dojo.provide("modules.ParamSelector");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._WidgetBase");
dojo.require("dijit._OnDijitClickMixin");

dojo.require("esri.map");

dojo.declare("modules.ParamSelector", [dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin], 
{
  templatePath: dojo.moduleUrl("modules", "templates/ParamSelector.html"),
  
  baseClass: "paramSelector",  
  attachedMapID : null,
  
  constructor: function (){
	  
	  
  },
  
  postCreate: function () {
	   
  },
  
   postCreate: function () {

        //This code centers teh lat/lng box in the mapper after load due to different size screens.
		var domNode = this;

        var center = dojo.style(document.body, "width") / 2;
        var llsWidth = dojo.style(this.id, "width") / 2;
        dojo.style(this.id, 'left', center - llsWidth + "px");

    },

    _onChange: function () {
        var domNode = this;

        var center = dojo.style(document.body, "width") / 2;
        var llsWidth = dojo.style(this.id, "width") / 2;
        dojo.style(this.id, 'left', center - llsWidth + "px");
    }

   
		
  
});