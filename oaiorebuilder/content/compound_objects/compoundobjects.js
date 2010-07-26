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
 * @include  "init.js"
 * @include  "../util.js"
 */

/**
 * @singleton
 * @class lore.ore
 */
 
/** Maximum level of nesting that the views will show (limited for performance reasons) */
lore.ore.MAX_NESTING      = 2;

/** Property name displayed for the compound object identifier */
lore.ore.REM_ID_PROP = "Compound Object ID";

lore.ore.disableUIFeatures = function(opts) {
    lore.debug.ui("LORE Compound Objects: disable ui features?", opts);
    lore.ore.ui.disabled = opts;
    
    if (!lore.ore.disableUIFeatures.initialCall) {
        lore.ore.disableUIFeatures.initialCall = 1;
    }
    else {
        if (opts.disable_compoundobjects) {
            lore.ore.ui.topView.setCompoundObjectsVisibility(false);
        }
        else {
            lore.ore.ui.topView.setCompoundObjectsVisibility(true);
        }
    }
}
/** Display an error message in the ORE statusbar 
 * @param {String} message The message to display */
lore.ore.ui.loreError = function(/*String*/message){
    var statusopts = {
            'text': message,
            'iconCls': 'error-icon',
            'clear': {
                'wait': 3000
            }
    };
    lore.ore.ui.status.setStatus(statusopts);
    lore.global.ui.loreError(message);
};
/**
 * Display an information message in the ORE statusbar
 * @param {String} message The message to display
 */
lore.ore.ui.loreInfo = function(/*String*/message) {
    var statusopts = {
                'text': message,
                'iconCls': 'info-icon',
                'clear': {
                    'wait': 3000
                }
    };
    lore.ore.ui.status.setStatus(statusopts);
    lore.global.ui.loreInfo(message);
};
/**
 * Display a warning message in the ORE statusbar
 * @param {String} message The message to display
 */
lore.ore.ui.loreWarning = function(/*String*/message){
    var statusopts = {
        'text': message,
        'iconCls': 'warning-icon',
        'clear': {
            'wait': 3000
        }
    };
    lore.ore.ui.status.setStatus(statusopts);
    lore.global.ui.loreWarning(message);
};
lore.ore.ui.loreProgress = function(message){
    var statusopts = {
        'text': message,
        'iconCls': 'loading-icon',
        'clear': false
    };
    lore.ore.ui.status.setStatus(statusopts);
    lore.global.ui.loreWarning(message);
};
lore.ore.setPrefs = function(prefs){
  try{ 
	  lore.ore.setDcCreator(prefs.creator);
	  lore.ore.setOntology(prefs.relonturl);
	  lore.ore.setRepos(prefs.rdfrepos, prefs.rdfrepostype, prefs.annoserver);
  } catch (e){
    lore.debug.ore("Unable to set repos prefs",e);
  }
  try{
    lore.ore.setTextMiningKey(prefs.tmkey);
  } catch (e){
    lore.debug.ore("Unable to set text mining pref",e);
  }
  try {
    lore.ore.disableUIFeatures({
        'disable_compoundobjects': prefs.disable
    });  
    lore.global.util.setHighContrast(window, prefs.high_contrast);
  } catch (e){
    lore.debug.ore("Unable to set UI prefs",e);
  }
};
/**
 * Set the DC Creator for the resource map
 * @param {String} creator
 */	
lore.ore.setDcCreator = function(creator){
    /** The name of the default creator used for dc:creator for annotations and compound objects */
    lore.defaultCreator = creator;
};
/**
 * Set the Text mining key
 * @param {String} tmkey
 */
lore.ore.setTextMiningKey = function (tmkey){
    lore.ore.textm.tmkey = tmkey;
}
/**
 * Set the global variable storing the relationship ontology
 * 
 * @param {}
 *            relonturl The new locator for the ontology
 */
lore.ore.setOntology = function(onturl) {
    var om = lore.ore.ontologyManager;
    if (om){
        om.loadOntology(onturl);
    } 
};
/**
 * Set the global variables for the repository access URLs
 *
 * @param {} rdfrepos The repository access URL
 * @param {}rdfrepostype The type of the repository (eg sesame, fedora)
 * @param {}annoserver The annotation server access URL
 */
lore.ore.setRepos = function(/*String*/rdfrepos, /*String*/rdfrepostype, /*String*/annoserver){
    lore.debug.ore("lore.ore.setRepos " + rdfrepos + " " + rdfrepostype + " " + annoserver);
    /** The access URL of the annotation server */
    lore.ore.annoServer = annoserver;
    
    if (lore.ore.reposAdapter && lore.ore.reposAdapter.reposURL == rdfrepos) {
        // same access url, use existing adapter
        return;
    }    
    // check whether currently loaded compound object is from different repos
    var isEmpty = lore.ore.cache && lore.global.util.isEmptyObject(lore.ore.cache.getLoadedCompoundObject().getInitialContent());
    // at this point the repos adaptor still contains the old value
    var diffReposToEditor = lore.ore.reposAdapter && lore.ore.cache && lore.ore.cache.getLoadedCompoundObjectUri().match(lore.ore.reposAdapter.idPrefix);
    var title = "";
    var currentCOMsg = Ext.getCmp('currentCOMsg');
    if (lore.ore.ui.grid){
        title = lore.ore.getPropertyValue("dc:title",lore.ore.ui.grid) ||
            lore.ore.getPropertyValue("dcterms:title",lore.ore.ui.grid);
        if (!title){
            title = "Untitled";
        }
    }
    // check whether there is a compound object being edited and prompt to save if changed
    if (!isEmpty && diffReposToEditor){
        // set editor to read-only
        /*if (lore.ore.ui.graphicalEditor){
            lore.ore.ui.graphicalEditor.coGraph.setReadOnly(true);
        }*/
        
        if (currentCOMsg) {currentCOMsg.setText(Ext.util.Format.ellipsis(title, 50) + ' (read-only)',false)};
        if (lore.ore.compoundObjectDirty()){
            lore.debug.ore("setrepos: dirty");
            Ext.Msg.show({
                title : 'Save Compound Object?',
                buttons : Ext.MessageBox.YESNO,
                msg : 'The default Compound Object repository preferences have been changed. <br>You will be able to view the current compound object in read-only mode, however you will not be able to save changes unless the repository preferences are changed back to the repository that contains this compound object. <br><br>Would you like to save your changes before proceeding?',
                fn : function(btn, theurl) {
                    if (btn == 'yes') {
                        // TODO: #56 check that the save completed successfully?
                        var remid = lore.ore.getPropertyValue(lore.ore.REM_ID_PROP,lore.ore.ui.grid);
                        var therdf = lore.ore.createRDF(false);
                        lore.ore.reposAdapter.saveCompoundObject(remid,therdf,function(){
                            lore.ore.afterSaveCompoundObject(remid);
                        });
                    }  
                }
            });
        }
    } else {
        // its from the same repository, set editor to editable
        /*if (lore.ore.ui.graphicalEditor.coGraph){
            lore.ore.ui.graphicalEditor.coGraph.setReadOnly(false);
        }*/
        if (currentCOMsg) {currentCOMsg.setText(Ext.util.Format.ellipsis(title, 50),false);}
        lore.debug.ore("setrepos: not different");
    }
    if (rdfrepostype == 'sesame'){
        /** Adapter used to access the repository */
        lore.ore.reposAdapter = new lore.ore.SesameAdapter(rdfrepos);
    } else if (rdfrepostype == 'fedora'){
        lore.ore.reposAdapter = new lore.ore.FedoraAdapter(rdfrepos);
    }else {
        lore.ore.ui.loreWarning("Not yet implemented: change your repository type preference");
    }
    if (isEmpty) {
            // empty compound object, reset it to get a new id
            lore.debug.ore("setrepos: empty");
            lore.ore.ui.newCO(true);
    }
    // Reload history so that compound objects from other repositories are marked as read-only
    if (lore.ore.historyManager){
        lore.ore.historyManager.onEndUpdateBatch();
    }
    // Reload the related compound objects list
    lore.ore.updateCompoundObjectsBrowseList(lore.ore.ui.loadedURL);
    
    // Reset the search results and explore view
    if (lore.ore.coListManager){
        lore.ore.coListManager.clear("search");
        //lore.ore.ui.searchtreeroot.setDetails([]);
    }
    if (lore.ore.explorePanel && lore.ore.cache){
        lore.ore.explorePanel.showInExploreView(lore.ore.cache.getLoadedCompoundObjectUri(),"Current Compound Object",true);
    }
};
/** Handle click of search button in search panel */
lore.ore.keywordSearch = function(){
    lore.debug.ore("kw search triggered");
    lore.ore.search(null,null,Ext.getCmp("kwsearchval").getValue());
};

