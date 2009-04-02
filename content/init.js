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

var consoleDebug = false;
var lorevisible;

// Global variables for accessing Ext components
var propertytabs;
var grid;
var aggregrid;
var nodegrid;
var lorestatus;
var loreviews;
var annotationstreeroot;
var remstreeroot;
var welcometab;
var annotationstab;
var annotabsm;
var annotabds;
var annotationsform;
var compoundobjecttab;
var rdftab;
var summarytab;
var smiltab;


// Global variables for graphical view
var oreGraph;
var oreGraphLookup = {};
var oreGraphModified;
var oreGraphCommandListener;
var oreGraphSelectionListener;
var selectedFigure; // last selected figure - updated by SelectionProperties.js
var dummylayoutx;
var dummylayouty;

// Global variables for relationship ontology
var onturl;
var ontrelationships;
var resource_metadata_props = [];
var all_props = METADATA_PROPS;

// repository access URLs
var reposURL; // compound object repository
var reposType; // type of compound object repository (eg sesame)
var annoURL; // annotation server

var annoMarker;
var currentURL;
var loadedURL;
var defaultCreator;
var m_xps; // Instance of hacked Mozdev XPointer service

// Reference to the Extension 
var extension = Components.classes["@mozilla.org/extensions/manager;1"]
		.getService(Components.interfaces.nsIExtensionManager)
		.getInstallLocation(EXTENSION_ID)
		.getItemLocation(EXTENSION_ID);
/**
 * Helper function for setUpMetadataMenu
 * @param {Object} menu
 * @param {Object} gridname
 * @param {Object} propname
 * @param {Object} op
 */
