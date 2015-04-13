/* 
    Copyright 2012 USGS WiM
*/

/*
    Author: Nick Estes
    Created: December 14, 2012
*/


dojo.provide("wim.Disclaimer");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._WidgetBase");

dojo.declare("wim.Disclaimer", [dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin],
{
    templatePath: dojo.moduleUrl("wim", "templates/Disclaimer.html"),

    baseClass: "disclaimer",
    attachedMapID: null,

    constructor: function () {
        
    },

    postCreate: function () {

        var domNode = this;
		
		var horCenter = dojo.style(document.body, "width") / 2;
		var vertCenter = dojo.style(document.body, "height") / 2;
        var disclaimerWidth = dojo.style(this.id, "width") / 2;
		var disclaimerHeight = dojo.style(this.id, "height") / 2;
        dojo.style(this.id, 'left', horCenter - disclaimerWidth + "px");
		dojo.style(this.id, 'top', vertCenter - disclaimerHeight + "px");
		
	},

    _onChange: function () {
        /*var domNode = this;

        var center = dojo.style(document.body, "width") / 2;
        var llsWidth = dojo.style(this.id, "width") / 2;
        dojo.style(this.id, 'left', center - llsWidth + "px");*/
    }

});