lore.ore.advancedSearch = function(){
    var searchform = Ext.getCmp("advsearchform").getForm();
    var searchuri = searchform.findField("searchuri").getValue();
    var searchpred = searchform.findField("searchpred").getValue();
    var searchval = searchform.findField("searchval").getValue();
    //var searchexact = searchform.findField("searchexact").getValue();
    lore.ore.search(searchuri, searchpred, searchval);
};

lore.ore.search = function (searchuri, searchpred, searchval){
    if (!searchuri && !searchpred && !searchval){
        // blank search returns all compound objects for now (not scalable!)
        searchval = lore.constants.RESOURCE_MAP;
    }
    try{
    
    var searchTerms = [];
    if (searchuri){
        searchTerms.push("<i>containing: </i>" + searchuri);
    }
    if (searchpred){
        searchTerms.push("<i>having: </i>" + searchpred);
    }
    if (searchval){
        searchTerms.push("<i>matching: </i>" + searchval);
    }
    //TODO: display search details in new dataview
    //lore.ore.ui.searchtreeroot.setDetails(searchTerms);

    // display loading message
    var searchview = Ext.getCmp('cosview');
    searchview.onBeforeLoad();
    
    lore.ore.reposAdapter.getCompoundObjects(searchuri, searchpred,searchval,true);
    } catch (e){
        lore.debug.ore("exception in search",e);
    }
};

/**
 * Checks whether the compound object loaded in the editor has been modified
 * @return {Boolean} Returns true if the compound object has been modified
 */
lore.ore.compoundObjectDirty = function (){
    // TODO: #56 implement this method - compare state of model

    // return false if there is no compound object loaded
    if (!lore.ore.cache || !lore.ore.cache.getLoadedCompoundObject()){
        return false;
    }
    // If it was a new compound object and the graphical view is either not defined 
    // or has no resources, don't consider it to be dirty
    if (lore.global.util.isEmptyObject(lore.ore.cache.getLoadedCompoundObject().getInitialContent()) 
        && (!lore.ore.ui.graphicalEditor || 
            (lore.ore.ui.graphicalEditor.coGraph 
                && lore.ore.ui.graphicalEditor.coGraph.getDocument().getFigures().getSize() == 0))){
        return false;
    } else {
        return true;
    }
};

lore.ore.ui.newCO = function(dontRaise){
    if (lore.ore.ui.topView){
            lore.ore.ui.topView.hideAddIcon(false);
        }
        var cDate = new Date();
        // TODO: fix properties - use date string for now
        // TODO: should not assign an id until it has been saved
        var currentREM = lore.ore.reposAdapter.generateID();
        lore.ore.cache.add(currentREM, new lore.ore.model.CompoundObject({uri: currentREM}));
        lore.ore.cache.setLoadedCompoundObjectUri(currentREM);
        lore.ore.cache.setLoadedCompoundObjectIsNew(true);
        lore.ore.ui.grid.store.loadData(
        [
            {id:"rdf:about_0", name: lore.ore.REM_ID_PROP, value: currentREM},
            {id: "dc:creator_0", name: "dc:creator", value: lore.defaultCreator},
            {id: "dcterms:modified_0", name: "dcterms:modified", value: cDate},
            {id:"dcterms:created_0", name:"dcterms:created",value: cDate},
            {id: "dc:title_0", name: "dc:title", value: ""}
        ]  
        );
        lore.ore.ui.initGraphicalView();
        Ext.getCmp('currentCOMsg').setText('New compound object');
        lore.ore.populateResourceDetailsCombo();
        if (!dontRaise) {
            Ext.getCmp("propertytabs").activate("properties");
        }
        
}
/** Initialize a new compound object in the editor, prompting first whether to save the current compound object */
lore.ore.createCompoundObject = function (dontRaise){
    
    try{
        // Check if the currently loaded compound object has been modified and if it has prompt the user to save changes
	    if (lore.ore.compoundObjectDirty()){
	        Ext.Msg.show({
		        title : 'Save Compound Object?',
		        buttons : Ext.MessageBox.YESNOCANCEL,
		        msg : 'Would you like to save the compound object before proceeding?<br><br>Any unsaved changes will be lost if you select "No".',
                //msg: 'Any unsaved changes to the current compound object will be lost. Would you like to continue anyway?',
		        fn : function(btn) {
		            if (btn === 'yes') {
                        // TODO: #56 check that the save completed successfully before calling newCO
                        var remid = lore.ore.getPropertyValue(lore.ore.REM_ID_PROP,lore.ore.ui.grid);
                        // TODO: this should be handled by repository adapter
                        var therdf = lore.ore.createRDF(false);
                        lore.ore.reposAdapter.saveCompoundObject(remid,therdf,function(){
                            lore.ore.afterSaveCompoundObject(remid);
                            lore.ore.ui.newCO(dontRaise);  
                        });
		                
		            } else if (btn === 'no') {
                        lore.ore.ui.newCO(dontRaise);
                    }
		        }
		    });
        } else {
            lore.ore.ui.newCO(dontRaise);
        }

    } catch (e){
        lore.debug.ore("Error in createCompoundObject",e);
    }
};

/** Actions performed when lore Compound Objects panel is shown */
lore.ore.onShow = function () {
	lore.ore.ui.lorevisible = true;	
	if (lore.ore.ui.currentURL && lore.ore.ui.currentURL != 'about:blank' &&
		lore.ore.ui.currentURL != '' &&
		(!lore.ore.ui.loadedURL || lore.ore.ui.currentURL != lore.ore.ui.loadedURL)) {
			lore.ore.updateCompoundObjectsBrowseList(lore.ore.ui.currentURL);
			lore.ore.ui.loadedURL = lore.ore.ui.currentURL;
		}
};
/** Actions performed when lore Compound Objects panel is hidden */
lore.ore.onHide = function () {
	lore.ore.ui.lorevisible = false;
};

/**
 * Add a resource to the compound object (alias used by toolbar)
 * @param {} theURL
 * @param {} props
 */
lore.ore.addResource = function (/*URL*/theURL, props) {
    // TODO: #34 MVC:  make it add to model and get view to listen on model
	lore.ore.ui.graphicalEditor.addFigure({url:theURL, props: props});
};

/**
 * Remove listeners and reference to a Compound Object view if it is closed
 * 
 * @param {Object} tabpanel
 * @param {Object} panel
 */
lore.ore.closeView = function(/*Ext.TabPanel*/tabpanel, /*Ext.panel*/panel) {
    lore.debug.ore("close view " + panel.id,panel);
    // remove listeners
    var tab = Ext.getCmp(panel.id);
    if (panel.id == 'remrdfview') {
        tab.un("activate", lore.ore.updateRDFHTML);     
    }
    else if (panel.id == 'remsmilview') {
        tab.un("activate", lore.ore.showSMIL);   
    }
    else if (panel.id == 'remfoxmlview') {
        tab.un("activate",lore.ore.updateFOXML);
    }
    else if (panel.id == 'remtrigview') {
        tab.un("activate",lore.ore.updateTriG);
    }
    return true;
};
lore.ore.ui.dragDrop = function(aEvent){
    var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
    var dragSession = dragService.getCurrentSession();
    
    // If sourceNode is not null, then the drop was from inside the application
    // add to compound object if it is a link or image
    var sn = dragSession.sourceNode;
    if (sn){
        if (sn instanceof HTMLAnchorElement){
            var sntitle = sn.textContent;
            var figopts = {
                url: sn.href,
                x: Math.max(0,aEvent.layerX),
                y: Math.max(0,aEvent.layerY)
            }
            if (sntitle){
                figopts.props = {"dc:title_0": sntitle};
            }
            lore.ore.ui.graphicalEditor.addFigure(figopts);
        } else if (sn instanceof HTMLImageElement){
            lore.ore.ui.graphicalEditor.addFigure({url:sn.src});
        }
        return;
    }
    // Drag source is from outside application (i.e. a file)
    // TODO: allow RDF/XML files to be dropped to open (perhaps also shortcuts)
    /*
    var _ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    var uris = new Array();
    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
    trans.addDataFlavor("text/x-moz-url");
    trans.addDataFlavor("application/x-moz-file");

    for (var i=0; i<dragSession.numDropItems; i++) {
      var uri = null;

      dragSession.getData(trans, i);
      var flavor = {}, data = {}, length = {};
      trans.getAnyTransferData(flavor, data, length);
      lore.debug.ore("data from drop",data);
      if (data) {
        try {
          var str = data.value.QueryInterface(Components.interfaces.nsISupportsString);
        }
        catch(ex) {
        }

        if (str) {
          uri = _ios.newURI(str.data.split("\n")[0], null, null);
        }
        else {
          var file = data.value.QueryInterface(Components.interfaces.nsIFile);
          if (file)
            uri = _ios.newFileURI(file);
        }
      }

      if (uri)
        uris.push(uri);
    }

    // Use the array of file URIs
    lore.debug.ore("array of file uris",uris);
    */
};
lore.ore.ui.dragOver = function(aEvent){
    var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
    var dragSession = dragService.getCurrentSession();

    var supported = dragSession.isDataFlavorSupported("text/x-moz-url");
    if (!supported)
      supported = dragSession.isDataFlavorSupported("application/x-moz-file");

    if (supported)
      dragSession.canDrop = true;
};