function _make_menu_entry(menu, gridname, propname, op) {
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
/**
 * create menus to add/remove additional metadata properties
 * @param {Object} the_grid The property grid object on which to create the menus
 * @param {Object} gridname The display name of the property grid
 */
function setUpMetadataMenu(the_grid, gridname){
    var addMetadataMenu = new Ext.menu.Menu({
        id: gridname + "-add-metadata-menu"
    });
    var remMetadataMenu = new Ext.menu.Menu({
        id: gridname + "-rem-metadata-menu"
    });
    for (var i = 0; i < METADATA_PROPS.length; i++) {
        _make_menu_entry(addMetadataMenu, gridname, METADATA_PROPS[i], "add");
        _make_menu_entry(remMetadataMenu, gridname, METADATA_PROPS[i], "rem");
    }
    if (gridname == "nodegrid") {
        for (var i = 0; i < resource_metadata_props.length; i++) {
            _make_menu_entry(addMetadataMenu, gridname, resource_metadata_props[i], "add");
            _make_menu_entry(remMetadataMenu, gridname, resource_metadata_props[i], "rem");
        }
    } 
    var tbar = the_grid.getTopToolbar();
    var addbtn = tbar[0];
    var rembtn = tbar[1];
    if (addbtn) {
        addbtn.menu = addMetadataMenu;
    }
    if (rembtn) {
        rembtn.menu = remMetadataMenu;
    }
}

/**
 * Initialise the graphical view
 */
function initGraphicalView(){
	oreGraphLookup = {};
	oreGraphModified = false;
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
	dummylayoutx = NODE_SPACING;
	dummylayouty = NODE_SPACING;	
}
/**
 * Load domain ontology
 */
function initOntologies(){
	ontrelationships = {};
	window.parent.oaiorebuilder.loadPrefs();
	loadRelationshipsFromOntology();
}
/**
 * Initialise property grids and set up listeners
 */
function initProperties(){
	var today = new Date();
	grid.setSource({
		"rdf:about" : "http://example.org/rem",
		"ore:describes" : "#aggregation",
		"dc:creator" : "",
		"dcterms:modified" : today,
		"dcterms:created" : today,
		"rdf:type" : RESOURCE_MAP
	});
	nodegrid.on("propertychange", handleNodePropertyChange);
	
	grid.on("beforeedit",function(e){
		//don't allow these fields to be edited
		if(e.record.id == "ore:describes" || e.record.id == "rdf:type"){
			e.cancel = true;
		}
	});
	nodegrid.on("beforeedit", function(e){
		// don't allow format field to be edited
		if (e.record.id == "dc:format"){
			e.cancel = true;
		}
	});

	setUpMetadataMenu(grid, "grid"); 
	setUpMetadataMenu(nodegrid,"nodegrid");
	propertytabs.activate("remgrid");	           					    
}
/**
 * Initialise the Extjs UI components and listeners
 */
function initExtComponents(){
	// set up glocal variable references to main UI components
	propertytabs = Ext.getCmp("propertytabs");
	grid = Ext.getCmp("remgrid");
	nodegrid = Ext.getCmp('nodegrid');
	lorestatus = Ext.getCmp('lorestatus');
	rdftab = Ext.getCmp("remrdfview");
	annotationstab = Ext.getCmp("annotationslist");
	annotabsm = annotationstab.getSelectionModel();
	annotabds = annotationstab.getStore();
	annotationsform = Ext.getCmp("annotationslistform").getForm();
	loreviews = Ext.getCmp("loreviews");
	welcometab = Ext.getCmp("welcome");
	summarytab = Ext.getCmp("remlistview");
	smiltab = Ext.getCmp("remsmilview");
	compoundobjecttab = Ext.getCmp("compoundobjecteditor");
	
	// set up the sources tree
	var sourcestreeroot = Ext.getCmp("sourcestree").getRootNode();
	_clearTree(sourcestreeroot);
	annotationstreeroot = new Ext.tree.TreeNode({
		id: "annotationstree",
		text: "Annotations",
		draggable: false,
		iconCls: "tree-anno"
	});
	remstreeroot = new Ext.tree.TreeNode({
		id: "remstree",
		text: "Compound Objects",
		draggable: false,
		iconCls: "tree-ore"
	});
	recenttreeroot = new Ext.tree.TreeNode({
		id: "recenttree",
		text: "Recently opened",
		draggable: false,
		iconCls: "tree-ore"
	});
	sourcestreeroot.appendChild(annotationstreeroot);
	sourcestreeroot.appendChild(remstreeroot);
	sourcestreeroot.appendChild(recenttreeroot);
	
	// set up event handlers
	rdftab.on("activate", showRDFHTML);
	summarytab.on("activate", showCompoundObjectSummary);
	smiltab.on("activate",showSMIL);
	
	annotabsm.on('rowdeselect', handleAnnotationDeselection);
	annotabsm.on('rowselect', handleAnnotationSelection);
	
	Ext.getCmp("cancelupdbtn").on('click', handleCancelAnnotationEdit);
	Ext.getCmp("updannobtn").on('click', handleSaveAnnotationChanges);
	Ext.getCmp("delannobtn").on('click', handleDeleteAnnotation);
	Ext.getCmp("updctxtbtn").on('click', handleUpdateAnnotationContext);
	Ext.getCmp("updrctxtbtn").on('click', handleUpdateAnnotationRevisedContext);
	
	Ext.getCmp("revisedfield").on('specialkey',launchFieldWindow);
	Ext.getCmp("originalfield").on('specialkey',launchFieldWindow);
	
	Ext.getCmp("typecombo").on('valid', handleAnnotationTypeChange);
	setRevisionFormUI(false);
		
	// set up revisions panel
	var revisionsPanel = Ext.getCmp("revisionannotations");
  	revisionsPanel.on("render", onRevisionsShow);
  	revisionsPanel.on("show", onRevisionsShow);
  	revisionsPanel.on("resize", onRevisionsShow);    
	var revisionsListing = Ext.getCmp("revisionannotationlisting");
	revisionsListing.on("rowclick", onRevisionListingClick);
    onRevisionsShow(revisionsPanel);
	//setRevisionFrameURLs ("http://www.austlit.edu.au/common/loredemo/",
	// "http://www.austlit.edu.au/common/loredemo/");
	
	// set up welcome tab contents
	welcometab.body.update("<h1>LORE: Literature Object Re-use and Exchange</h1>" 
		+ "<p>For more information about LORE, please see the "
		+ "<a target='_blank' href='http://www.itee.uq.edu.au/~eresearch/projects/aus-e-lit/'>"
		+ "Aus-e-Lit</a> project page</p>");
}
/**
 * Initialise LORE
 */
function init(){
	
	m_xps = new XPointerService();  
	currentURL = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
	 
	if (window.parent.document.getElementById('oobContentBox')
								.getAttribute("collapsed") == "true") {
		lorevisible = false;
	} else {
		lorevisible = true;
	}
	initExtComponents();
	initProperties();
	initOntologies();
	initGraphicalView();
	loreInfo("Welcome to LORE");
	if(currentURL && currentURL != 'about:blank' 
		&& currentURL != '' && lorevisible){
		updateSourceLists(currentURL);
	}
}

Ext.EventManager.onDocumentReady(init);


