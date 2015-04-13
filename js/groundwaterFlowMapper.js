//Copyright 2013 USGS Wisconsin Internet Mapping(WiM)
//Developer: E. Myers (USGS WiM)
//Created: 09.03.13 
//Science Leads: M.Fienen and A.Leaf (USGS WIWSC)	


dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.InfoWindow");
dojo.require("esri.dijit.Legend");
dojo.require("esri.symbol");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.graphic");
dojo.require("esri.map");
dojo.require("esri.tasks.locator");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.geometry.Geometry");
dojo.require("esri.geometry.Point");

dojo.require("dojo.fx")
dojo.require("dijit.form.ToggleButton")
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Tooltip");

//experiment
dojo.require("esri.toolbars.draw");
dojo.require("esri.toolbars.navigation");
//experiment

dojo.require("wim.CollapsingContainer");
dojo.require("wim.ExtentNav");
dojo.require("wim.LatLngScale");
dojo.require("wim.RefreshScreen");
dojo.require("wim.LoadingScreen");


//various global variables are set here (Declare here, instantiate below)     
var map, legendLayers = [];
var identifyTask, identifyParams;
var identifyTaskRaster, identifyParamsRaster;
var navToolbar;
var locator;
var currentlyVisible = "";
var rasterLayer = "";
//MUST CHANGE IF SERVICE LAYER for PREDICTIONS CHANGES... ALSO HAVE TO CHANGE IN THE IDENTIFY TASK
var identifyLayersArr = [31];
var mapLayerName = "";
var checkBoxDisplay = [];
var serviceLayerId = "";
var tb;
var savedLayerId;
     