/** Helper function to create a view displayed in a closeable tab */
lore.ore.openView = function (/*String*/panelid,/*String*/paneltitle,/*function*/activationhandler){
    var tab = Ext.getCmp(panelid);
    if (!tab) {
       tab = Ext.getCmp("loreviews").add({
            'title' : paneltitle,
            'id' : panelid,
            'autoScroll' : true,
            'closable' : true
        });
        tab.on("activate", activationhandler);
    }
    tab.show();
};

// Temporary function to preload nested compound objects into cache
lore.ore.cacheNested = function(coContents,nestingLevel) {
    if (nestingLevel < lore.ore.MAX_NESTING){
        coContents.where('?a ore:aggregates ?url')
            .where('?url rdf:type <' + lore.constants.RESOURCE_MAP + '>')
            .each(function(){
                try{
                  var theurl = this.url.value.toString();
                  var nestedCO = lore.ore.cache.getCompoundObject(theurl);
                  if (!nestedCO){
	                  // TODO: Load these asynchronously via the repository adapter
	                  var xhr = new XMLHttpRequest();
	                  xhr.overrideMimeType('text/xml');
	                  xhr.open("GET", theurl, false);
	                  xhr.send(null);
	                  nestedCO = new lore.ore.model.CompoundObject({uri: theurl});
	                  nestedCO.load({format: 'application/rdf+xml', content: xhr.responseXML});
	                  lore.ore.cache.add(theurl, nestedCO);
                      lore.ore.cacheNested(nestedCO.getInitialContent(), nestingLevel + 1)
                  }
                } catch (e) {
                    lore.debug.ore("Problem loading nested CO into cache",e);
                }
            }
        );
    }
};
/** Generate a slideshow representing the current compound object */
lore.ore.showSlideshow = function(p){
    var panel = p.getComponent('newss');
    Ext.MessageBox.show({
           msg: 'Generating Slideshow',
           width:250,
           defaultTextHeight: 0,
           closable: false,
           cls: 'co-load-msg'
    });
    
    // TODO: slideshow should listen to model and this should not be regenerated each time
    var coContents = lore.ore.serializeREM('rdfquery');
    // preload all nested compound objects to cache
    lore.ore.cacheNested(coContents, 0);
    var tmpCO = new lore.ore.model.CompoundObject();
    tmpCO.load({format: 'rdfquery',content: coContents});
    panel.loadContent(tmpCO);
    Ext.Msg.hide();
}

/** Generate a SMIL presentation from the current compound object and display a link to launch it */
lore.ore.showSMIL = function() {
    var allfigures = lore.ore.ui.graphicalEditor.coGraph.getDocument().getFigures();
    var numfigs = allfigures.getSize();
    var smilcontents = "<p><a title='smil test hover' href='http://www.w3.org/AudioVideo/'>SMIL</a> is the Synchronized Multimedia Integration Language.</p>";
    if (numfigs > 0) {
        var smilpath = lore.ore.createSMIL(); // generate the new smil file
        // into oresmil.xsl
        smilcontents += "<p>A SMIL slideshow has been generated from the contents of the current compound object.</p><p>"
                + "<a onclick='lore.global.util.launchWindow(this.href, false, window);return(false);' target='_blank' href='file://"
                + smilpath
                + "'>Click here to launch the slideshow in a new window</a><br/>";
    } else {
        smilcontents += "<p>Once you have added some resources to the current compound object a SMIL presentation will be available here.</p>";
    }
    Ext.getCmp("remsmilview").body.update(smilcontents);
    lore.ore.ui.loreInfo("Display a multimedia presentation generated from the compound object contents");
};
/** Render the current compound object as RDF/XML in the RDF view */
lore.ore.updateRDFHTML = function() {
    var rdfString = lore.ore.transformORERDF("chrome://lore/content/compound_objects/stylesheets/XMLPrettyPrint.xsl",{},true);
    if (!rdfString) {
        rdfString = "Unable to generate RDF/XML";
    }
    Ext.getCmp("remrdfview").body.update(rdfString);
};

/** Render the current compound object as Fedora Object XML in the FOXML view */
lore.ore.updateFOXML = function (){
    var foxml = lore.ore.createFOXML();
    var foxmlString = lore.global.util.transformXML("chrome://lore/content/compound_objects/stylesheets/XMLPrettyPrint.xsl", foxml, {}, window, true);
    if (!foxmlString){
        foxmlString = "Unable to generate FOXML";
    }
    Ext.getCmp("remfoxmlview").body.update(foxmlString);
};
/** Render the current compound object in TriG format in the TriG view*/
lore.ore.updateTriG = function (){
    var trig = lore.ore.serializeREM('trig');
    Ext.getCmp("remtrigview").body.update("<pre style='white-space:pre-wrap;-moz-pre-wrap:true'>" + Ext.util.Format.htmlEncode(trig) + "</pre>");
};

lore.ore.resizeSlideshow = function (comp,adjWidth, adjHeight, rawWidth, rawHeight){
    try {
	    var carouselel = Ext.get("trailcarousel");
	    var w = carouselel.getWidth() - 160;
	    var h = carouselel.getHeight();
	    lore.debug.ore("setting carousel width to " + w + " and height to " + h);
	    jQuery("object.sspreview").attr("height",(h - 29));//.attr("width",w);
        jQuery("img.sspreview").css("max-height",(h-29) + "px");
        //jQuery(".ux-carousel-slide").attr("width",carouselel.getWidth()).attr("height",h);
        //jQuery(".preview").attr("width",w).attr("height",h);
        jQuery(".itemdesc").css("height",(h-29)+ "px");//.css("width",150);
        jQuery(".ux-carousel-container").css("height",h+"px");//.css("width",carouselel.getWidth() + "px");
    } catch (ex){
        lore.debug.ore("error resizing slideshow",ex);
    }
}

/** Prompt for location to save serialized compound object and save as file
 * @param {String} format The format to which to serialize (rdf, wordml, foxml or trig)
 */
lore.ore.handleSerializeREM = function (format) {
    var fileExtensions = {
        "rdf": "xml",
        "wordml": "xml",
        "foxml": "xml",
        "trig": "txt",
        "json": "txt"
    };
	try {
        if (!format) {
            format = "rdf";
        }
		var fObj = lore.global.util.writeFileWithSaveAs("Export Compound Object as", fileExtensions[format], 
												function(){	return lore.ore.serializeREM(format);},window);
		if ( fObj ) {
			lore.ore.ui.loreInfo("Successfully saved Compound Object data to " +fObj.fname);
		}											
	} catch (e) {
		lore.debug.ore("Error saving Compound Objects data: " + e,e );
		lore.ore.ui.loreError("Error saving Compound Object: " + e);
	}
};
lore.ore.serializeREM = function(format) {
    if ('foxml' == format) {
        return lore.ore.createFOXML();
    } else if ('wordml' == format){
        return lore.ore.createOREWord();
    }
    // TODO: remove the first line once compound object is stored as rdfquery store
    var rdf = lore.ore.createRDF(false);
    /*if (format == 'rdf'){
        // until we use a triplestore all of the time, don't bother parsing XML which may contain errors
        // otherwise users think they have saved the compound object but they've just saved a parse error message
        return rdf;
    }*/
    try {
	    var rdfDoc = new DOMParser().parseFromString(rdf, "text/xml");
	        var databank = jQuery.rdf.databank();
	        for (ns in lore.constants.NAMESPACES){
	            databank.prefix(ns,lore.constants.NAMESPACES[ns]);
	        }
	        databank.load(rdfDoc);
        if (format == 'rdfquery') {
            return jQuery.rdf({databank: databank});
        } else if (format == 'trig') {
	       var result = "<" + lore.ore.cache.getLoadedCompoundObjectUri() + ">\n{\n";
	       var triples = databank.triples();
	       for (var t = 0; t < triples.length; t++){
	        var triple = triples[t];
	        result += triple.toString() + "\n"; 
	       }
	       result += "}\n";
	       return result;
	    } else if (format == 'json'){
	        return Ext.util.JSON.encode(databank.dump({format: 'application/json'}));
	    } else {
	        return databank.dump({format:'application/rdf+xml',serialize:true}); 
	    }
      
    } catch (e) {
        lore.debug.ore("Error serializing RDF",e);
        return rdf;
    }
};
/**
 * Create the RDF/XML of the current compound object
 * 
 * @param {Boolean} escape Indicates whether to escape the results for rendering as HTML
 * @return {String} The RDF/XML as a string
 */
