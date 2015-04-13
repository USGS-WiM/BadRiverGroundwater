/* 
	Copyright 2011 USGS WiM
*/
	
/*
	Author: Jonathan Baier
	Created: December 14, 2011	
*/


	   //Add Geocoder
	  locator = new esri.tasks.Locator("http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Address_NA_10/GeocodeServer");		
      dojo.connect(locator, "onAddressToLocationsComplete", showResults);
		
	  function enterKeyLocate (e) {
		  var keynum;
		  
		  if(window.event) // IE
		  {
			  keynum = e.keyCode;
		  } 
		  else if(e.which) // Netscape/Firefox/Opera
		  {
			  keynum = e.which;
		  }
		  
		  if (keynum == 13) {
			  locate()
		  }
	  }
	  
	  function locate() {
        map.graphics.clear();
        var address = {"SingleLine":dojo.byId("geocode").value};
        locator.outSpatialReference= map.spatialReference;
        locator.addressToLocations(address,["Loc_name"]);
      }

      function showResults(candidates) {
        var candidate;
        var symbol = new esri.symbol.SimpleMarkerSymbol();
        var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");

        symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE);
        symbol.setColor(new dojo.Color([153,0,51,0.75]));

        var geom;
       
        dojo.every(candidates,function(candidate){
          if (candidate.score > 80) {
            var attributes = { address: candidate.address, score:candidate.score, locatorName:candidate.attributes.Loc_name };  
            geom = candidate.location;
            var graphic = new esri.Graphic(geom, symbol, attributes, infoTemplate);
            //add a graphic to the map at the geocoded location
            map.graphics.add(graphic);
                       
            return false; //break out of loop after one candidate with score greater  than 80 is found.
          }
        });
        if(geom !== undefined){
          map.centerAndZoom(geom,12);
        }

      }