function init() {
	//sets up the onClick listener for the USGS logo
	dojo.connect(dojo.byId("usgsLogo"), "onclick", showUSGSLinks);
	
	// a popup is constructed below from the dijit.Popup class, which extends some addtional capability to the InfoWindowBase class.
	markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND, 20,
  		new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
  		new dojo.Color([249,122,78]), 1.5),
  		new dojo.Color([89,89,91,0.2]));
	var popup = new esri.dijit.Popup({markerSymbol: markerSymbol},dojo.create("div"));
	
	map = new esri.Map("map", {
    	basemap: "topo",
		wrapAround180: true,
		extent: new esri.geometry.Extent(   {"xmin":-10244854.90105959,"ymin":5752192.126571113,"xmax":-9951336.712444402,"ymax":5921729.4553077,"spatialReference":{"wkid":102100}}), 
		slider: true,
		sliderStyle: "large", //use "small" for compact version
		logo:false,
		infoWindow: popup
	});
	
	//navToolbar constructor declared, which serves the extent navigator tool.
    navToolbar = new esri.toolbars.Navigation(map);
	
	//dojo.connect method (a common Dojo framework construction) used to call mapReady function. Fires when the first or base layer has been successfully added to the map.
    dojo.connect(map, "onLoad", mapReady);
	
	//basemapGallery constructor which serves the basemap selector tool. List of available basemaps can be customized. Here,default ArcGIS online basemaps are set to be available.
	var basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps: true,
		map: map
	}, "basemapGallery");
	basemapGallery.startup();
	
	//basemapGallery error catcher
	dojo.connect(basemapGallery, "onError", function() {console.log("Basemap gallery failed")});
	
	//calls the executeSiteIdentifyTask function from a click on the map. 
	dojo.connect(map, "onClick", executeSiteIdentifyTask);
	
	var predictionLocations = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", { 
		"visible": true,
		id: 'predictionLocations'
	});
	predictionLocations.setVisibleLayers([31]);
	
	var reservationBounds = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", { 
		"visible": false,
		id: 'reservationBounds'
	});
	reservationBounds.setVisibleLayers([29]);

	var pitMinePoly = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", { 
		"visible": false,
		id: 'pitMinePoly'
	});
	pitMinePoly.setVisibleLayers([32]);
	
	var WTContours = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", { 
		"visible": false,
		id: 'WTContours'
	});
	WTContours.setVisibleLayers([33]);
	
	/*var streamflow = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", { 
		"visible": false,
		id: 'streamflow'
	});
	streamflow.setVisibleLayers([29]);*/
	
	
	//organize legend layers
	legendLayers.push({layer:WTContours, title: 'Water Table Contours'});
	legendLayers.push({layer:reservationBounds, title: 'Bad River Reservation Boundary'});
	legendLayers.push({layer:pitMinePoly, title: 'Proposed Mining Location'});
	//legendLayers.push({layer:streamflow, title: 'Bad River Streamflow'});

	//organize the checkbox
	checkBoxDisplay.push({layer:WTContours, title: 'Water Table Contours'});
	checkBoxDisplay.push({layer:reservationBounds, title: 'Bad River Reservation Boundary'});
	checkBoxDisplay.push({layer:pitMinePoly, title: 'Proposed Mining Location'});
	//checkBoxDisplay.push({layer:streamflow, title: 'Bad River Streamflow'});
	checkBoxDisplay.push({layer:predictionLocations, title: 'Prediction Locations'});
	
	

	//BEGIN the Uncertainty Point layers
    var drawDown1Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'drawDown1'
	});
	drawDown1Points.setVisibleLayers([0]);
	legendLayers.push({layer:drawDown1Points,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction1'});

	var drawDown2Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'drawDown2'
	});
	drawDown2Points.setVisibleLayers([1]);
	legendLayers.push({layer:drawDown2Points,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction2'});

	var drawDown3Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'drawDown3'
	});
	drawDown3Points.setVisibleLayers([2]);
	legendLayers.push({layer:drawDown3Points,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction3'});

	var fishHatchPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'fishHatch'
	});
	fishHatchPoints.setVisibleLayers([3]);
	legendLayers.push({layer:fishHatchPoints,title:'Normalized Uncertainty Reduction for Water level in artesian well at Bad River Fish Hatchery'});

	var resSwPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'resSw'
	});
	resSwPoints.setVisibleLayers([4]);
	legendLayers.push({layer:resSwPoints,title:'Normalized Uncertainty Reduction for Groundwater levels at southwest corner of reservation'});
	
	var resSePoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'resSe'
	});
	resSePoints.setVisibleLayers([5]);
	legendLayers.push({layer:resSePoints,title:'Normalized Uncertainty Reduction for Groundwater levels at southeast corner of reservation'});

	var resSPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'resS'
	});
	resSPoints.setVisibleLayers([6]);
	legendLayers.push({layer:resSPoints,title:'Normalized Uncertainty Reduction for Groundwater levels near middle part of southern reservation boundary'});

	var carolinePoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'caroline'
	});
	carolinePoints.setVisibleLayers([7]);
	legendLayers.push({layer:carolinePoints,title:'Normalized Uncertainty Reduction for Groundwater levels near Caroline Lake'});

	var obrienPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'obrien'
	});
	obrienPoints.setVisibleLayers([8]);
	legendLayers.push({layer:obrienPoints,title:"Normalized Uncertainty Reduction for Groundwater levels near O'brien Lake"});

	var mccarthyPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'mccarthy'
	});
	mccarthyPoints.setVisibleLayers([9]);
	legendLayers.push({layer:mccarthyPoints,title:'Normalized Uncertainty Reduction for Groundwater levels near McCarthy Lake'});

	var bad169Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'bad169'
	});
	bad169Points.setVisibleLayers([10]);
	legendLayers.push({layer:bad169Points,title:'Normalized Uncertainty Reduction for Bad River baseflow at highway 169'});

	var tyGehrmanPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'tyGehrman'
	});
	tyGehrmanPoints.setVisibleLayers([11]);
	legendLayers.push({layer:tyGehrmanPoints,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow above confluence with Gehrman Creek'});

	var spbrkBrunsPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'spbrkBruns'
	});
	spbrkBrunsPoints.setVisibleLayers([12]);
	legendLayers.push({layer:spbrkBrunsPoints,title:'Normalized Uncertainty Reduction for Spring Brook Creek above confluence with Brunsweiler River'});

	var prenticeParkPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'prenticePark'
	});
	prenticeParkPoints.setVisibleLayers([13]);
	legendLayers.push({layer:prenticeParkPoints,title:'Normalized Uncertainty Reduction for Water levels in artesian wells at Prentice Park'});

	var minersvilleAPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'minersvileA'
	});
	minersvilleAPoints.setVisibleLayers([14]);
	legendLayers.push({layer:minersvilleAPoints,title:'Normalized Uncertainty Reduction for Water levels in artesian well at Minersville'});

	var bf121Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'bf121'
	});
	bf121Points.setVisibleLayers([15]);
	legendLayers.push({layer:bf121Points,title:'Normalized Uncertainty Reduction for Water levels near Mellen municipal well'});

	var graveyardPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'graveyard'
	});
	graveyardPoints.setVisibleLayers([16]);
	legendLayers.push({layer:graveyardPoints,title:'Normalized Uncertainty Reduction for Graveyard Creek baseflow, USGS site 4027689'});

	var winksGurneyPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'winksGurney'
	});
	winksGurneyPoints.setVisibleLayers([17]);
	legendLayers.push({layer:winksGurneyPoints,title:'Normalized Uncertainty Reduction for Spring flow to Winks Creek near Gurney, WI, USGS site 4026911'});

	var potatoUpson59Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'potatoUpson59'
	});
	potatoUpson59Points.setVisibleLayers([18]);
	legendLayers.push({layer:potatoUpson59Points,title:'Normalized Uncertainty Reduction for Potato River baseflow near Upson, WI, USGS site 4026859'});

	var tylerMoorePoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'tylerMoore'
	});
	tylerMoorePoints.setVisibleLayers([19]);
	legendLayers.push({layer:tylerMoorePoints,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow at Moore Park Rd.'});

	var tylerFork61Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'tylerFork61'
	});
	tylerFork61Points.setVisibleLayers([20]);
	legendLayers.push({layer:tylerFork61Points,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow at Stricker Rd., USGS site 4026561'});

	var badMellenPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'badMellen'
	});
	badMellenPoints.setVisibleLayers([21]);
	legendLayers.push({layer:badMellenPoints,title:'Normalized Uncertainty Reduction for Bad River baseflow near Mellen, WI, USGS site 4026450'});

	var cityMellenPoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'cityMellen'
	});
	cityMellenPoints.setVisibleLayers([22]);
	legendLayers.push({layer:cityMellenPoints,title:'Normalized Uncertainty Reduction for City Creek baseflow, USGS site 40265095'});
	
	var potatoGurney10Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'potatoGurney10'
	});
	potatoGurney10Points.setVisibleLayers([23]);
	legendLayers.push({layer:potatoGurney10Points,title:'Normalized Uncertainty Reduction for Potato River baseflow near Gurney, WI, USGS site 4026910'});

	var potatoGurney00Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'potatoGurney00'
	});
	potatoGurney00Points.setVisibleLayers([24]);
	legendLayers.push({layer:potatoGurney00Points,title:'Normalized Uncertainty Reduction for Potato River baseflow near Gurney, WI, USGS site 4026900'});

	var potatoUpson80Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'potatoUpson80'
	});
	potatoUpson80Points.setVisibleLayers([25]);
	legendLayers.push({layer:potatoUpson80Points,title:'Normalized Uncertainty Reduction for Potato River baseflow near Upson, WI, USGS site 4026880'});

	var tylerForks30Points = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'tylerForks30'
	});
	tylerForks30Points.setVisibleLayers([26]);
	legendLayers.push({layer:tylerForks30Points,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow near Caroline Lake Rd., USGS site 4026530'});

	var badMorsePoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'badMorse'
	});
	badMorsePoints.setVisibleLayers([27]);
	legendLayers.push({layer:badMorsePoints,title:'Normalized Uncertainty Reduction for Bad River baseflow near Morse, WI, USGS site 4026410'});

	var minnowMorsePoints = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer", {
		"visible":false,
		id: 'minnowMorse'
	});
	minnowMorsePoints.setVisibleLayers([28]);
	legendLayers.push({layer:minnowMorsePoints,title:'Normalized Uncertainty Reduction for Minnow Creek baseflow near Morse, WI, USGS site 4026413'});

	//BEGIN THE RASTER DECLARATIONS
	var drawDown1Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'drawDown1Raster'
	});
	drawDown1Raster.setVisibleLayers([0]);
	legendLayers.push({layer:drawDown1Raster,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction 1'});

	var drawDown2Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'drawDown2Raster'
	});
	drawDown2Raster.setVisibleLayers([1]);
	legendLayers.push({layer:drawDown2Raster,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction 2'});

	var drawDown3Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'drawDown3Raster'
	});
	drawDown3Raster.setVisibleLayers([2]);
	legendLayers.push({layer:drawDown3Raster,title:'Normalized Uncertainty Reduction for Groundwater levels Prediction 3'});

	var fishHatchRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'fishHatchRaster'
	});
	fishHatchRaster.setVisibleLayers([3]);
	legendLayers.push({layer:fishHatchRaster,title:'Normalized Uncertainty Reduction for Water level in artesian well at Bad River Fish Hatchery'});

	var resSwRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'resSwRaster'
	});
	resSwRaster.setVisibleLayers([4]);
	legendLayers.push({layer:resSwRaster,title:'Normalized Uncertainty Reduction for Groundwater levels at southwest corner of reservation'});

	var resSeRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'resSeRaster'
	});
	resSeRaster.setVisibleLayers([5])
	legendLayers.push({layer:resSeRaster,title:'Normalized Uncertainty Reduction for Groundwater levels at southeast corner of reservation'});

	var resSRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'resSRaster'
	});
	resSRaster.setVisibleLayers([6]);
	legendLayers.push({layer:resSRaster,title:'Normalized Uncertainty Reduction for Groundwater levels near middle part of southern reservation boundary'});

	var carolineRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'carolineRaster'
	});
	carolineRaster.setVisibleLayers([7])
	legendLayers.push({layer:carolineRaster,title:'Normalized Uncertainty Reduction for Groundwater levels near Caroline Lake'});

	var obrienRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'obrienRaster'
	});
	obrienRaster.setVisibleLayers([8]);
	legendLayers.push({layer:obrienRaster,title:"Normalized Uncertainty Reduction for Groundwater levels near O'brien Lake"});

	var mccarthyRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'mccarthyRaster'
	});
	mccarthyRaster.setVisibleLayers([9]);
	legendLayers.push({layer:mccarthyRaster,title:'Normalized Uncertainty Reduction for Groundwater levels near McCarthy Lake'});

	var bad169Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'bad169Raster'
	});
	bad169Raster.setVisibleLayers([10])
	legendLayers.push({layer:bad169Raster,title:'Normalized Uncertainty Reduction for Bad River baseflow at highway 169'});

	var tyGehrmanRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'tyGehrmanRaster'
	});
	tyGehrmanRaster.setVisibleLayers([11]);
	legendLayers.push({layer:tyGehrmanRaster,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow above confluence with Gehrman Creek'});

	var spbrkBrunsRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'spbrkBrunsRaster'
	});
	spbrkBrunsRaster.setVisibleLayers([12]);
	legendLayers.push({layer:spbrkBrunsRaster,title:'Normalized Uncertainty Reduction for Spring Brook Creek above confluence with Brunsweiler River'});

	var prenticeParkRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'prenticeParkRaster'
	});
	prenticeParkRaster.setVisibleLayers([13]);
	legendLayers.push({layer:prenticeParkRaster,title:'Normalized Uncertainty Reduction for Water levels in artesian wells at Prentice Park'});

	var minersvilleARaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'minersvilleARaster'
	});
	minersvilleARaster.setVisibleLayers([14]);
	legendLayers.push({layer:minersvilleARaster,title:'Normalized Uncertainty Reduction for Water levels in artesian well at Minersville'});

	var bf121Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'bf121Raster'
	});
	bf121Raster.setVisibleLayers([15]);
	legendLayers.push({layer:bf121Raster,title:'Normalized Uncertainty Reduction for Water levels near Mellen municipal well'});

	var graveyardRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'graveyardRaster'
	});
	graveyardRaster.setVisibleLayers([16]);
	legendLayers.push({layer:graveyardRaster,title:'Normalized Uncertainty Reduction for Graveyard Creek baseflow, USGS site 4027689'});

	var winksGurneyRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'winksGurneyRaster'
	});
	winksGurneyRaster.setVisibleLayers([17]);
	legendLayers.push({layer:winksGurneyRaster,title:'Normalized Uncertainty Reduction for Spring flow to Winks Creek near Gurney, WI, USGS site 4026911'});

	var potatoUpson59Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'potatoUpson59Raster'
	});
	potatoUpson59Raster.setVisibleLayers([18]);
	legendLayers.push({layer:potatoUpson59Raster,title:'Normalized Uncertainty Reduction for Potato River baseflow near Upson, WI, USGS site 4026859'});

	var tylerMooreRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'tylerMooreRaster'
	});
	tylerMooreRaster.setVisibleLayers([19]);
	legendLayers.push({layer:tylerMooreRaster,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow at Moore Park Rd.'});

	var tylerFork61Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'tylerFork61Raster'
	});
	tylerFork61Raster.setVisibleLayers([20]);
	legendLayers.push({layer:tylerFork61Raster,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow at Stricker Rd., USGS site 4026561'});

	var badMellenRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'badMellenRaster'
	});
	badMellenRaster.setVisibleLayers([21]);
	legendLayers.push({layer:badMellenRaster,title:'Normalized Uncertainty Reduction for Bad River baseflow near Mellen, WI, USGS site 4026450'});

	var cityMellenRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'cityMellenRaster'
	});
	cityMellenRaster.setVisibleLayers([22]);
	legendLayers.push({layer:cityMellenRaster,title:'Normalized Uncertainty Reduction for City Creek baseflow, USGS site 40265095'});

	var potatoGurney10Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'potatoGurney10Raster'
	});
	potatoGurney10Raster.setVisibleLayers([23]);
	legendLayers.push({layer:potatoGurney10Raster,title:'Normalized Uncertainty Reduction for Potato River baseflow near Gurney, WI, USGS site 4026910'});

	var potatoGurney00Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'potatoGurney00Raster'
	});
	potatoGurney00Raster.setVisibleLayers([24]);
	legendLayers.push({layer:potatoGurney00Raster,title:'Normalized Uncertainty Reduction for Potato River baseflow near Gurney, WI, USGS site 4026900'});

	var potatoUpson80Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'potatoUpson80Raster'
	});
	potatoUpson80Raster.setVisibleLayers([25]);
	legendLayers.push({layer:potatoUpson80Raster,title:'Normalized Uncertainty Reduction for Potato River baseflow near Upson, WI, USGS site 4026880'});

	var tylerForks30Raster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'tylerForks30Raster'
	});
	tylerForks30Raster.setVisibleLayers([26]);
	legendLayers.push({layer:tylerForks30Raster,title:'Normalized Uncertainty Reduction for Tyler Forks baseflow near Caroline Lake Rd., USGS site 4026530'});

	var badMorseRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'badMorseRaster'
	});
	badMorseRaster.setVisibleLayers([27]);
	legendLayers.push({layer:badMorseRaster,title:'Normalized Uncertainty Reduction for Bad River baseflow near Morse, WI, USGS site 4026410'});

	var minnowMorseRaster = new esri.layers.ArcGISDynamicMapServiceLayer("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer", {
		"visible":false,
		"opacity": 0.50,
		id: 'minnowMorseRaster'
	});
	minnowMorseRaster.setVisibleLayers([28]);
	legendLayers.push({layer:minnowMorseRaster,title:'Normalized Uncertainty Reduction for Minnow Creek baseflow near Morse, WI, USGS site 4026413'});




	
	//IMPORTANT: This is where the layers are added to the map. Normally, this would be a simple list of variables. In this build, the layer variable names must be contained witin
	//an array bracket because the layer info has been placed inside the legendLayers array for the construction of a legend and toggle buttons.
	//IMPORTANT: Layers will be placed in ascending order from the order in this list. i.e., the first layer listed will be on bottom, the last layer listed will be on top.
	map.addLayers([
					predictionLocations,
					reservationBounds,
					pitMinePoly,
					WTContours,
					drawDown1Points,
					drawDown2Points,
					drawDown3Points,
					fishHatchPoints,
					resSwPoints,
					resSePoints,
					resSPoints,
					carolinePoints,
					obrienPoints,
					mccarthyPoints,
					bad169Points,
					tyGehrmanPoints,
					spbrkBrunsPoints,
					prenticeParkPoints,
					minersvilleAPoints,
					bf121Points,
					graveyardPoints,
					winksGurneyPoints,
					potatoUpson59Points,
					tylerMoorePoints,
					tylerFork61Points,
					badMellenPoints,
					cityMellenPoints,
					potatoGurney10Points,
					potatoGurney00Points,
					potatoUpson80Points,
					tylerForks30Points,
					badMorsePoints,
					minnowMorsePoints,
					drawDown1Raster,
					drawDown2Raster,
					drawDown3Raster,
					fishHatchRaster,
					resSwRaster,
					resSeRaster,
					resSRaster,
					carolineRaster,
					obrienRaster,
					mccarthyRaster,
					bad169Raster,
					tyGehrmanRaster,
					spbrkBrunsRaster,
					prenticeParkRaster,
					minersvilleARaster,
					bf121Raster,
					graveyardRaster,
					winksGurneyRaster,
					potatoUpson59Raster,
					tylerMooreRaster,
					tylerFork61Raster,
					badMellenRaster,
					cityMellenRaster,
					potatoGurney10Raster,
					potatoGurney00Raster,
					potatoUpson80Raster,
					tylerForks30Raster,
					badMorseRaster,
					minnowMorseRaster
	
	]);
	
	//this function fires after all layers have been added to map with the map.addLayers method above.
	//this function creates the legend element based on the legendLayers array which contains the relevant data for each layer. 
	dojo.connect(map,'onLayersAddResult',function(results){
			var legend = new esri.dijit.Legend({
				map:map,
				layerInfos:legendLayers
			},"legendDiv");
			legend.startup();

		
		//use specially created checkBoxDisplay array to populate checkbox with select layers
		dojo.forEach (checkBoxDisplay, function(layer){
			if (layer.checkBox !== 'false') {
				var layerName = layer.title;
				var checkBox = new dijit.form.CheckBox({
					name: "checkBox" + layer.layer.id,
					value: layer.layer.id,
					checked: layer.layer.visible,
					onChange: function(evt){
						var checkLayer = map.getLayer(this.value);
						checkLayer.setVisibility(!checkLayer.visible);
						this.checked = checkLayer.visible;
					}
				});
			
				
				if (layer.zoomScale) {
					//create the holder for the checkbox and zoom icon
					var toggleDiv = dojo.doc.createElement("div");
					dojo.place(toggleDiv, dojo.byId("toggle"), "after");
					dojo.place(checkBox.domNode, toggleDiv, "first");
					var checkLabel = dojo.create('label', {
						'for': checkBox.name,
						innerHTML: layerName
					}, checkBox.domNode, "after");
					var scale = layer.zoomScale;
					var zoomImage = dojo.doc.createElement("div");
					zoomImage.id = 'zoom' + layer.layer.id;
					zoomImage.innerHTML = '<img id="zoomImage" style="height: 18px;width: 18px" src="images/zoom.gif" />';
					dojo.connect(zoomImage, "click", function(){
						if (map.getScale() > scale) {
							map.setScale(scale);
							;
						}
					});
					dojo.place(zoomImage, toggleDiv, "last");
					dojo.setStyle(checkBox.domNode, "float", "left");
					dojo.setStyle(checkLabel, "float", "left");
					dojo.setStyle(toggleDiv, "paddingTop", "5px");
					dojo.setStyle(dojo.byId("zoomImage"), "paddingLeft", "10px");
					dojo.setStyle(toggleDiv, "height", "25px");
					//dojo.byId("toggle").appendChild(zoomImage);
					//dojo.appendChild(zoomImage.domNode,dojo.byId("toggle"),"after");
					
					dojo.place("<br/>", zoomImage, "after");
				}
				else {
					dojo.place(checkBox.domNode, dojo.byId("toggle"), "after");
					var checkLabel = dojo.create('label', {
						'for': checkBox.name,
						innerHTML: layerName
					}, checkBox.domNode, "after");
					dojo.place("<br/>", checkLabel, "after");
				}
			}
		});
	});
	
	dojo.connect(map, "onClick", executeSiteIdentifyTask);
	


	identifyTask = new esri.tasks.IdentifyTask("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PREDUNC_results_No_Raster/MapServer");
	identifyTaskRaster = new esri.tasks.IdentifyTask("http://wim.usgs.gov/arcgis/rest/services/BadRiver/PredictionRasters/MapServer");

	identifyParams = new esri.tasks.IdentifyParameters();
	identifyParams.layerIds = identifyLayersArr;
	identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
    identifyParams.tolerance = 8;
    identifyParams.returnGeometry = true;
    identifyParams.width  = map.width;
    identifyParams.height = map.height;

    identifyParamsRaster = new esri.tasks.IdentifyParameters();
   	identifyParamsRaster.layerIds = [0];
    identifyParamsRaster.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
    identifyParamsRaster.tolerance = 1;
    identifyParamsRaster.returnGeometry = true;
    identifyParamsRaster.width  = map.width;
    identifyParamsRaster.height = map.height;

    
	//OPTIONAL: the following function carries out an identify task query on a layer and returns attributes for the feature in an info window according to the 
	//InfoTemplate defined below. It is also possible to set a default info window on the layer declaration which will automatically display all the attributes 
	//for the layer in the order they come from the table schema. This code below creates custom labels for each field and substitutes in the value using the notation ${[FIELD NAME]}. 
    function executeSiteIdentifyTask(evt) {
        identifyParams.geometry = evt.mapPoint;
        identifyParams.mapExtent = map.extent;
		identifyParams.layerIds = identifyLayersArr;
		
       
	    // the deferred variable is set to the parameters defined above and will be used later to build the contents of the infoWindow.
        var deferredResult = identifyTask.execute(identifyParams);
        deferredResult.addCallback(function(response) {     
            // response is an array of identify result objects    
            var resp = response;
			var predictionOnly = 0;
			for (i = 0; i<resp.length; i++){
				if (resp[i].layerId == 30 && predictionOnly == 0){
					predictionOnly = 1;
					response = [resp[i]];
				} 
			} 
			
            return dojo.map(response, function(result) {
                var feature = result.feature;
				
                feature.attributes.layerName = result.layerName;
                var predictionLayerID = result.feature.attributes.ID;
				var resultLayerID = result.layerId;
				//set the customized template for displaying content in the info window. HTML tags can be used for styling.
				// The string before the comma within the parens immediately following the constructor sets the title of the info window.
				
				var template = new esri.InfoTemplate();
				//MUST CHANGE RESULTLAYERID IF THE PRECIDTION LAYER CHANGES IN SERVICES!!!!!!!
				if (resultLayerID == 31){
					map.infoWindow.resize(250,250);
					template = new esri.InfoTemplate("Model Prediction Location",
						"<b>Site Description: </b>${Prediction}</br>"+
						"<b>Prediction Type: </b>${Type}");

					//CONSOLE LOG TESTING
					console.log('UNIQUE ID =' + result.feature.attributes.ID);
					//don't change predictionLayerId unless a prediction layer point is clicked 
					showUncertaintyLayer(predictionLayerID);

				} else {
					map.infoWindow.resize(300,250);
					template = new esri.InfoTemplate("<b>Uncertainty Reduction</b>",
						"<b>Reduction in Uncertainty relative to base uncertainty:</b></br>${Norm_reduc}</br>"+
						"<b>New Observation Name:</b></br>${newobsname}</br>"+
						"<b>Pre-Calibration Uncertainty with the base dataset:</b></br>${base_unc}</br>"+
						"<b>Post-Calibration Uncertainty with the new observation:</b></br>${pstcal_unc}</br>"+
						"<b>Corresponding Model Prediction Location:</b></br>${Prediction}</br>");
				}
					
				//ties the above defined InfoTemplate to the feature result returned from a click event	
                feature.setInfoTemplate(template);
				//returns the value of feature, which is the result of the click event
                return feature;
				
            });
        });
		
        //sets the content that informs the info window to the previously established "deferredResult" variable.
	    map.infoWindow.setFeatures([ deferredResult ]);
		//tells the info window to render at the point where the user clicked. 
        map.infoWindow.show(evt.mapPoint);
    }//end execute 
	
	function showUncertaintyLayer(predictionLayerID){
		
		//switch case changes value of mapLayerName based on the the value of predictionLayerID
		switch (predictionLayerID) {
			//case numbers correspond with the lookup ID in the data layers
			case '0':
				mapLayerName = 'drawDown1';
				serviceLayerId = 0;
				break;
				
			case '1':
				mapLayerName = 'drawDown2';
				serviceLayerId = 1;
				break;
				
			case '2':
				mapLayerName = 'drawDown3';
				serviceLayerId = 2;
				break;
				
			case '3':
				mapLayerName = 'fishHatch';
				serviceLayerId = 3;
				break;
				
			case '4':
				mapLayerName = 'resSw';
				serviceLayerId = 4;
				break;
				
			case '5':
				mapLayerName = 'resSe';
				serviceLayerId = 5;
				break;
				
			case '6':
				mapLayerName = 'resS';
				serviceLayerId = 6;
				break;
				
			case '7':
				mapLayerName = 'caroline';
				serviceLayerId = 7;
				break;

			case '8':
				mapLayerName = 'obrien';
				serviceLayerId = 8;
				break;

			case '9':
				mapLayerName = 'mccarthy';
				serviceLayerId = 9;
				break;

			case '10':
				mapLayerName = 'bad169';
				serviceLayerId = 10;
				break;

			case '15':
				mapLayerName = 'tyGehrman';
				serviceLayerId = 11;
				break;

			case '16':
				mapLayerName = 'spbrkBruns';
				serviceLayerId = 12;
				break;

			case '17':
				mapLayerName = 'prenticePark';
				serviceLayerId = 13;
				break;

			case '18':
				mapLayerName = 'minersvileA';
				serviceLayerId = 14;
				break;

			case '19':
				mapLayerName = 'bf121';
				serviceLayerId = 15;
				break;

			case '22':
				mapLayerName = 'graveyard';
				serviceLayerId = 16;
				break;

			case '23':
				mapLayerName = 'winksGurney';
				serviceLayerId = 17;
				break;

			case '24':
				mapLayerName = 'tylerMoore';
				serviceLayerId = 18;
				break;

			case '25':
				mapLayerName = 'potatoUpson59';
				serviceLayerId = 19;
				break;

			case '26':
				mapLayerName = 'tylerFork61';
				serviceLayerId = 20;
				break;

			case '27':
				mapLayerName = 'badMellen';
				serviceLayerId = 21;
				break;

			case '28':
				mapLayerName = 'cityMellen';
				serviceLayerId = 22;
				break;

			case '29':
				mapLayerName = 'potatoGurney10';
				serviceLayerId = 23;
				break;

			case '30':
				mapLayerName = 'potatoGurney00';
				serviceLayerId = 24;
				break;

			case '31':
				mapLayerName = 'potatoUpson80';
				serviceLayerId = 25;
				break;
			
			case '32':
				mapLayerName = 'tylerForks30';
				serviceLayerId = 26;
				break;

			case '33':
				mapLayerName = 'badMorse';
				serviceLayerId = 27;
				break;

			case '34':
				mapLayerName = 'minnowMorse';
				serviceLayerId = 28;
				break;
		}

		updateIdentifyLayerIds(serviceLayerId);
		
		function updateIdentifyLayerIds (serviceLayerId) {
			if (identifyLayersArr.length == 1){
				identifyLayersArr.push(serviceLayerId);
			}else{
				identifyLayersArr[identifyLayersArr.length - 1] = serviceLayerId;
			}
		}

		//if user clicks a new point when the raster is displayed, make sure the raster is hidden before the new point layer appears.
		if(rasterLayer != ""){
			map.getLayer(rasterLayer).hide();
		}
		
		//if another point layer is already visible, hide it first
		if (mapLayerName !== '') {
			if (currentlyVisible !== '' ){
				map.getLayer(currentlyVisible).hide();
				document.getElementById('rasterButton').style.display="none";
				document.getElementById('hideButton').style.display="none";
				document.getElementById('drawButton').style.display="none";
				map.getLayer(mapLayerName).show();
				document.getElementById('legendExplanation').style.visibility="visible";
				document.getElementById('legendExplanation2').style.visibility="visible";
			} 
			map.getLayer(mapLayerName).show();
			currentlyVisible = mapLayerName;
			document.getElementById('rasterButton').style.display="block";
			document.getElementById('hideButton').style.display="block";
			document.getElementById('drawButton').style.display="block";
			document.getElementById('legendExplanation').style.visibility="visible";
			document.getElementById('legendExplanation2').style.visibility="visible";
		
		//if nothing is
		} else {
			if (currentlyVisible !== ''){
				map.getLayer(currentlyVisible).hide();
				document.getElementById('rasterButton').style.display="none";
				document.getElementById('hideButton').style.display="none";
				document.getElementById('drawButton').style.display="none";
				document.getElementById('legendExplanation').style.visibility="hidden";
				document.getElementById('legendExplanation2').style.visibility="hidden";
			}
		}
	}
	//end executeSiteIdentifyTask method
	  
	//Geocoder reference to geocoding services
    locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
	//calls the function that does the goeocoding logic (found in geocoder.js, an associated JS module)*
    dojo.connect(locator, "onAddressToLocationsComplete", showResults);
	
	document.getElementById('rasterButton').innerHTML="Show Uncertainty Layer Surface";
}
//end of init function	

