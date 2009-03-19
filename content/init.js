/*
 * Copyright (C) 2008 - 2009 School of Information Technology and Electrical
 * Engineering, University of Queensland (www.itee.uq.edu.au).
 *  
 * This file is part of LORE. LORE was developed as part of the Aus-e-Lit project.
 *
 * LORE is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LORE is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LORE.  If not, see <http://www.gnu.org/licenses/>.
 */
 
// Global variables for accessing Ext components
var propertytabs = Ext.getCmp("propertytabs");
var grid = Ext.getCmp("remgrid");
var aggregrid = Ext.getCmp('aggregrid');
var nodegrid = Ext.getCmp('nodegrid');
var lorestatus = Ext.getCmp('lorestatus');
var rdftab = Ext.getCmp("remrdfview");
rdftab.on("activate", showRDFHTML);
var loreviews = Ext.getCmp("loreviews");
var sourcestreeroot = Ext.getCmp("sourcestree").getRootNode();
var annotationstreeroot = new Ext.tree.TreeNode({
	id: "annotationstree",
	text: 'Annotations',
	draggable: false,
	iconCls: "tree-anno"
});
var remstreeroot = new Ext.tree.TreeNode({
	id: "remstree",
	text: 'Compound Objects',
	draggable: false,
	iconCls: "tree-ore"
});
sourcestreeroot.appendChild(annotationstreeroot);
sourcestreeroot.appendChild(remstreeroot);
// Global variables for graphical view
var oreGraph;
var oreGraphLookup = {};
var oreGraphCommandListener;
var oreGraphSelectionListener;
var selectedFigure; // last selected figure - updated by SelectionProperties.js
var dummylayoutx = 50;
var dummylayouty = 50;
var nodewidth = 220;
var nodeheight = 170;
var nodespacing = 40;
var maxx = 400;

// Global variables for relationship ontology
var onturl;
var ontrelationships;

// repository access URLs
var reposURL; // compound object repository
var reposType; // type of compound object repository (eg sesame)
var annoURL; // annotation server

// properties that can be applied to aggregations, resource maps or aggregated
// resources
var metadata_props = ["dcterms:abstract", "dcterms:audience", "dc:creator",
		"dcterms:created", "dc:contributor", "dc:coverage", "dc:description",
		"dc:format", "dcterms:hasFormat", "dc:identifier", "dc:language",
		"dcterms:modified", "dc:publisher", "dc:rights", "dc:source",
		"dc:subject", "dc:title"];	
// properties that only make sense for aggregations
var aggre_metadata_props = ["ore:similarTo", "ore:isDescribedBy",
		"dcterms:references", "dcterms:replaces", "foaf:logo"];
// properties for aggregated resources (also populated from relationship
// ontology)
var resource_metadata_props = ["rdf:type", "ore:isAggregatedBy"];
var all_props = metadata_props.concat(aggre_metadata_props)
		.concat(resource_metadata_props);

var namespaces = {
	"dc" : "http://purl.org/dc/elements/1.1/",
	"dcterms" : "http://purl.org/dc/terms/",
	"ore" : "http://www.openarchives.org/ore/terms/",
	"foaf" : "http://xmlns.com/foaf/0.1/",
	"layout" : "http://maenad.itee.uq.edu.au/lore/layout.owl#"
};

function _make_menu_entry(menu, gridname, propname, op) {
	// helper function for setUpMetadataMenu
	var funcstr = "";
	funcstr += "var props = " + gridname + ".getSource();";
	if (op == "add") {
		funcstr += "if (props && !props[\"" + propname + "\"]){";
		funcstr += "props[\"" + propname + "\"] = \"\";";
	} else {
		funcstr += "if (props && typeof props[\"" + propname
				+ "\"] != \"undefined\"){";
		funcstr += "delete props[\"" + propname + "\"];";
	}
	funcstr += gridname + ".setSource(props);}";
	menu.add({
				id : menu.id + "-" + op + "-" + propname,
				text : propname,
				handler : new Function(funcstr)
			});
}
function setUpMetadataMenu(the_grid, gridname) {
	// create context menu to add/remove additional metadata properties
	var addMetadataMenu = new Ext.menu.Menu({
				id : gridname + "-add-metadata-menu"
			});
	var remMetadataMenu = new Ext.menu.Menu({
				id : gridname + "-rem-metadata-menu"
			});
	for (var i = 0; i < metadata_props.length; i++) {
		_make_menu_entry(addMetadataMenu, gridname, metadata_props[i], "add");
		_make_menu_entry(remMetadataMenu, gridname, metadata_props[i], "rem");
	}
	if (gridname == "aggregrid") {
		for (var i = 0; i < aggre_metadata_props.length; i++) {
			_make_menu_entry(addMetadataMenu, gridname,
					aggre_metadata_props[i], "add");
			_make_menu_entry(remMetadataMenu, gridname,
					aggre_metadata_props[i], "rem");
		}
	}

	if (gridname == "nodegrid") {
		for (var i = 0; i < resource_metadata_props.length; i++) {
			_make_menu_entry(addMetadataMenu, gridname,
					resource_metadata_props[i], "add");
			_make_menu_entry(remMetadataMenu, gridname,
					resource_metadata_props[i], "rem");
		}
	}
	the_grid.getView().hmenu.add({
				id : gridname + "-add-metadata",
				text : "Add metadata",
				menu : addMetadataMenu
			});
	the_grid.getView().hmenu.add({
				id : gridname + "-rem-metadata",
				text : "Remove metadata",
				menu : remMetadataMenu
			});

}

