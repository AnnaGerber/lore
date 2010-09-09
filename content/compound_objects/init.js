/*
 * Copyright (C) 2008 - 2010 School of Information Technology and Electrical
 * Engineering, University of Queensland (www.itee.uq.edu.au).
 * 
 * This file is part of LORE. LORE was developed as part of the Aus-e-Lit
 * project.
 * 
 * LORE is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * LORE is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * LORE. If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * @include "/oaiorebuilder/content/constants.js" 
 * @include "/oaiorebuilder/content/uiglobal.js" 
 * @include "/oaiorebuilder/content/debug.js" 
 * @include "/oaiorebuilder/content/compound_objects/loregui.js"
 */

/**
 * Initialise the Extjs UI components and listeners
 */
lore.ore.ui.initUIComponents = function() {
	Ext.Container.prototype.bufferResize = false;
    // make sure popup windows appear above everything else, particularly when over the graphical editor
    Ext.WindowMgr.zseed = 10000;

	try {
        Ext.MessageBox.show({
           msg: 'Loading LORE...',
           width:250,
           defaultTextHeight: 0,
           closable: false,
           cls: 'co-load-msg'
       });
        lore.ore.ui.vp = new lore.ore.ui.Viewport();
		lore.ore.ui.vp.show();
	} catch (e) {
		lore.debug.ore("Error creating Ext UI components from spec", e);
	}

	// set up glocal variable references to main UI components
	lore.ore.ui.grid = Ext.getCmp("remgrid");
	lore.ore.ui.nodegrid = Ext.getCmp("nodegrid");
    lore.ore.ui.relsgrid = Ext.getCmp("relsgrid");
	lore.ore.ui.status = Ext.getCmp("lorestatus");

	/** Tree used to display properties in resource details editor */
	lore.ore.ui.resproptreeroot = new Ext.tree.TreeNode({
				id : "resproptree",
				text : "Properties",
				qtip : "The resource's properties",
				iconCls : "tree-ore"
			});

	/** Tree used to display relationships in resource details editor */
	if (Ext.getCmp("remresedit")) {
		lore.ore.ui.resreltreeroot = new Ext.tree.TreeNode({
					id : "resreltree",
					text : "Relationships",
					qtip : "The resource's relationships",
					iconCls : "tree-ore"
				});
		var resdetailstree = Ext.getCmp("resdetailstree").getRootNode();
		resdetailstree.appendChild(lore.ore.ui.resproptreeroot);
		resdetailstree.appendChild(lore.ore.ui.resreltreeroot);
		lore.ore.ui.resproptreeroot.on("beforeclick", lore.ore.updateResDetails);
		lore.ore.ui.resreltreeroot.on("beforeclick", lore.ore.updateResDetails);
		// load resource details handler
		lore.ore.ui.resselectcombo.on("select", lore.ore.loadResourceDetails); 
	}

    
    var sidetabs = Ext.getCmp("propertytabs");
    // Fix collapsing
    sidetabs.on('beforecollapse', function(p) {
                lore.debug.ore("beforecollapse");
                try {
                    p.body.setStyle('display', 'none');
                } catch (e) {
                    lore.debug.ore("beforecollapse", e);
                }
    });
    sidetabs.on('beforeexpand', function(p){p.body.setStyle('display','block');});
    
    sidetabs.items.each(function(item){
        // force repaint on scroll for the sidetabs to avoid rendering issues if iframe previews are scrolled behind #209
        var tabEl = item.body;
        tabEl.on("scroll",function(e,t,o){this.repaint();},tabEl);
    });
    
    sidetabs.activate("browsePanel");
	Ext.QuickTips.interceptTitles = true;
	Ext.QuickTips.init();
    
    // set up drag and drop from browse/history/search dataviews to graphical editor
    var d1 = new lore.ore.ui.CompoundObjectDragZone(Ext.getCmp('cobview'));
    var d2 = new lore.ore.ui.CompoundObjectDragZone(Ext.getCmp('cohview'));
    var d3 = new lore.ore.ui.CompoundObjectDragZone(Ext.getCmp('cosview'));
};

/**
 * Initialise Compound Objects component of LORE
 */
lore.ore.ui.init = function() {
	try {

        // The overlay
		lore.ore.ui.topView = lore.global.ui.topWindowView.get(window.instanceId);
       
        var currentURL = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
        
		/** Indicates whether the Compound Object UI is visible */	
        lore.ore.controller = new lore.ore.Controller({
            currentURL: currentURL
        });
		lore.global.ui.compoundObjectView.registerView(lore.ore.controller,window.instanceId);
        
        lore.ore.ontologyManager = new lore.ore.model.OntologyManager();
        lore.ore.ui.topView.loadCompoundObjectPrefs(true);
        
        lore.ore.coListManager = new lore.ore.model.CompoundObjectListManager();
        lore.ore.historyManager = new lore.ore.model.HistoryManager(lore.ore.coListManager);
        lore.ore.cache = new lore.ore.model.CompoundObjectCache();    
        
		lore.ore.ui.initUIComponents();
	    lore.ore.ui.graphicalEditor = Ext.getCmp("drawingarea");
        
		lore.ore.ui.vp.info("Welcome to LORE");
        
		lore.ore.controller.createCompoundObject();

        if (lore.ore.ui.topView.compoundObjectsVisible()){
            lore.ore.controller.onShow();
        }

		lore.debug.ui("LORE Compound Object init complete", lore);
        Ext.Msg.hide();
        Ext.getCmp("drawingarea").focus();
        
	} catch (e) {
		lore.debug.ui("Exception in Compound Object init", e);
	}
};