//mapReady function that fires when the first or base layer has been successfully added to the map. Very useful in many situations. called above by this line: dojo.connect(map, "onLoad", mapReady)
function mapReady(map){ 	
	//Sets the globe button on the extent nav tool to reset extent to the initial extent.
	dijit.byId("extentSelector").set("initExtent", map.extent);  
	
	//Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
	//Just uses a simple div with id "latLngScaleBar" to contain it
	var latLngBar = new wim.LatLngScale({map: map}, 'latLngScaleBar');
	
	dojo.style('loadingScreen', 'opacity', '0.75');
	var loadingUpdate = dojo.connect(map,"onUpdateStart",function(){
	dojo.style('loadingScreen', 'visibility', 'visible');
	});
	
	dojo.connect(map,"onUpdateEnd",function(){
		dojo.style('loadingScreen', 'visibility', 'hidden');
		dojo.disconnect(loadingUpdate);
	
		dojo.connect(map, "onUpdateStart",function(){
			dojo.style('refreshScreen', 'visibility', 'visible');
		});
		
		dojo.connect(map, "onUpdateEnd", function(){
			dojo.style('refreshScreen', 'visibility', 'hidden');
		});
	
	});
}

// USGS Logo click handler function
function showUSGSLinks(evt){
	//check to see if there is already an existing linksDiv so that it is not build additional linksDiv. Unlikely to occur since the usgsLinks div is being destroyed on mouseleave.
	if (!dojo.byId('usgsLinks')){
		//create linksDiv
		var linksDiv = dojo.doc.createElement("div");
		linksDiv.id = 'usgsLinks';
		//LINKS BOX HEADER TITLE HERE
		linksDiv.innerHTML = '<div class="usgsLinksHeader"><b>USGS Links</b></div>';
		//USGS LINKS GO HERE
		linksDiv.innerHTML += '<p>';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/">USGS Home</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/ask/">Contact USGS</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://search.usgs.gov/">Search USGS</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/accessibility.html">Accessibility</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/foia/">FOIA</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/privacy.html">Privacy</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/policies_notices.html">Policies and Notices</a></p>';
		
		//place the new div at the click point minus 5px so the mouse cursor is within the div
		linksDiv.style.top =  evt.clientY-5 + 'px';
		linksDiv.style.left = evt.clientX-5 + 'px';
		
		//add the div to the document
		dojo.byId('map').appendChild(linksDiv);
		//on mouse leave, call the removeLinks function
		dojo.connect(dojo.byId("usgsLinks"), "onmouseleave", removeLinks);

	}
}