lore.ore.createRDF = function(/*boolean*/escape) {
    /*
     * Helper function that serializes a property to RDF/XML propname The name
     * of the property to serialize properties All of the properties ltsymb Less
     * than symbol nlsymb New line symbol returns The RDF/XML representation of
     * the property
     */
    var serialize_property = function(propname, propval, ltsymb, nlsymb) {
        var result = "";
        if (propval && propval != '') {
            if (propval.match("http:") || propval.match("mailto:")){
                // this is a resource
                result = ltsymb + propname + " resource='" + 
                lore.global.util.escapeHTML(propval.toString().replace(/"/g,"&quot;"))
                + "'/>" + nlsymb;
            } else {
                // literal
                result = ltsymb + propname + ">"
                + lore.global.util.escapeHTML(propval.toString().replace(/"/g,"&quot;"))
                + ltsymb + "/" + propname + ">" + nlsymb;
            }
            
        }
        return result;
    };
    try{
    var ltsymb = "<";
    var nlsymb = "\n";
    if (escape) {
        ltsymb = "&lt;";
        nlsymb = "<br/>";
    }
    // TODO: check whether CO has been modified before changing the date
    var modifiedDate = new Date();
    var proprecidx = lore.ore.ui.grid.store.find("name","dcterms:modified");
    if (proprecidx != -1){
       lore.ore.ui.grid.store.getAt(proprecidx).set("value", modifiedDate);
       lore.ore.ui.grid.store.commitChanges();
    }
    var rdfabout = lore.ore.getPropertyValue(lore.ore.REM_ID_PROP,lore.ore.ui.grid);
    
    // Load existing aggregation id if any from original RDF
    var describedaggre = "#aggregation";
    var loadedRDF = lore.ore.cache.getLoadedCompoundObject().getInitialContent();
    var existingAggre = !lore.global.util.isEmptyObject(loadedRDF);
    if (existingAggre) {
        var remQuery = loadedRDF.where('?aggre rdf:type ore:Aggregation')
            .where('<'+ rdfabout +'> ore:describes ?aggre');
        describedaggre = remQuery.get(0).aggre.value.toString();
    }



    // RDF fragments
    var rdfdescabout = "rdf:Description rdf:about=\"";
    var closetag = "\">" + nlsymb;
    var fullclosetag = "\"/>" + nlsymb;
    var rdfdescclose = "/rdf:Description>";

    // create RDF for resource map: modified is required
    var rdfxml = ltsymb + "?xml version=\"1.0\" encoding=\"UTF-8\" ?>" + nlsymb
            + ltsymb + 'rdf:RDF ' + nlsymb;
    for (var pfx in lore.constants.NAMESPACES) {
        rdfxml += "xmlns:" + pfx + "=\"" + lore.constants.NAMESPACES[pfx]
                + "\"" + nlsymb;
    }
    
    var modifiedString = modifiedDate.format('c');
    rdfxml += "xml:base = \"" + rdfabout + "\">" + nlsymb + ltsymb
            + rdfdescabout + rdfabout + closetag + ltsymb
            + "ore:describes rdf:resource=\"" + describedaggre + fullclosetag
            + ltsymb + 'rdf:type rdf:resource="' + lore.constants.RESOURCE_MAP
            + '" />' + nlsymb + ltsymb + 'dcterms:modified rdf:datatype="'
            + lore.constants.NAMESPACES["dcterms"] + 'W3CDTF">' 
            + modifiedString + ltsymb + "/dcterms:modified>"
            + nlsymb;
    var created = lore.ore.getPropertyValue("dcterms:created",lore.ore.ui.grid);
    
    if (created && Ext.isDate(created)) {
        rdfxml += ltsymb + 'dcterms:created rdf:datatype="' 
        + lore.constants.NAMESPACES["dcterms"] + 'W3CDTF">'
        + created.format('c') + ltsymb + "/dcterms:created>" + nlsymb;
    }   
     else if (created) {
        rdfxml += ltsymb + 'dcterms:created>'// rdf:datatype="'
                //+ lore.constants.NAMESPACES["xsd"] + 'date">'
                + created + ltsymb + "/dcterms:created>" + nlsymb;
    }
    // serialize compound object properties
    lore.ore.ui.grid.store.each(function (rec){
       var propname = rec.id.substring(0,rec.id.indexOf("_"));
       if (propname != 'dcterms:modified' && propname != 'dcterms:created' && propname != 'rdf:about'){
        rdfxml += serialize_property(propname, rec.data.value, ltsymb, nlsymb);
       }
    });
    rdfxml += ltsymb + rdfdescclose + nlsymb;
    // create RDF for aggregation
    rdfxml += ltsymb + rdfdescabout + describedaggre + closetag + ltsymb
            + "rdf:type rdf:resource=\"" + lore.constants.NAMESPACES["ore"] + "Aggregation"
            + fullclosetag;
    rdfxml += ltsymb + 'dcterms:modified>' + modifiedString + ltsymb + "/dcterms:modified>" + nlsymb;
    // Load original aggregation properties if any
    // LORE does not support editing these, but should preserve them
    // TODO: REFACTOR!! this code appears several times : properties should be serialized from model
    if (existingAggre){
        var aggreprops = loadedRDF.where('<' + describedaggre + '> ?pred ?obj')
            .filter(function(){
                // filter out ore:aggregates, type and modified
                if (this.pred.value.toString() === lore.constants.NAMESPACES["ore"] + "aggregates" ||
                    this.pred.value.toString() === lore.constants.NAMESPACES["rdf"] + "type" ||
                    this.pred.value.toString() === lore.constants.NAMESPACES["dcterms"] + "modified") {
                        return false;
                }
                else {
                    return true;
                }
            })
            .each(function(){  
                
                var presult = lore.global.util.splitTerm(this.pred.value.toString());
                var propval = this.obj.value.toString();
                var propname = presult.term;
                var propnsdec = ' xmlns="' + presult.ns + '"';
                lore.debug.ore("matched aggregation prop",this);
                if (this.obj.type == 'uri'){
                    rdfxml += ltsymb + propname + propnsdec + " resource='" + 
                    lore.global.util.escapeHTML(propval.toString().replace(/"/g,"&quot;"))
                    + "'/>" + nlsymb;
                } else {
                    rdfxml += ltsymb + propname + propnsdec + ">"
                    + lore.global.util.escapeHTML(propval.toString().replace(/"/g,"&quot;"))
                    + ltsymb + "/" + propname + ">" + nlsymb;
                }
            });
    }
    var allfigures = lore.ore.ui.graphicalEditor.coGraph.getDocument().getFigures().data;
    allfigures.sort(lore.ore.ui.graphicalEditor.figSortingFunction);
    var resourcerdf = "";
    for (var i = 0; i < allfigures.length; i++) {
        var fig = allfigures[i];
        if (fig instanceof lore.ore.ui.graph.ResourceFigure){
	        var figurl = lore.global.util.escapeHTML(lore.global.util.preEncode(fig.url.toString()));
	        rdfxml += ltsymb + "ore:aggregates rdf:resource=\"" + figurl
	                + fullclosetag;
	        // create RDF for resources in aggregation
	        for (var mprop in fig.metadataproperties) {
	            if (mprop != 'resource_0' && !mprop.match('undefined')) {
	                var mpropval = fig.metadataproperties[mprop];
	                if (mpropval && mpropval != '') {
	                    var tagname = mprop;
	                    var midx = mprop.indexOf("_");
	                    if (midx != -1){
	                        tagname = mprop.substring(0,midx);
	                    }
                        // why not using serialize_property function here?
	                    //if (tagname == "rdf:type"){ // resource
                        if (mpropval.match("http:") || mpropval.match("mailto:")){
	                        resourcerdf +=  ltsymb + rdfdescabout + figurl + closetag
	                            + ltsymb + tagname + " rdf:resource=\"" + lore.global.util.escapeHTML(mpropval.replace(/"/g,"&quot;")) 
	                            +  "\"/>" + nlsymb + ltsymb + rdfdescclose + nlsymb;  
	                    } else { // properties that have literal values
	                    resourcerdf += ltsymb + rdfdescabout + figurl + closetag
	                            + ltsymb + tagname + ">" + lore.global.util.escapeHTML(mpropval.replace(/"/g,"&quot;")) + ltsymb + "/"
	                            + tagname + ">" + nlsymb + ltsymb + rdfdescclose + nlsymb;
	                    }
	                }
	            }
	        }
	        /* persist node layout */
	
	        var objframe = window.frames[fig.url + "-data"];
	        resourcerdf += ltsymb + rdfdescabout + figurl + closetag + ltsymb
	                + "layout:x>" + fig.x + ltsymb + "/" + "layout:x>" + nlsymb
	                + ltsymb + "layout:y>" + fig.y + ltsymb + "/" + "layout:y>"
	                + nlsymb + ltsymb + "layout:width>" + fig.width + ltsymb + "/"
	                + "layout:width>" + nlsymb + ltsymb + "layout:height>"
	                + fig.height + ltsymb + "/" + "layout:height>" + nlsymb
	                + ltsymb + "layout:originalHeight>" + fig.originalHeight
	                + ltsymb + "/" + "layout:originalHeight>" + nlsymb;
	        
	        if (objframe && (objframe.scrollX != 0 || objframe.scrollY != 0)) {
	            resourcerdf += ltsymb + "layout:scrollx>" + objframe.scrollX
	                    + ltsymb + "/" + "layout:scrollx>" + nlsymb + ltsymb
	                    + "layout:scrolly>" + objframe.scrollY + ltsymb + "/"
	                    + "layout:scrolly>" + nlsymb;
	        }
	        resourcerdf += ltsymb + rdfdescclose + nlsymb;
	        
	        // iterate over all ports' connections and serialize if this fig is the source of the connection
	        var ports = fig.getPorts();
	        for (var p = 0; p < ports.getSize(); p++){
	            var outgoingconnections = ports.get(p).getConnections();
	            for (var j = 0; j < outgoingconnections.getSize(); j++) {
		            var theconnector = outgoingconnections.get(j);
	                if (figurl == lore.global.util.escapeHTML(theconnector.sourcePort.parentNode.url)){
		               var relpred = theconnector.edgetype;
		               var relns = theconnector.edgens;
		               var relobj = lore.global.util.escapeHTML(theconnector.targetPort.parentNode.url);
		               resourcerdf += ltsymb + rdfdescabout + figurl + closetag + ltsymb
		                    + relpred + " xmlns=\"" + relns + "\" rdf:resource=\""
		                    + relobj + fullclosetag + ltsymb + rdfdescclose + nlsymb;
	                }
		        }
	        } 
        }
    }
    rdfxml += ltsymb + rdfdescclose + nlsymb;
    rdfxml += resourcerdf;
    rdfxml += ltsymb + "/rdf:RDF>";
    return rdfxml;
    } catch (ex){
        lore.debug.ore("exception in createRDF",ex);
    }
};
lore.ore.nsprefix = function(ns) {
        var nssize = 0;
        for (var prefix in lore.constants.NAMESPACES) {
            if (lore.constants.NAMESPACES[prefix] == ns) {
                return prefix;
            }
            nssize++;
        }
        // Prefix was not found: create a new one: ensure it has a unique ns prefix
        var nprefix = "ns" + nssize;
        lore.constants.NAMESPACES[nprefix] = ns;
        return nprefix;
};
lore.ore.loadCompoundObjectContents = function (rdf,elem){
    
    try{
	    var rdfDoc = rdf.responseXML;
	    var databank = jQuery.rdf.databank();
	    for (ns in lore.constants.NAMESPACES){
	            databank.prefix(ns,lore.constants.NAMESPACES[ns]);
	    }
	    databank.load(rdfDoc);
        var myrdf = jQuery.rdf({databank: databank})
        var remQuery = myrdf.where('?aggre rdf:type ore:Aggregation').where('?rem ore:describes ?aggre');
        var remid, res = remQuery.get(0);
        if (res){
           remid = res.rem.value.toString();
        } 
    } catch (e){
        lore.debug.ore('error loading contents of nested comp obj for summary into databank',e);
    }
    try {
        var text =  "Contents:<br>"
            + databank.dump({format:'application/rdf+xml',serialize:true})
            + "<a href='#' onclick=\"lore.ore.readRDF('"
            + remid
            + "');\"><img src='../../skin/icons/action_go.gif'>&nbsp;Load in LORE</a></div>";
        elem.text(text); 
    } catch (e){
        lore.debug.ore("error setting elem contents for nested summary",e);
    }
    
}
lore.ore.loadCompoundObjectFail = function (resp,opt){
    lore.debug.ore("Unable to load compound object " + opt.url, resp);
    lore.ore.ui.loreError("Unable to load compound object");
    lore.ore.createCompoundObject(true);
    Ext.Msg.hide();
};
/**
 * Load a compound object into the graphical view
 * @param {} rdf XML doc or XML HTTP response containing the compound object (RDF/XML)
 */
lore.ore.loadCompoundObject = function (rdf) {
    lore.debug.startTiming();
    var showInHistory = false;
    try {
        // reset the graphical view
        lore.ore.ui.initGraphicalView();
        
        Ext.getCmp("loreviews").activate("drawingarea");
        var rdfDoc;
        if (typeof rdf != 'object'){ 
	       rdfDoc = new DOMParser().parseFromString(rdf, "text/xml");
        } else {
            showInHistory = true;
            rdfDoc = rdf.responseXML;
        }
        //lore.debug.timeElapsed("creating databank");
	    var databank = jQuery.rdf.databank();
        for (ns in lore.constants.NAMESPACES){
            databank.prefix(ns,lore.constants.NAMESPACES[ns]);
        }
	    databank.load(rdfDoc);
        var loadedRDF = jQuery.rdf({databank: databank});
        // Display the properties for the compound object
	    var remQuery = loadedRDF.where('?aggre rdf:type ore:Aggregation')
            .where('?rem ore:describes ?aggre');
        var aggreurl, remurl;
        var res = remQuery.get(0);
        
        
        
        if (res){
	       remurl = res.rem.value.toString();
           aggreurl = res.aggre.value.toString();
           var tmpCO = new lore.ore.model.CompoundObject();
           tmpCO.load({format: 'application/rdf+xml',content:rdfDoc}); 
           lore.debug.ore("CO model is ",tmpCO);
           //lore.debug.timeElapsed("Loaded model");
            //lore.debug.ore("CO model is same as self? " + Ext.ux.util.Object.compare(tmpCO,tmpCO2),tmpCO2);
       
           lore.ore.cache.add(remurl, tmpCO);
           lore.ore.cache.setLoadedCompoundObjectUri(remurl);
           lore.ore.cache.setLoadedCompoundObjectIsNew(false);
        }  else {
            lore.ore.ui.loreWarning("No compound object found");
            lore.debug.ore("no remurl found in RDF",loadedRDF);
            lore.debug.ore("the input rdf was",rdf); 
        }
        // TODO: listen to model object
        //lore.debug.timeElapsed("loading into grid ");
	    lore.ore.ui.grid.store.loadData([
            {id:"rdf:about_0", name: lore.ore.REM_ID_PROP, value: remurl}
	    ]);
        loadedRDF.about('<' + remurl + '>')
            .each(function(){
                var propurl = this.property.value.toString();
                var propsplit = lore.global.util.splitTerm(propurl);
                var propname = lore.ore.nsprefix(propsplit.ns) + ":";
                if (propname){
                    propname = propname + propsplit.term;
                } else {
                    propname = propurl;
                }
                if (propname != "ore:describes" && propname != "rdf:type"){
                    lore.ore.appendPropertyValue(propname, this.value.value.toString(), lore.ore.ui.grid);
                }
            });
 
        //lore.debug.timeElapsed("create figure for each resource ");
        // create a node figure for each aggregated resource, restoring the layout
        loadedRDF.where('<' + aggreurl  + '> ore:aggregates ?url')
            .optional('?url layout:x ?x')
            .optional('?url layout:y ?y')
            .optional('?url layout:width ?w')
            .optional('?url layout:height ?h')
            .optional('?url layout:originalHeight ?oh')
            .optional('?url layout:scrollx ?sx')
            .optional('?url layout:scrolly ?sy')
            .optional('?url dc:format ?format')
            .optional('?url rdf:type ?rdftype')
            .optional('?url dc:title ?title')
            .each(function(){
             var resourceURL = this.url.value.toString(); 
             var fig;
             var opts = {batch: true, url: resourceURL};
             if (this.x && this.y) {
                for (prop in this) {
                    if (prop != 'url' && prop != 'format' && prop != 'rdftype' && prop != 'title'){
                        opts[prop] = parseInt(this[prop].value);
                    } else {
                        opts[prop] = this[prop].value.toString();
                    }
                }
                if (opts.x < 0){
                    opts.x = 0;
                }
                if (opts.y < 0) {
                    opts.y = 0;
                }
             } 
             fig = lore.ore.ui.graphicalEditor.addFigure(opts);
             
        });
        //lore.debug.timeElapsed("iterate over predicates to create props and rels ");
        // iterate over all predicates to create node connections and properties
        loadedRDF.where('?subj ?pred ?obj')
            .filter(function(){
                // filter out the layout properties and predicates about the resource map
                // also filter format and title properties as they have already been set
                if (this.pred.value.toString().match(lore.constants.NAMESPACES["layout"])
                    || this.pred.value.toString() === (lore.constants.NAMESPACES["dc"]+ "format")
                    || this.subj.value.toString().match(remurl)) {
                        return false;
                    }
                else {
                    return true;
                }
            })
            .each(function(){  
                // try to find a node that this predicate applies to 
                var subject = this.subj.value.toString();
                var coGraph = lore.ore.ui.graphicalEditor.coGraph;
                var srcfig = lore.ore.ui.graphicalEditor.lookupFigure(subject);
                if (!srcfig) {
                    // TODO: fix this as now preEncode is called - implement unPreEncode or something
                   srcfig = lore.ore.ui.graphicalEditor
                    .lookupFigure(lore.global.util.unescapeHTML(subject.replace(
                    '%3C', '<').replace('%3F', '>')));
                }
                if (srcfig) {
                    var relresult = lore.global.util.splitTerm(this.pred.value.toString());

                    var obj = this.obj.value.toString();
                    var tgtfig = lore.ore.ui.graphicalEditor.lookupFigure(obj);
                    /*if (!tgtfig) {
                        tgtfig = lore.ore.ui.graphicalEditor
                            .lookupFigure(lore.global.util.unescapeHTML(obj.replace(
                                        '%3C', '<').replace('%3F', '>')));
                    }*/
                    if (tgtfig && (srcfig != tgtfig)) { // this is a connection
                        lore.debug.ore("processing connection " + relresult.term,[tgtfig, srcfig]);
                        lore.debug.timeElapsed("connection 1");
                        try {
                        var c = new lore.ore.ui.graph.ContextmenuConnection();
                        //lore.debug.timeElapsed("connection 2");
                        var srcPort = srcfig.getPort("output");
                        //lore.debug.timeElapsed("connection 3");
                        var tgtPort = tgtfig.getPort("input");
                        //lore.debug.timeElapsed("connection 4");
                        if (srcPort && tgtPort){
                            c.setSource(srcPort);
                           // lore.debug.timeElapsed("connection 5");
                            c.setTarget(tgtPort);
                            //lore.debug.timeElapsed("connection 6");
                            c.setRelationshipType(relresult.ns, relresult.term);
                            //lore.debug.timeElapsed("connection 7");
                            coGraph.addFigure(c);
                            lore.debug.timeElapsed("connection 8");
                        }
                        else {
                            throw "source or target port not defined";
                        }
                        } catch (e) {
                            lore.debug.ore("problem creating connection",e);
                            delete c;
                        }
                        
                    } else  { 
                        //lore.debug.ore("processing property " + relresult.term,srcfig);
                        //lore.debug.timeElapsed("prop");
                        // not a node relationship, show in the property grid 
                        srcfig.appendProperty(lore.ore.nsprefix(relresult.ns) + ":" + relresult.term, obj);
                        if (relresult.term == "title") {
                            // TODO this should not be necessary - send props to addFigureWithOpts
                            srcfig.setTitle(obj);
                        }
                    }
                }
            }
        );
        //lore.debug.timeElapsed("hide/show mask ");
        // FIXME: #210 Temporary workaround to set drawing area size on load
        // problem still exists if a node is added that extends the boundaries
        lore.ore.ui.graphicalEditor.coGraph.showMask();
        lore.ore.ui.graphicalEditor.coGraph.hideMask();
        
        lore.ore.ui.loreInfo("Loading compound object");
        Ext.Msg.hide();
        //lore.debug.timeElapsed("set loaded in cache ");
        try{
            lore.ore.cache.setLoadedCompoundObjectUri(remurl);
        } catch (e){
            lore.debug.ore("problem",e);
        }
        //lore.ore.populateResourceDetailsCombo();
       //lore.debug.timeElapsed("show in history");
       if (showInHistory){
	        var title = lore.ore.getPropertyValue("dc:title",lore.ore.ui.grid) ||
                lore.ore.getPropertyValue("dcterms:title",lore.ore.ui.grid);
            if (!title){
                title = "Untitled";
            }
            lore.ore.historyManager.addToHistory(remurl, title);  
       }
       if (lore.ore.ui.topView && lore.ore.ui.graphicalEditor.lookup[lore.ore.ui.currentURL]){
            lore.ore.ui.topView.hideAddIcon(true);
       } else {
            lore.ore.ui.topView.hideAddIcon(false);
       }
       //lore.debug.timeElapsed("done");
       var readOnly = !remurl.match(lore.ore.reposAdapter.idPrefix)
       Ext.getCmp('currentCOMsg').setText(Ext.util.Format.ellipsis(title, 50) + (readOnly? ' (read-only)' : ''),false);
    } catch (e){
        lore.ore.ui.loreError("Error loading compound object");
        lore.debug.ore("exception loading RDF from string",e);
        lore.debug.ore("the RDF string was",rdf);
        lore.debug.ore("the serialized databank is",databank.dump({format:'application/rdf+xml', serialize: true}));
    }
};

/**
 * Loads a ORE resource map from a URL into the graphical view and property panels
 * 
 * @param {String} rdfURL The direct URL to the RDF (eg restful web service on repository that returns RDF)
 */
lore.ore.readRDF = function(rdfURL){
    Ext.MessageBox.show({
           msg: 'Loading compound object',
           width:250,
           defaultTextHeight: 0,
           closable: false,
           cls: 'co-load-msg'
       });

    if (lore.ore.reposAdapter){
        lore.ore.reposAdapter.loadCompoundObject(rdfURL, lore.ore.loadCompoundObject, lore.ore.loadCompoundObjectFail);
    }
};

/**
 * Load a resource map directly from a URL - prompt the user to enter the URL
 */
lore.ore.loadRDF = function() {
    Ext.Msg.show({
                title : 'Load RDF',
                buttons : Ext.MessageBox.OKCANCEL,
                msg : 'Please enter the URL of the compound object:',
                fn : function(btn, theurl) {
                    if (btn == 'ok') {
                        lore.ore.readRDF(theurl);
                    }
                },
                prompt : true
            });
};

/** Looks up property value from a grid by name
 * 
 * @param {} propname The name of the property to find
 * @param {} grid The grid
 * @return Object The value of the property
 */
lore.ore.getPropertyValue = function(propname, grid){
    var proprecidx = grid.store.find("name",propname);
    if (proprecidx != -1){
       return grid.store.getAt(proprecidx).get("value");
    } else {
        return "";
    }
};
/**
 * Add a property with the specified value to a property grid
 * @param {} propname
 * @param {} propval
 * @param {} pstore
 */
lore.ore.appendPropertyValue = function(propname, propval, grid){
        var pstore = grid.store;
        var counter = 0;
        var prop = pstore.getById(propname + "_" + counter);
        while (prop) {
            counter = counter + 1;
            prop = pstore.getById(propname + "_" + counter);
        }
        var theid = propname + "_" + counter;
        pstore.loadData([{id: theid, name: propname, value: propval}],true);
};
/**
 * Delete the compound object
 */
lore.ore.deleteFromRepository = function(aURI, aTitle){
    var remid = aURI;
    var title = aTitle;
    if (!remid){
        remid = lore.ore.getPropertyValue(lore.ore.REM_ID_PROP,lore.ore.ui.grid);
        title = lore.ore.getPropertyValue("dc:title",lore.ore.ui.grid) 
            || lore.ore.getPropertyValue("dcterms:title",lore.ore.ui.grid);
    }
    if(!remid.match(lore.ore.reposAdapter.idPrefix)){
        Ext.Msg.show({
            title: "Delete disabled",
            msg: "Deletion is disabled for this compound object because it is from a different repository than your default repository. <br><br>To enable deletion for this compound object, please change the <i>Repository Acess URL</i> in the Compound Objects preferences.",
            buttons: Ext.MessageBox.OK
        });
        return;
    }
    Ext.Msg.show({
        title : 'Remove Compound Object',
        buttons : Ext.MessageBox.OKCANCEL,
        msg : 'Are you sure you want to delete this compound object from the repository?<br><br>' + title + ' &lt;' + remid + "&gt;<br><br>This action cannot be undone.",
        fn : function(btn, theurl) {
            if (btn == 'ok') {
                lore.ore.reposAdapter.deleteCompoundObject(remid,lore.ore.afterDeleteCompoundObject);
            }
        }
    });
};

// TODO: move this to repository classes
/** Add saved compound object to the model lsits
 * @param {String} remid The compound object that was saved */
lore.ore.afterSaveCompoundObject = function(remid){
    lore.ore.cache.setLoadedCompoundObjectIsNew(false);
    var title = lore.ore.getPropertyValue("dc:title",lore.ore.ui.grid) 
        || lore.ore.getPropertyValue("dcterms:title",lore.ore.ui.grid) 
        || "Untitled";
    var coopts = {
            'uri': remid,
            'title': title,
            'creator': lore.ore.getPropertyValue("dc:creator",lore.ore.ui.grid),
            'modified': lore.ore.getPropertyValue("dcterms:modified",lore.ore.ui.grid)
    };
    // If the current URL is in the compound object, show in related compound objects
    if (lore.ore.ui.graphicalEditor.lookup[lore.ore.ui.currentURL]){
       lore.ore.coListManager.add([coopts]);
    }
    lore.ore.historyManager.addToHistory(remid, title);  
}
/** Remove a compound object from the UI */
lore.ore.afterDeleteCompoundObject = function(deletedrem){
    try{
	    if (lore.ore.cache.getLoadedCompoundObjectUri() == deletedrem){
            lore.ore.cache.setLoadedCompoundObjectUri("");
            lore.ore.ui.graphicalEditor.coGraph.clear();
	        lore.ore.createCompoundObject(); 
	    }
        lore.ore.coListManager.remove(deletedrem);
        lore.ore.historyManager.deleteFromHistory(deletedrem);
	    lore.ore.ui.loreInfo("Compound object deleted");
    } catch (ex){
        lore.debug.ore("Error after deleting compound object",ex);
    }
};
/**
 * Save the compound object to the repository - prompt user to confirm
 */
lore.ore.saveRDFToRepository = function(callback) {
    // TODO: compare new compound object with contents of rdfquery db that stores initial state - don't save if unchanged
    // update rdfquery to reflect most recent save
    var remid = lore.ore.getPropertyValue(lore.ore.REM_ID_PROP,lore.ore.ui.grid);
    var title = lore.ore.getPropertyValue("dc:title",lore.ore.ui.grid) 
        || lore.ore.getPropertyValue("dcterms:title",lore.ore.ui.grid) 
        || "Untitled";
    if(!remid.match(lore.ore.reposAdapter.idPrefix)){
        Ext.Msg.show({
            title: "Save disabled",
            msg: "Saving is disabled for this compound object because it is from a different repository than your default repository. <br><br>To enable saving for this compound object, please change the <i>Repository Acess URL</i> in the Compound Objects preferences.",
            buttons: Ext.MessageBox.OK
        });
        return;
    }
    Ext.Msg.show({
        title : 'Save RDF',
        buttons : Ext.MessageBox.OKCANCEL,
        msg : 'Are you sure you wish to save compound object:<br/><br/>' + title + "<br/><br/>to repository as " + remid + "?",
        fn : function(btn, theurl) {
            if (btn == 'ok') {
                var therdf = lore.ore.createRDF(false);
                lore.ore.reposAdapter.saveCompoundObject(remid,therdf,lore.ore.afterSaveCompoundObject);
            }
        }
    });
};


lore.ore.handleLocationChange = function (contextURL) {
	lore.ore.ui.currentURL = lore.global.util.preEncode(contextURL);
    var uri = lore.global.util.makeURI(lore.ore.ui.currentURL)
    lore.debug.ore("loaded " + lore.ore.ui.currentURL, uri.asciiSpec);
	if ( !lore.ore.ui.lorevisible || ! lore.ore.ui.initialized){
		return;
    }
    
	lore.ore.updateCompoundObjectsBrowseList(contextURL);
	lore.ore.ui.loadedURL = contextURL; 
};
/**
 * Updates the compound objects browse list with objects that reference the contextURL
 * 
 * @param {String} contextURL The escaped URL
 */
lore.ore.updateCompoundObjectsBrowseList = function(contextURL) {
    if (lore.ore.reposAdapter){
        lore.ore.reposAdapter.getCompoundObjects(contextURL);
    }
};

/* Graph related functions */
lore.ore.isInCompoundObject = function(theURL){
    var isInCO = typeof(lore.ore.ui.graphicalEditor.lookup[theURL]) !== 'undefined';
    return isInCO;
}


/** Transform RDF/XML of the current compound object using XSLT 
 * @param {String} stylesheetURL The XSLT stylesheet (probably a chrome URI)
 * @param {object} params Any parameters to pass to the XSLT stylesheet
 * @param {boolean} serialize True to return the result as a String rather than a Fragment
 * @return {object} String or Fragment containing result of applying the XSLT
 */
lore.ore.transformORERDF = function(stylesheetURL, params, serialize){
	 return lore.global.util.transformXML(stylesheetURL, lore.ore.createRDF(false), params, window, serialize);
};
/**
 * Use XSLT to generate a smil file from the compound object, plus create an
 * HTML wrapper
 * 
 * @return {} The file name of the wrapper file
 */
lore.ore.createSMIL = function() {
    try {
       
        var result = lore.ore.transformORERDF("chrome://lore/content/compound_objects/stylesheets/smil_view.xsl",{},true);
		 
		
		var file = lore.global.util.getFile(lore.ore.ui.extension.path);
		file.append("content");
		file.append("oresmil.smil");
		
        lore.global.util.writeFile(result, file,window);
        var htmlwrapper = "<HTML><HEAD><TITLE>SMIL Slideshow</TITLE></HEAD>"
                + "<BODY BGCOLOR=\"#003366\"><CENTER>"
                + "<embed style='border:none' height=\"95%\" width=\"95%\" src=\"oresmil.smil\" type=\"application/x-ambulant-smil\"/>"
                + "</CENTER><p style='font-size:smalller;color:#ffffff; padding:5px'>SMIL presentation generated by LORE on "
                + "<script type='text/javascript'>document.write(new Date().toString())</script>"
                + "</p></BODY></HTML>";
        
		file = lore.global.util.getFile(lore.ore.ui.extension.path);
		file.append("content");
		file.append("playsmil.html");
		return lore.global.util.writeFile(htmlwrapper, file,window);

    } catch (e) {
        lore.ore.ui.loreWarning("Unable to generate SMIL: " + e.toString());
    }
};
/** Generate FOXML from the current compound object */
lore.ore.createFOXML = function (){
    try {
        var params = {'coid': 'demo:' + lore.global.util.splitTerm(lore.ore.cache.getLoadedCompoundObjectUri()).term};
        return lore.ore.transformORERDF("chrome://lore/content/compound_objects/stylesheets/foxml.xsl",params,true);     
    } catch (e) {
        lore.ore.ui.loreWarning("Unable to generate FOXML");
        lore.debug.ore("Unable to generate FOXML: ",e);
        return null;
    }
};
/** Generate a Word document from the current compound object */
lore.ore.createOREWord = function (){
    try {
        return lore.ore.transformORERDF("chrome://lore/content/compound_objects/stylesheets/wordml.xsl",{},true);
    } catch (e) {
        lore.ore.ui.loreWarning("Unable to generate Word document");
        lore.debug.ore("Unable to generate Word document",e);
        return null;
    }
};

lore.ore.ui.graph.dummyBatchDialog = function(){
    // dummy dialog for OR09 challenge
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
    var mainWindow = wm.getMostRecentWindow("navigator:browser");
        var thebrowser = mainWindow.getBrowser();
    var num = thebrowser.browsers.length;
    var thehtml = "<div style='border:1px solid black; padding:10px; margin:10px;background-color:white'>";
    for (var i = 0; i < num; i++) {
        var b = thebrowser.getBrowserAtIndex(i);
        try {
        //alert(b.currentURI.spec); // dump URLs of all open tabs to console
        thehtml += "<input type='checkbox' checked='checked'> " + b.currentURI.spec + "<br/>";
        } catch(e) {
        Components.utils.reportError(e);
        }
    }
    thehtml += "</div>";
    var win = new Ext.Window({
        //applyTo     : 'hello-win',
        layout      : 'fit',
        width       : 500,
        height      : 300,
        closeAction :'hide',
        plain       : true,

        html: "<p>Create a compound object using the following content:</p>" + 
        thehtml + 
        "<input type='checkbox' checked='checked'> Create relationships from browser history<br/>" +
        "<input type='checkbox' checked='checked'> Tag automatically using text-mining service<br/>",
        buttons: [{
        text     : 'OK',
        handler: function(){
            win.hide();
        }
        },{
        text     : 'Cancel',
        handler  : function(){
            win.hide();
        }
        }]
    });
    win.show();
};
/** Called on beforeclick of details tree nodes - use to update property values **/
lore.ore.updateResDetails = function(node,ev){
    try{
    var respropeditor = Ext.getCmp("detaileditor");
    var currSelectedNode = Ext.getCmp("resdetailstree").getSelectionModel().getSelectedNode();
    lore.debug.ore("prev node was",[currSelectedNode,node]);
    // update property/rel for previous node (using value from respropeditor)
    if (currSelectedNode){
        var newval = respropeditor.getValue();
        var currURI = Ext.getCmp("resselectcombo").getValue();
        // TODO use a proper mvc
        if (currURI == lore.ore.cache.getLoadedCompoundObjectUri()){
            // update node details grid
            try{
                if (lore.ore.ui.grid){
                    var proprecidx = lore.ore.ui.grid.store.find("id",currSelectedNode.id);
                    if (proprecidx != -1){
                        lore.ore.ui.grid.store.getAt(proprecidx).set("value", newval);
                        lore.ore.ui.grid.store.commitChanges();
                        currSelectedNode.attributes.value = newval;
                    }
                }
            } catch (e){
                lore.debug.ore("error adding to resource map store",e);
            }
        } else {
            // update figure
        }
    }
   
    respropeditor.setValue("");
    if (!node.isLeaf()){
        respropeditor.disable();
    } else {
        respropeditor.enable();
        respropeditor.setValue(node.attributes.value);
    }
    } catch (e){
        lore.debug.ore("error updating res detail",e);
    }
};
/** Jump to edit field **/
lore.ore.editResDetail = function(resURI,pname,val){
    // TODO read val from model
    try{
    lore.debug.ore("editing resource detail " + pname,[resURI,val]);
    // loadResourceDetails for resURI
    var detailscombo = Ext.getCmp("resselectcombo");
    var found = lore.ore.resourceStore.findExact('uri',resURI);
    lore.debug.ore("found? " + found);
    if (found != -1){
        detailscombo.setValue(resURI);
        lore.ore.loadResourceDetails(detailscombo, lore.ore.resourceStore.getAt(found),found);
    
        // find pname in tree
        var propnode = lore.ore.ui.resproptreeroot.findChild('id',pname);
        if (propnode){
            propnode.select();
        }
        // set value to val
        if (val) {
            Ext.getCmp("detaileditor").setValue(val);
        }
    }
    // call updateResDetails
    } catch  (e){
        lore.debug.ore("problem in editResDetail",e);
    }
};

lore.ore.populateResourceDetailsCombo = function (){
    if (!Ext.getCmp("remresedit")){
        return;
    }
    // add compound object
    lore.ore.resourceStore.loadData([["Current Compound Object", lore.ore.cache.getLoadedCompoundObjectUri(), "Current Compound Object (" + lore.ore.cache.getLoadedCompoundObjectUri() + ")"]]);
    // add all resources in compound object
    var allfigures = lore.ore.ui.graphicalEditor.coGraph.getDocument().getFigures().data;
    allfigures.sort(lore.ore.ui.graphicalEditor.figSortingFunction);
    for (var i = 0; i < allfigures.length; i++) {
        var fig = allfigures[i];
        if (fig instanceof lore.ore.ui.graph.ResourceFigure){
            var title = fig.metadataproperties["dc:title_0"] 
                || fig.metadataproperties["dcterms:title_0"] 
                || "Untitled Resource";
            lore.ore.resourceStore.loadData([[title,fig.url,title + " ("+ fig.url +")"]],true);
        }
    }
    Ext.getCmp("resselectcombo").setValue(lore.ore.cache.getLoadedCompoundObjectUri());
    lore.ore.loadResourceDetails(Ext.getCmp("resselectcombo"), lore.ore.resourceStore.getAt(0),0);
}
// TODO: refactor to use model classes
/**
 * Load properties and relationships for a resource into the Resource Details view
 * @param {} combo
 * @param {} record
 * @param {} index
 */
lore.ore.loadResourceDetails = function(combo,record,index){
    lore.global.ui.clearTree(lore.ore.ui.resproptreeroot);
    lore.global.ui.clearTree(lore.ore.ui.resreltreeroot);
    var tmpNode;
    var resurl = record.data.uri;
    if (resurl == lore.ore.cache.getLoadedCompoundObjectUri()){
        // it's the current compound object - load props from the grid
        lore.ore.ui.grid.store.each(function (rec){
            var propname = rec.id.substring(0,rec.id.indexOf("_"));
            if (propname != "rdf:about"){
	            tmpNode = new Ext.tree.TreeNode({
                    id: rec.id,
	                text: propname,
	                value: rec.data.value,
	                leaf: true
	            });
	            lore.ore.ui.resproptreeroot.appendChild(tmpNode);
	            tmpNode.on("beforeclick",lore.ore.updateResDetails);
            }
        });
    } else {
        // it's a resource - get the props and rels from the figure
	    var fig = lore.ore.ui.graphicalEditor.lookupFigure(resurl);
	    if (fig){
	            for (p in fig.metadataproperties){
	                var pname = p;
	                var pidx = p.indexOf("_");
	                if (pidx != -1){
	                    pname = p.substring(0,pidx);
	                }
                    if (pname != "dc:format" && pname != "resource"){
		                tmpNode = new Ext.tree.TreeNode({
		                    id: p,
		                    text: pname,
		                    leaf: true,
		                    value: fig.metadataproperties[p]
		                });
		                lore.ore.ui.resproptreeroot.appendChild(tmpNode);
		                tmpNode.on("beforeclick",lore.ore.updateResDetails);
                    }
	            }
	            
	            var ports = fig.getPorts();
	            
	            for (var port = 0; port < ports.getSize(); port++){
	                var connections = ports.get(port).getConnections();
	                
	                for (var j = 0; j < connections.getSize(); j++) {
	                    var theconnector = connections.get(j);
	                    var linkedres;
	                    var cls;
	                    if (resurl == lore.global.util.escapeHTML(theconnector.sourcePort.parentNode.url)){
	                        // it's an outgoing connection
	                        linkedres=lore.global.util.escapeHTML(theconnector.targetPort.parentNode.url);
	                        cls = "rel-out";
	                    }else{
	                        // incoming connection
	                        linkedres = lore.global.util.escapeHTML(theconnector.sourcePort.parentNode.url);
	                        cls = "rel-in";
	                    }
	                    var relpred = theconnector.edgetype;
	                    var relns = theconnector.edgens;
	                    
	                    tmpNode = new Ext.tree.TreeNode({
	                        text: relpred,
	                        value: linkedres,
	                        leaf: true,
	                        iconCls: cls
	                    });
	                    lore.ore.ui.resreltreeroot.appendChild(tmpNode);
	                    tmpNode.on("beforeclick",lore.ore.updateResDetails);
	                }
	                
	            }   
        }
        
    }
    lore.ore.ui.resreltreeroot.expand();
    lore.ore.ui.resproptreeroot.expand();
    if (lore.ore.ui.resproptreeroot.firstChild){
        lore.ore.ui.resproptreeroot.firstChild.select();
        lore.ore.updateResDetails(lore.ore.ui.resproptreeroot.firstChild,null);
    }
};
