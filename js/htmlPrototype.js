// 02.16.12 - NE - javascript file for template
/* 
	Copyright 2012 USGS WiM
*/
	
/*
	Author: Nick Estes
	Created: February 16, 2012	
*/

dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.map");
dojo.require("esri.tasks.Locator");

var mapLayers = [];
var basemaps = [];

    
var map;
var basemap;
var streetsBaseUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
var imageryBaseUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
var topoBaseUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";

var floodQueryTask, floodQuery;

var siteSymSize;

var locator;
    

function init() {

    //Check for mobile
	var mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));  
	if (mobile) {  
		esri.config.defaults.map.slider = { top:"105px", left:"20px", height:"150px", width:null}; 
		siteSymSize = 16;
		$.getScript("http://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.1compact");		        
	} else {
		esri.config.defaults.map.slider = { top:"105px", left:"20px", height:"200px", width:null}; 
		siteSymSize = 10;
	} 
    
    //Initial zoom extent an map setup
    var initExtent = new esri.geometry.Extent({"xmin":-15235725.666483294,"ymin":2134628.3639278114,"xmax":-5852927.570423835,"ymax":7178249.23829554,"spatialReference":{"wkid":102100}});
    map = new esri.Map("map",{
		slider: true,
        wrapAround180: true,
		logo:false,
        extent:initExtent
    });
   

	//Loading Screen
	dojo.connect(map, "onUpdateStart", function() {
	  esri.show(dojo.byId("loadingStatus"));
	});
	dojo.connect(map, "onUpdateEnd", function() {
	  esri.hide(dojo.byId("loadingStatus"));
    });	

	
	//Attempt to require
