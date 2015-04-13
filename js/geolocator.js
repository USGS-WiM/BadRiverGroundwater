/* 
    Copyright 2012 USGS WiM
*/

/*
    Author: Nick Estes
    Created: October 24, 2012
*/

//Geolocation methods
function showLocation(location) {
    var pt = new esri.geometry.Point(location.coords.longitude, location.coords.latitude, new esri.SpatialReference({
        wkid : 102100
    }));
    /* Geolocation api returns an address but iPhone returns null
        so use reverse geocoding to get address*/

    locator2.locationToAddress(pt, 100, function(candidate) {
        if(candidate.address) {
        var address = candidate.address.Address + "<br/> " + candidate.address.City + ", " + candidate.address.State + " " + candidate.address.Zip;
        //dojo.byId('loc').innerHTML = address;
        var pt = esri.geometry.geographicToWebMercator(candidate.location);
        //dojo.byId('acc').innerHTML = "Location accurate within " + location.coords.accuracy + " meters <br /> Last Updated: " + new Date(location.timestamp).toLocaleString();
        currentLocation = candidate.location;
        //update the current location icon
        if(!currentGraphic) {
            var symbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255, 0, 0]));
            currentGraphic = new esri.Graphic(pt, symbol);
            map.graphics.add(currentGraphic);
            map.centerAndZoom(pt, 16);
        } else {
            currentGraphic.setGeometry(pt);
        }
        //clearProgress();
        }
    }, function(error) {
        //dojo.byId('loc').innerHTML = 'Unable to determine address';
        //clearProgress();
    });
}

//function createProgress(nodeId) {
//    //start the progress indicator
//    var container = dojo.byId(nodeId);
//    container.innerHTML = "";
//    progressIndicator = dojox.mobile.ProgressIndicator.getInstance();
//    container.appendChild(progressIndicator.domNode);
//    progressIndicator.start();
//}

//function clearProgress() {
//    progressIndicator.stop();
//}

function locationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
        alert("Geolocation access denied or disabled. To enable geolocation on your iPhone, go to Settings > General > Location Services");
        //clear the watch if an error occurs
        if(watchProcess != null) {
            navigator.geolocation.clearWatch(watchProcess);
            watchProcess = null;
        }
        break;

        case error.POSITION_UNAVAILABLE:
        alert("Current location not available");
        break;

        case error.TIMEOUT:
        alert("Timeout");
        break;

        default:
        alert("unknown error");
        break;
    }
}
//End geolocation methods