//remove (destroy) the usgs Links div (called on mouseleave event)
function removeLinks(){
	dojo.destroy('usgsLinks');
}

//button onclick handler function
function hideUncertaintyLayer(){
	//hide point layer or raster depending on what's visible.
	if(map.getLayer(currentlyVisible).visible == true){
		map.getLayer(currentlyVisible).hide();
		//removes last element in the identify array so that uncertainty popups won't accidentally display after the layer has been hidden.
		//CURRENTLY RASTER LAYER HAS NO IDENTIFY SO YOU NEED TO PLACE THIS HERE IN ORDER TO not completely clear the identifyLayers ARR
		identifyLayersArr.pop();
	} else{
		map.getLayer(rasterLayer).hide();
		//reset the raster button label so that it doesn't get reversed
		document.getElementById('rasterButton').innerHTML='Show Uncertainty Layer Surface';
	}
	
	document.getElementById('rasterButton').style.display="none";
	document.getElementById('hideButton').style.display="none";
	document.getElementById('drawButton').style.display="none";
	document.getElementById('legendExplanation').style.visibility="hidden";
	document.getElementById('legendExplanation2').style.visibility="hidden";
	//FUTURE: remove last item from identifyLayers Arr if using that for the raster popup. ......MUST BE ABOVE tb.deactivate();
	//identifyLayersArr.pop();
	tb.deactivate();

}

