// 12.05.12 - ESM - Added wipeIn/Out Animation on icon click
// 11.09.12 - JB - Added collapsing behavior
// 11.06.12 - JB - CollapsingContainer Dijit

/*
	Copyright: 2012 WiM - USGS
	Author: Jon Baier USGS Wisconsin Internet Mapping
	Created: Novemeber 06, 2012	
*/
dojo.provide("wim.CollapsingContainer");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._OnDijitClickMixin");
dojo.require("dijit._WidgetBase");
dojo.require("dojo.fx");


dojo.declare("wim.CollapsingContainer", [ dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin ],
{
	templatePath: dojo.moduleUrl("wim","templates/CollapsingContainer.html"),
	
	/* Define your component custom attributes here ... */
	baseClass: "collapsingContainer",
	title: "coolContainer",
	titleImageUrl: null,
	
	getContentNode: function() {
		return this.containerNode;
	},
	
	constructor: function() {
		//add here anything that will be executed in the widget initialization.
	},	
		
		
	//new iconClick handler
	_onIconClick: function() {
		if (dojo.getStyle(this.containerNode, "display") == "none") {
			dojo.fx.wipeIn({ node: this.containerNode, duration: 300}).play(); //Animate show content
			
		} else {
			  dojo.fx.wipeOut({node: this.containerNode, duration: 300}).play(); // Animate hide content
			  
		}
	},	
	
	
	//	OLD an onClick handler
	/*_onIconClick: function(){
		if (dojo.getStyle("collapsingContainerContent", "display") == "none") {
			  dojo.setStyle("collapsingContainerContent", "display", "block"); // Show content			
		} else {
			  dojo.setStyle("collapsingContainerContent", "display", "none"); // Hide content
		}
	},*/

	postCreate: function(){
		this.titleNode.innerHTML = this.title;
	
		// add here anything that will be executed in after the DOM is loaded and ready.
		// For example, adding events on the dojo attach points is suitable here.	
		var localTitle = this.title;
				
		// Attach an onclick event on the user name node.		
		/*dojo.connect(this.nameNode, "onclick", function (event) {
			alert("The selected name is: " + localTitle);
		});	*/
		
		if (this.titleImageUrl != null) {
			//Do something here to handle unique images to put before titles
		}
	}
	
});