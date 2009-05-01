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

// Reference to the Extension 
lore.ui.extension = Components.classes["@mozilla.org/extensions/manager;1"]
		.getService(Components.interfaces.nsIExtensionManager)
		.getInstallLocation(lore.constants.EXTENSION_ID)
		.getItemLocation(lore.constants.EXTENSION_ID);


/**
 * Helper function for setUpMetadataMenu
 * @param {Object} menu
 * @param {Object} gridname
 * @param {Object} propname
 * @param {Object} op
 */
lore.ui._make_menu_entry = function(menu, gridname, propname, op) {
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
lore.ui.setUpMetadataMenu = function(the_grid, gridname){
    var addMetadataMenu = new Ext.menu.Menu({
        id: gridname + "-add-metadata-menu"
    });
    var remMetadataMenu = new Ext.menu.Menu({
        id: gridname + "-rem-metadata-menu"
    });
    for (var i = 0; i < lore.ore.METADATA_PROPS.length; i++) {
        lore.ui._make_menu_entry(addMetadataMenu, gridname, lore.ore.METADATA_PROPS[i], "add");
        lore.ui._make_menu_entry(remMetadataMenu, gridname, lore.ore.METADATA_PROPS[i], "rem");
    }
    if (gridname == "lore.ui.nodegrid") {
        for (var i = 0; i < lore.resource_metadata_props.length; i++) {
            lore.ui._make_menu_entry(addMetadataMenu, gridname, lore.resource_metadata_props[i], "add");
            lore.ui._make_menu_entry(remMetadataMenu, gridname, lore.resource_metadata_props[i], "rem");
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
lore.ui.initGraphicalView = function () {
	lore.ui.compoundobjecttab.activate("drawingarea");	
	lore.ore.graph.lookup = {};
	lore.ore.graph.modified = false;
	if (lore.ore.graph.Graph){
		lore.ore.graph.Graph.getCommandStack().removeCommandStackEventListener(lore.ore.graph.gCommandListener);
		lore.ore.graph.Graph.removeSelectionListener(lore.ore.graph.gSelectionListener);
		lore.ore.graph.Graph.clear();
	} else {
		lore.ore.graph.Graph = new draw2d.Workflow("drawingarea");
		lore.ore.graph.Graph.scrollArea = document.getElementById("drawingarea");
	}
	lore.ore.graph.gSelectionListener = new lore.ore.graph.SelectionProperties(lore.ore.graph.Graph);
	lore.ore.graph.Graph.addSelectionListener(lore.ore.graph.gSelectionListener);
	lore.ore.graph.gCommandListener = new lore.ore.graph.CommandListener();
	lore.ore.graph.Graph.getCommandStack().addCommandStackEventListener(lore.ore.graph.gCommandListener);
	lore.ore.graph.selectedFigure = null; // last selected figure - updated by SelectionProperties.js
	lore.ore.graph.dummylayoutx = lore.ore.NODE_SPACING;
	lore.ore.graph.dummylayouty = lore.ore.NODE_SPACING;

}
/**
 * Load domain ontology
 */
lore.ui.initOntologies = function (){
	lore.ore.ontrelationships = {};
	window.parent.oaiorebuilder.loadPrefs();
	lore.ore.loadRelationshipsFromOntology();
}
/**
 * Initialise property grids and set up listeners
 */
lore.ui.initProperties = function (){
	var today = new Date();
	lore.ui.grid.setSource({
		"rdf:about" : "http://example.org/rem",
		"ore:describes" : "#aggregation",
		"dc:creator" : "",
		"dcterms:modified" : today,
		"dcterms:created" : today,
		"rdf:type" : lore.constants.RESOURCE_MAP
	});
	lore.ui.nodegrid.on("propertychange", lore.ore.handleNodePropertyChange);
	
	lore.ui.grid.on("beforeedit",function(e){
		//don't allow these fields to be edited
		if(e.record.id == "ore:describes" || e.record.id == "rdf:type"){
			e.cancel = true;
		}
	});
	lore.ui.nodegrid.on("beforeedit", function(e){
		// don't allow format field to be edited
		if (e.record.id == "dc:format"){
			e.cancel = true;
		}
	});

	lore.ui.setUpMetadataMenu(lore.ui.grid, "lore.ui.grid"); 
	lore.ui.setUpMetadataMenu(lore.ui.nodegrid,"lore.ui.nodegrid");
	lore.ui.propertytabs.activate("remgrid");	           					    
}
/**
 * Initialise the Extjs UI components and listeners
 */
lore.ui.initExtComponents = function (){
	// set up glocal variable references to main UI components
	lore.ui.propertytabs = Ext.getCmp("propertytabs");
	lore.ui.grid = Ext.getCmp("remgrid");
	lore.ui.nodegrid = Ext.getCmp('nodegrid');
	lore.ui.lorestatus = Ext.getCmp('lorestatus');
	lore.ui.rdftab = Ext.getCmp("remrdfview");
	lore.anno.annotabsm = Ext.getCmp("annotationslist").getSelectionModel();
	lore.anno.annotabds = Ext.getCmp("annotationslist").getStore();
	lore.ui.annotationsform = Ext.getCmp("annotationslistform").getForm();
	lore.ui.loreviews = Ext.getCmp("loreviews");
	lore.ui.welcometab = Ext.getCmp("welcome");
	lore.ui.summarytab = Ext.getCmp("remlistview");
	lore.ui.smiltab = Ext.getCmp("remsmilview");
	lore.ui.compoundobjecttab = Ext.getCmp("compoundobjecteditor");
	lore.ui.textminingtab = Ext.getCmp("textmining");
	// set up the sources tree
	var sourcestreeroot = Ext.getCmp("sourcestree").getRootNode();
	lore.ui._clearTree(sourcestreeroot);
	lore.ui.annotationstreeroot = new Ext.tree.TreeNode({
		id: "annotationstree",
		text: "Annotations",
		draggable: false,
		iconCls: "tree-anno"
	});
	lore.ui.remstreeroot = new Ext.tree.TreeNode({
		id: "remstree",
		text: "Compound Objects",
		draggable: false,
		iconCls: "tree-ore"
	});
	lore.ui.recenttreeroot = new Ext.tree.TreeNode({
		id: "recenttree",
		text: "Recently opened",
		draggable: false,
		iconCls: "tree-ore"
	});
	sourcestreeroot.appendChild(lore.ui.annotationstreeroot);
	sourcestreeroot.appendChild(lore.ui.remstreeroot);
	sourcestreeroot.appendChild(lore.ui.recenttreeroot);
	
	// set up event handlers
	if (lore.ui.rdftab) {
		lore.ui.rdftab.on("activate", lore.ore.updateRDFHTML);
	}
	lore.ui.compoundobjecttab.on("beforeremove", lore.ore.closeRDFView);
	// create a context menu for the compound object tab to hide/show RDF/XML Tab
	lore.ui.compoundobjecttab.contextmenu = new Ext.menu.Menu({
		  id : "co-context-menu"
	});
	lore.ui.compoundobjecttab.contextmenu.add({
			text : "Show RDF/XML",
			handler : lore.ore.openRDFView
	});
	lore.ui.loreviews.on("contextmenu", function (tabpanel, panel, e){
		if (panel.id == 'compoundobjecteditor') {
			lore.ui.compoundobjecttab.contextmenu.showAt(e.xy);
		}
	});
	
	lore.ui.summarytab.on("activate", lore.ore.showCompoundObjectSummary);
	lore.ui.smiltab.on("activate",lore.ore.showSMIL);
	
	lore.anno.annotabsm.on('rowdeselect', lore.anno.handleAnnotationDeselection);
	lore.anno.annotabsm.on('rowselect', lore.anno.handleAnnotationSelection);
	
	Ext.getCmp("cancelupdbtn").on('click', lore.anno.handleCancelAnnotationEdit);
	Ext.getCmp("updannobtn").on('click', lore.anno.handleSaveAnnotationChanges);
	Ext.getCmp("delannobtn").on('click', lore.anno.handleDeleteAnnotation);
	Ext.getCmp("updctxtbtn").on('click', lore.anno.handleUpdateAnnotationContext);
	Ext.getCmp("updrctxtbtn").on('click', lore.anno.handleUpdateAnnotationVariantContext);
	
	Ext.getCmp("variantfield").on('specialkey',lore.anno.launchFieldWindow);
	Ext.getCmp("originalfield").on('specialkey',lore.anno.launchFieldWindow);
	
	Ext.getCmp("typecombo").on('valid', lore.anno.handleAnnotationTypeChange);
	lore.anno.setAnnotationFormUI(false);
		
	// set up variation annotations panel
	var variationsPanel = Ext.getCmp("variationannotations");
  	variationsPanel.on("render", lore.anno.onVariationsShow);
  	variationsPanel.on("show", lore.anno.onVariationsShow);
  	variationsPanel.on("resize", lore.anno.onVariationsShow);    
	var variationsListing = Ext.getCmp("variationannotationlisting");
	variationsListing.on("rowclick", lore.anno.onVariationListingClick);
    lore.anno.onVariationsShow(variationsPanel);
	
	// set up welcome tab contents
	lore.ui.welcometab.body.update("<iframe height='100%' width='100%' src='chrome://oaiorebuilder/content/welcome.html'></iframe>");
}

/**
 * Create a Timeline visualisation
 */
lore.ui.initTimeline = function (){
	var tl = Ext.getCmp("annotimeline");
	if (typeof Timeline !== "undefined") {
		lore.anno.annoEventSource = new Timeline.DefaultEventSource();
		var bandConfig = [Timeline.createBandInfo({
			eventSource: lore.anno.annoEventSource,
			width: "80%",
			intervalUnit: Timeline.DateTime.MONTH,
			intervalPixels: 100,
			timeZone: 10
		}), Timeline.createBandInfo({
			eventSource: lore.anno.annoEventSource,
			width: "20%",
			intervalUnit: Timeline.DateTime.YEAR,
			intervalPixels: 200,
			timeZone: 10
		})];
		bandConfig[1].syncWith = 0;
        bandConfig[1].highlight = true;
		lore.anno.annotimeline = Timeline.create(document.getElementById("annotimeline"), bandConfig);
		tl.on("resize", function(){lore.anno.annotimeline.layout();});
		
	}
	
}

/**
 * Initialise LORE
 */
lore.ui.init = function (){
	

	lore.m_xps = new XPointerService();
	lore.ui.currentURL = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
	lore.resource_metadata_props = [];
	lore.all_props = lore.ore.METADATA_PROPS;
	if (window.parent.document.getElementById('oobContentBox')
								.getAttribute("collapsed") == "true") {
		lore.ui.lorevisible = false;
	} else {
		lore.ui.lorevisible = true;
	}
	lore.ui.initExtComponents();
	lore.ui.initProperties();
	lore.ui.initOntologies();
	lore.ui.initTimeline();
	lore.ui.initGraphicalView();
	
	lore.ui.loreInfo("Welcome to LORE");
	if(lore.ui.currentURL && lore.ui.currentURL != 'about:blank' 
		&& lore.ui.currentURL != '' && lore.ui.lorevisible){
		lore.ui.updateSourceLists(lore.ui.currentURL);
	}
	lore.debug.ui("LORE init complete", this); 
}

Ext.EventManager.onDocumentReady(lore.ui.init);


