// 03.06.13 -ESM- Created.
// 03.11.13 -ESM- Added gif div within dijit to increase display speed.

/*
	Copyright: 2013 WiM - USGS
	Author: Erik Myers USGS Wisconsin Internet Mapping
	Created: March, 06 2013
*/

dojo.provide("wim.LoadingScreen");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._WidgetBase");

dojo.declare("wim.LoadingScreen", [dijit._WidgetBase, dijit._Container, dijit._TemplatedMixin],
{
    templatePath: dojo.moduleUrl("wim", "templates/LoadingScreen.html"),

    baseClass: "loadingScreen",
    attachedMapID: null,

    constructor: function () {
		dojo.create('img', {
				id: 'loadingScreenGraphic',
				src: 'images/LoadingOrange110.gif',
			}, dojo.byId('loadingScreen'));
    },
	
	postCreate: function(){
	}
});