/*@preserve 
    Copyright 2012 USGS WiM
*/

/*@preserve
    Author: Nick Estes
    Created: October 25, 2012
*/

// 06.19.13 - NE - Updated to include map scale in the latLngScaleBar wimjit. Reworked property so only the map object is needed.


dojo.provide("wim.LatLngScale");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._WidgetBase");

dojo.require("esri.map");

dojo.declare("wim.LatLngScale", [dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin],
{
    templatePath: dojo.moduleUrl("wim", "templates/LatLngScale.html"),

    baseClass: "latLngScale",
    map: null,

    constructor: function () {
        
    },

    postCreate: function () {
		
        if (this.map != null) {
			
			//This code centers teh lat/lng box in the mapper after load due to different size screens.
			var domNode = this;
			
			var theMap = this.map;
			
			var bodyWidth = dojo.getStyle(document.body, "width");
			
			//Fires scale update on LatLngScale wimjit when zoom level is changed in map.
			dojo.connect(theMap, "onZoomEnd", function(extent,zoomFactor,anchor,level) {
				domNode._onScaleChange();
			});
		
			var center = dojo.style(theMap.container, "width") / 2;
			var llsWidth = dojo.style(this.id, "width") / 2;
			dojo.style(this.id, 'left', center - llsWidth + "px");
			
			//Set initial scale value
			domNode.containerNode.innerHTML = "Map Scale: 1:" + theMap.getScale().toFixed(0);

        	dojo.connect(dojo.byId(theMap.container.id), "onmousemove", function (evt) {
                if (evt.mapPoint != null) {
                    var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);
					domNode.textNode.innerHTML = "Lat: " + mp.y.toFixed(4) + ", Lng: " + mp.x.toFixed(4);
					
					if (bodyWidth != dojo.getStyle(document.body, "width")) {
						var center = dojo.style(theMap.container, "width") / 2;
        				var llsWidth = dojo.style(domNode.id, "width") / 2;
        				dojo.style(domNode.id, 'left', center - llsWidth + "px");
        				bodyWidth = dojo.getStyle(document.body, "width");
					}
				}
            });
            
            /*dojo.connect(document.body, "resize", function (evt) {
                var center = dojo.style(theMap.container, "width") / 2;
        		var llsWidth = dojo.style(domNode.id, "width") / 2;
        		dojo.style(domNode.id, 'left', center - llsWidth + "px");
            });*/
		} else {
            console.log('map property is null');
        }

    },

    _onScaleChange: function () {
        
		this.containerNode.innerHTML = "Map Scale: 1:" + this.map.getScale().toFixed(0);
        
    }

});