//    require(["modules/geocoder", "modules/basemap", "dojo/domReady!"],
//        function () {
//            console.log('requirement worked?');
//        });
	
	//Basemap Toogle
    basemapGallery = createBaseMapGallery();
    
    dojo.connect(map, "onLoad", addLayers);
    
    dojo.connect(map, "onLoad", function(theMap) {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });
	dojo.connect(map, "onClick", getExtents);
	
	
	
	// query for site results
	floodQueryTask = new esri.tasks.QueryTask("http://wim.usgs.gov/ArcGIS/rest/services/FIMIMapper/fimi_flood_extents/MapServer/0")
	floodQuery = new esri.tasks.Query();
	floodQuery.where = "USGSID =="
	floodQuery.outFields = ["*"];
	floodQuery.returnGeometry = true;
	floodQuery.outSpatialReference = {"wkid":102100};
	
	dojo.connect(floodQueryTask, "onComplete", floodResult);

	// add scalebar to bottom left of map
	var scalebar = new esri.dijit.Scalebar({
 		map: map,
  		attachTo:"bottom-left"
	});
	
	// add draggable behavior to infoWindow
	$( "#infoWindow" ).dialog({autoOpen: false});
    function addLayers(map) {

        var content = "<b>site no</b>: ${SITE_NO}";
    
        var siteSym = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, siteSymSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color("white"), 1), new dojo.Color([0,0,0, .9]));
        var renderer = new esri.renderer.SimpleRenderer(siteSym);
    
        var infoTemplate = new esri.InfoTemplate("Site no: ${SITE_NO}", content);

        var fimiSites = new esri.layers.FeatureLayer("http://wim.usgs.gov/ArcGIS/rest/services/FIMIMapper/fimi_sites/MapServer/0", {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"],
          infoTemplate: infoTemplate
        });
        fimiSites.setRenderer(renderer);

        var nwisSWSiteParams = new esri.layers.ImageParameters();
        nwisSWSiteParams.format = "PNG24"

        var nwisSWSites = new esri.layers.ArcGISDynamicMapServiceLayer("http://137.227.233.147/ArcGIS/rest/services/NWIS/nwis_sw_sites/MapServer", { "opacity": 0.9, "imageParameters": nwisSWSiteParams });

        map.addLayer(nwisSWSites);
        map.addLayer(fimiSites);
        map.infoWindow.resize(200,150);
        mapLayers.push(fimiSites);  //this client side map layer is the maps graphics layer

    

    }

    function getExtents(event) {
	    //click = query.geometry = event.mapPoint;
	    //floodQueryTask.execute(floodQuery);
	    // put feature layer select features task in here 
	    // to get the site, then pass site no to floodquerytask 
	    // to get flood extents
    }
    
	

    function floodResult() {

    }

    //Basemap JS
    function createBaseMapGallery() {

        var streetBasemapLayer = new esri.dijit.BasemapLayer({ url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer" })
        var streetBasemap = new esri.dijit.Basemap({
            layers: [streetBasemapLayer],
            id: "0",
            title: "Street Basemap",
            thumbnailUrl: "images/shield.png"
        });
        basemaps.push(streetBasemap);

        var imageryBasemapLayer = new esri.dijit.BasemapLayer({ url: imageryBaseUrl })
        var imageryBasemap = new esri.dijit.Basemap({
            layers: [imageryBasemapLayer],
            id: "1",
            title: "Imagery Basemap",
            thumbnailUrl: "images/satellite.png"
        });
        basemaps.push(imageryBasemap);

        var topoBasemapLayer = new esri.dijit.BasemapLayer({ url: topoBaseUrl })
        var topoBasemap = new esri.dijit.Basemap({
            layers: [topoBasemapLayer],
            id: "2",
            title: "Topo Basemap",
            thumbnailUrl: "images/mountain.png"
        });
        basemaps.push(topoBasemap);


        basemapGallery = new esri.dijit.BasemapGallery({
            showArcGISBasemaps: false,
            basemaps: basemaps,
            map: map
        });
        basemapGallery.startup();
        dojo.connect(basemapGallery, "onError", function (error) { console.log(error) });

        dojo.forEach(basemapGallery.basemaps, function (basemap) {

            var newListItem = document.createElement('li');
            var newImage = document.createElement('img');

            newImage.src = basemap.thumbnailUrl;
            newImage.onClick = dojo.hitch(this, function () {
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

    //Geocoder JS
    locator = new esri.tasks.Locator("http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Address_NA_10/GeocodeServer");
    dojo.connect(locator, "onAddressToLocationsComplete", showResults);

    function enterKeyLocate(e) {
        var keynum;

        if (window.event) // IE
        {
            keynum = e.keyCode;
        }
        else if (e.which) // Netscape/Firefox/Opera
        {
            keynum = e.which;
        }

        if (keynum == 13) {
            locate()
        }
    }

    function locate() {
        map.graphics.clear();
        var address = { "SingleLine": dojo.byId("geocode").value };
        locator.outSpatialReference = map.spatialReference;
        locator.addressToLocations(address, ["Loc_name"]);
    }

    function showResults(candidates) {
        var candidate;
        var symbol = new esri.symbol.SimpleMarkerSymbol();
        var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");

        symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE);
        symbol.setColor(new dojo.Color([153, 0, 51, 0.75]));

        var geom;

        dojo.every(candidates, function (candidate) {
            if (candidate.score > 80) {
                var attributes = { address: candidate.address, score: candidate.score, locatorName: candidate.attributes.Loc_name };
                geom = candidate.location;
                var graphic = new esri.Graphic(geom, symbol, attributes, infoTemplate);
                //add a graphic to the map at the geocoded location
                map.graphics.add(graphic);

                return false; //break out of loop after one candidate with score greater  than 80 is found.
            }
        });
        if (geom !== undefined) {
            map.centerAndZoom(geom, 12);
        }

    }

}

dojo.addOnLoad(init);

    
function orientationChanged() {
	console.log("Orientation changed: " + window.orientation);
	if(map){
	    map.reposition();
	    map.resize();
	}
}




