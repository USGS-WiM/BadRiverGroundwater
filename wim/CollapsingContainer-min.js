// 12.05.12 - ESM - Added wipeIn/Out Animation on icon click
// 11.09.12 - JB - Added collapsing behavior
// 11.06.12 - JB - CollapsingContainer Dijit
/*
	Copyright: 2012 WiM - USGS
	Author: Jon Baier USGS Wisconsin Internet Mapping
	Created: Novemeber 06, 2012	
*/dojo.provide("wim.CollapsingContainer"),dojo.require("dijit._Container"),dojo.require("dijit._TemplatedMixin"),dojo.require("dijit._OnDijitClickMixin"),dojo.require("dijit._WidgetBase"),dojo.require("dojo.fx"),dojo.declare("wim.CollapsingContainer",[dijit._WidgetBase,dijit._OnDijitClickMixin,dijit._Container,dijit._TemplatedMixin],{templatePath:dojo.moduleUrl("wim","templates/CollapsingContainer.html"),baseClass:"collapsingContainer",title:"coolContainer",getContentNode:function(){return this.containerNode},constructor:function(){},_onIconClick:function(){dojo.getStyle("collapsingContainerContent","display")=="none"?dojo.fx.wipeIn({node:"collapsingContainerContent",duration:300}).play():dojo.fx.wipeOut({node:"collapsingContainerContent",duration:300}).play()},postCreate:function(){this.titleNode.innerHTML=this.title;var e=this.title}});