/* 
	Copyright 2011 USGS WiM
*/
	
/*
	Author: Jonathan Baier
	Created: December 14, 2011	
*/


//var basemaps = [];

function createBaseMapGallery() {

		var streetBasemapLayer = new esri.dijit.BasemapLayer({  url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer" })
        var streetBasemap = new esri.dijit.Basemap({
		  layers:  [streetBasemapLayer],
		  id: "0",
		  title:"Street Basemap",
		  thumbnailUrl:"images/shield.png"
		});
		basemaps.push(streetBasemap);
				
        var imageryBasemapLayer = new esri.dijit.BasemapLayer({  url: imageryBaseUrl })
        var imageryBasemap = new esri.dijit.Basemap({
		  layers:[imageryBasemapLayer],
		  id: "1",
		  title:"Imagery Basemap",
		  thumbnailUrl:"images/satellite.png"
		});
		basemaps.push(imageryBasemap);
		
        var topoBasemapLayer =  new esri.dijit.BasemapLayer({  url: topoBaseUrl	})
        var topoBasemap = new esri.dijit.Basemap({
		  layers:[topoBasemapLayer],
		  id: "2",
		  title:"Topo Basemap",
		  thumbnailUrl:"images/mountain.png"
		});
		basemaps.push(topoBasemap);
		
		
		basemapGallery = new esri.dijit.BasemapGallery({
          showArcGISBasemaps: false,
		  basemaps: basemaps,
          map: map
        });
        basemapGallery.startup();
		dojo.connect(basemapGallery, "onError", function(error) {console.log(error)});
       
	   	dojo.forEach(basemapGallery.basemaps, function(basemap) {            
		 				
			var newListItem = document.createElement('li');
			var newImage = document.createElement('img');
			
			newImage.src = basemap.thumbnailUrl;
			newImage.onClick = dojo.hitch(this, function() {
			  this.basemapGallery.select(basemap.id);
			});
			newListItem.appendChild(newImage);
		 
			//Add an icon button for each basemap
			//dijit.byId("basemapBarList").addChild(newListItem);
	  	});	  
		
		return basemapGallery
	
}

function basemapToggle(button, id) {
	basemapGallery.select(id);
	button.parent().siblings('.current').removeClass('current');
	button.parent().addClass('current');	
}