function initOntologies(){
	/* Load domain ontology */
	ontrelationships = {};
	window.parent.oaiorebuilder.loadPrefs();
	loadRelationshipsFromOntology();
}

function initProperties(){
	// Initialise ORE properties
	var today = new Date();
	grid.setSource({
			"rdf:about" : "http://example.org/rem",
			"ore:describes" : "#aggregation",
			"dc:creator" : "",
			"dcterms:modified" : today,
			"dcterms:created" : today,
			"rdf:type" : "http://www.openarchives.org/ore/terms/ResourceMap"
	});
	aggregrid.setSource({
			"rdf:type" : "http://www.openarchives.org/ore/terms/Aggregation"
	});
}
/**
 * Initialise the graphical view
 */
function initGraphicalView(){
	oreGraphLookup = {};
	if (oreGraph){
		oreGraph.getCommandStack().removeCommandStackEventListener(oreGraphCommandListener);
		oreGraph.removeSelectionListener(oreGraphSelectionListener);
		oreGraph.clear();
	} else {
		oreGraph = new draw2d.Workflow("drawingarea");
		oreGraph.scrollArea = document.getElementById("drawingarea").parentNode;
	}
	oreGraphSelectionListener = new oaiorebuilder.SelectionProperties(oreGraph);
	oreGraph.addSelectionListener(oreGraphSelectionListener);
	oreGraphCommandListener = new oaiorebuilder.CommandListener();
	oreGraph.getCommandStack().addCommandStackEventListener(oreGraphCommandListener);
	selectedFigure = null;
	dummylayoutx = 50;
	dummylayouty = 50;	
}

initProperties();
initOntologies();
initGraphicalView();

setUpMetadataMenu(grid, "grid"); 
setUpMetadataMenu(aggregrid, "aggregrid");
setUpMetadataMenu(nodegrid,"nodegrid");
 
nodegrid.on("propertychange", function(source, recid, newval, oldval) {
	// var the_fig = lookupFigure(source["Resource"]);
	if (recid == 'Resource') {
		// the URL of the resource has changed
		if (newval && newval != '') {
			theval = newval
		} else
			theval = "about:blank";
		if (oreGraphLookup[theval]) {
			loreWarning("Cannot change resource URL: a node already exists for " + theval);
			// TODO: don't update values in this case
		} else {
			oreGraphLookup[theval] = selectedFigure.getId();
		}
		delete oreGraphLookup[oldval];
	}
	selectedFigure.updateMetadata(source);
});
loreInfo("Welcome to LORE");

/*
var dragsource = new Ext.dd.DragSource("dragNode", {
			ddGroup : 'TreeDD',
			dragData : {
				name : "resourceNode"
			}
		});
var droptarget = new Ext.dd.DropTarget("graph", {
			ddGroup : 'TreeDD'
		});
droptarget.notifyDrop = function(dd, e, data) {
	if (data.name) {
		var xOffset = oreGraph.getAbsoluteX();
		var yOffset = oreGraph.getAbsoluteY();
		var scrollLeft = oreGraph.getScrollLeft();
		var scrollTop = oreGraph.getScrollTop();
		var theURL = document.getElementById("gotourl").value;
		if (theURL != '') {
			addFigureXY(theURL, e.xy[0] - xOffset + scrollLeft, e.xy[1]
							- yOffset + scrollTop);
		}
	}
	return true;
}
*/