//onclick handler to toggle between Raster and point layer
function toggleRaster(){
	if (map.getLayer(currentlyVisible).visible == true){
		rasterLayer = currentlyVisible + "Raster";
		//hide the point layer, drawButton, and Addtl explanations
		map.getLayer(currentlyVisible).hide();

		document.getElementById('rasterButton').innerHTML="Show Uncertainty Layer Points";
		document.getElementById('drawButton').style.display="none";
		document.getElementById('legendExplanation').style.visibility="hidden";
		document.getElementById('legendExplanation2').style.visibility="hidden";
		
		//show the raster
		map.getLayer(rasterLayer).show();
		//remove the last layerID but save it in a var so you can add it back on the reverse toggle below
		savedLayerId = identifyLayersArr.pop();
		//identifyLayersArr.pop();
		var test;

	} else{
		map.getLayer(rasterLayer).hide();
		map.getLayer(currentlyVisible).show();
		identifyLayersArr.push(savedLayerId);
		//show the drawButton
		document.getElementById('rasterButton').innerHTML="Show Uncertainty Layer Surface";
		document.getElementById('drawButton').style.display="block";
		document.getElementById('legendExplanation').style.visibility="visible";
		document.getElementById('legendExplanation2').style.visibility="visible";
	}
}

function drawBox(){
	tb = new esri.toolbars.Draw(map);
	tb.activate(esri.toolbars.Draw.EXTENT);
	dojo.connect(tb, "onDrawEnd", function(extent){

		var boxIdentifyTask = new esri.tasks.IdentifyTask("http://wim.usgs.gov/arcgis/rest/services/BadRiverGroundwaterMapper/BadRiverPredictions/MapServer");
		var boxIdentifyParams = new esri.tasks.IdentifyParameters();
		boxIdentifyParams.layerIds = identifyLayersArr;
		boxIdentifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
   	 	boxIdentifyParams.tolerance = 0;
    	boxIdentifyParams.returnGeometry = true;
    	boxIdentifyParams.width  = map.width;
    	boxIdentifyParams.height = map.height;
        boxIdentifyParams.geometry = extent;
        boxIdentifyParams.mapExtent = map.extent;
		boxIdentifyParams.layerIds = [serviceLayerId];
		//deactivates drawing mode after box has been drawn
		tb.deactivate();
       
	    // the deferred variable is set to the parameters defined above and will be used later to build the contents of the infoWindow.
        var deferredResult = identifyTask.execute(boxIdentifyParams);
        deferredResult.addCallback(function(response) {     
            // response is an array of identify result objects    
            var resp = response;
			var predictionOnly = 0;
			for (i = 0; i<resp.length; i++){
				if (resp[i].layerId == 30 && predictionOnly == 0){
					predictionOnly = 1;
					response = [resp[i]];
				} 
			} 
            return dojo.map(response, function(result) {
                var feature = result.feature;
				
                feature.attributes.layerName = result.layerName;
                var predictionLayerID = result.feature.attributes.ID;
				var resultLayerID = result.layerId;

				var template = new esri.InfoTemplate();
				if (resultLayerID == 30){
					map.infoWindow.resize(250,250);
					template = new esri.InfoTemplate("Model Prediction Location",
						"<b>Site Description: </b>${Prediction}</br>"+
						"<b>Prediction Type: </b>${Type}");

					//CONSOLE LOG TESTING
					console.log('UNIQUE ID =' + result.feature.attributes.ID);
					//don't change predictionLayerId unless a prediction layer point is clicked 
					showUncertaintyLayer(predictionLayerID);

				} else {
					map.infoWindow.resize(300,250);
					template = new esri.InfoTemplate("<b>Data Work Analysis</b>",
						"<b>Reduction in Uncertainty relative to base uncertainty:</b></br>${Norm_reduc}</br>"+
						"<b>New Observation Name:</b></br>${newobsname}</br>"+
						"<b>Pre-Calibration Uncertainty with the base dataset:</b></br>${base_unc}</br>"+
						"<b>Post-Calibration Uncertainty with the new observation:</b></br>${pstcal_unc}</br>"+
						"<b>Corresponding Model Prediction Location:</b></br>${Prediction}</br>");
				}
					
				//ties the above defined InfoTemplate to the feature result returned from a click event	
                feature.setInfoTemplate(template);
				//returns the value of feature, which is the result of the click event
                return feature;
				
            });
        });
		
        //sets the content that informs the info window to the previously established "deferredResult" variable.
	    map.infoWindow.setFeatures([ deferredResult ]);
		var ymiddle = (map.extent.ymax - map.extent.ymin)/2 + (map.extent.ymin);
		var drawBoxYminDiff = extent.ymin - ymiddle;
		var infoWindowPoint;
		var drawBoxYmaxDiff = extent.ymax - ymiddle;
		//if box drawn is in the upper corner of the screen, place
		if (Math.abs(drawBoxYmaxDiff) > Math.abs(drawBoxYminDiff)) { // have to take absolute values of these two values
			infoWindowPoint = new esri.geometry.Point(extent.xmax, extent.ymin, map.spatialReference);
		} else {
			console.log('else function')
       		//infoWindowPoint = new esri.geometry.Point(extent.xmax, extent.ymax, map.spatialReference);
		}

		map.infoWindow.show(infoWindowPoint);
    });
}

dojo.ready(init);
//IMPORTANT: while easy to miss, this little line above makes everything work. it fires when the DOM is ready and all dojo.require calls have been resolved. 
//Also when all other JS has been parsed, as it lives here at the bottom of the document. Once all is parsed, the init function is executed*