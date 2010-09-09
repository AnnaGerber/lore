/**
 * @class lore.ore.Controller Handles user actions (many triggered from toolbar, menus in overlay.js) and updates model and ui
 * */
lore.ore.Controller = function(config){
    /** The URL of the active tab in the main web browser */
    this.currentURL = config.currentURL || "";
    /** Indicates whether the controller is actively responding to user actions (it is not active when LORE is closed) */
    this.active = false;
    /** The name of the default creator used for new compound objects (from preferences) */
    this.defaultCreator = "Anonymous";
    /** @private The URL for which related compound objects were most recently loaded */
    this.loadedURL;
	/** Property name displayed for the compound object identifier */
    this.REM_ID_PROP = "Compound Object ID";

};
Ext.apply(lore.ore.Controller.prototype, {

    /** Activate Controller and trigger related compound objects to be fetched when lore Compound Objects panel is shown */
    onShow: function(){
        this.active = true; 
        if (this.currentURL && this.currentURL != 'about:blank' && this.currentURL != '' &&
        (!this.loadedURL || this.currentURL != this.loadedURL)) {
            if (lore.ore.reposAdapter){
                lore.ore.reposAdapter.getCompoundObjects(this.currentURL);
            }
            this.loadedURL = this.currentURL;
        }
    },
    /** Deactivate controller */
    onHide: function(){
        this.active = false;
    },
    loadCompoundObjectPromptForURL: function(){
    	Ext.Msg.show({
            title : 'Load from RDF/XML URL',
            buttons : Ext.MessageBox.OKCANCEL,
            msg : 'Please enter the URL of the compound object:',
            scope: this,
            fn : function(btn, theurl) {
                if (btn == 'ok') {
                    this.loadCompoundObjectFromURL(theurl);
                }
            },
            prompt : true
        });
    },
    /**
     * Loads a Compound object from a RDf/XML file via URL 
     * @param {String} rdfURL The direct URL to the RDF (eg restful web service on repository that returns RDF)
     */
    loadCompoundObjectFromURL: function(rdfURL){
    	try{
    		
            // Check if the currently loaded compound object has been modified and if it has prompt the user to save changes
            var currentCO = lore.ore.cache.getLoadedCompoundObject();
            if (currentCO && currentCO.isDirty()){
                Ext.Msg.show({
                    title : 'Save Compound Object?',
                    buttons : Ext.MessageBox.YESNOCANCEL,
                    msg : 'Would you like to save the current compound object before proceeding?<br><br>Any unsaved changes will be lost if you select "No".',
                    fn : function(btn) {
                        if (btn === 'yes') {
                            var currentCO = lore.ore.cache.getLoadedCompoundObject();
                            // TODO: #56 check that the save completed successfully 
                            var remid = currentCO.uri;
                            // TODO: this should be handled by repository adapter
                            var therdf = currentCO.toRDFXML(false);
                            lore.ore.reposAdapter.saveCompoundObject(remid,therdf,function(){
                                lore.ore.controller.afterSaveCompoundObject(remid);
	                             Ext.MessageBox.show({
	            	                    msg: 'Loading compound object',
	            	                    width:250,
	            	                    defaultTextHeight: 0,
	            	                    closable: false,
	            	                    cls: 'co-load-msg'
	            	             });
	            	             if (lore.ore.reposAdapter){
	            	                 lore.ore.reposAdapter.loadCompoundObject(rdfURL, lore.ore.controller.loadCompoundObject, lore.ore.controller.afterLoadCompoundObjectFail);
	            	             } 
                            });
                            
                        } else if (btn === 'no') {
                        	Ext.MessageBox.show({
        	                    msg: 'Loading compound object',
        	                    width:250,
        	                    defaultTextHeight: 0,
        	                    closable: false,
        	                    cls: 'co-load-msg'
        	             });
        	             if (lore.ore.reposAdapter){
        	                 lore.ore.reposAdapter.loadCompoundObject(rdfURL, lore.ore.controller.loadCompoundObject, lore.ore.controller.afterLoadCompoundObjectFail);
        	             }
                        }
                    }
                });
            } else {
	            Ext.MessageBox.show({
	                    msg: 'Loading compound object',
	                    width:250,
	                    defaultTextHeight: 0,
	                    closable: false,
	                    cls: 'co-load-msg'
	             });
	             if (lore.ore.reposAdapter){
	                 lore.ore.reposAdapter.loadCompoundObject(rdfURL, this.loadCompoundObject, this.afterLoadCompoundObjectFail);
	             }
            }
    
        } catch (e){
            lore.debug.ore("Error in loadCompoundObjectFromURL",e);
        }
        
    },
    /**
     * Load a compound object into LORE
     * @param {} rdf XML doc or XML HTTP response containing the compound object (RDF/XML)
     */
    loadCompoundObject: function(rdf){
        try {
           var appendPropertyValue = function(propname, propval, grid){
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
            lore.debug.startTiming();
            var showInHistory = false;
            
                // reset the graphical view
                lore.ore.ui.graphicalEditor.initGraph();
                
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
                    lore.ore.ui.vp.warning("No compound object found");
                    lore.debug.ore("no remurl found in RDF",loadedRDF);
                    lore.debug.ore("the input rdf was",rdf); 
                }
                // TODO: listen to model object
                //lore.debug.timeElapsed("loading into grid ");
                
               lore.debug.ore("controller rem id prop is " + lore.ore.controller.REM_ID_PROP);
                lore.ore.ui.grid.store.loadData([
                    {id:"rdf:about_0", name: lore.ore.controller.REM_ID_PROP, value: remurl}
                ]);
                loadedRDF.about('<' + remurl + '>')
                    .each(function(){
                        var propurl = this.property.value.toString();
                        var propsplit = lore.global.util.splitTerm(propurl);
                        var propname = lore.constants.nsprefix(propsplit.ns) + ":";
                        if (propname){
                            propname = propname + propsplit.term;
                        } else {
                            propname = propurl;
                        }
                        if (propname != "ore:describes" && propname != "rdf:type"){
                            appendPropertyValue(propname, this.value.value.toString(), lore.ore.ui.grid);
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
                    .optional('?url layout:abstractPreview ?abstractPreview')
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
                            	var prefix = lore.constants.nsprefix(relresult.ns);
                            	if (!(prefix == "rdf" && relresult.term == "type")){
                            		srcfig.appendProperty(prefix + ":" + relresult.term, obj);
                            	}
                                if ((prefix == "dc" || prefix == "dcterms") && relresult.term == "title") {
                                    // TODO this should not be necessary - send props to addFigureWithOpts
                                    srcfig.setTitle(obj);
                                } else if (prefix == "dcterms" && relresult.term == "abstract") {
                                	srcfig.setAbstract(obj);
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
                lore.ore.ui.graphicalEditor.bindModel(lore.ore.cache.getLoadedCompoundObject());
                lore.ore.ui.vp.info("Loading compound object");
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
                    var title = lore.ore.ui.grid.getPropertyValue("dc:title") ||
                        lore.ore.ui.grid.getPropertyValue("dcterms:title");
                    if (!title){
                        title = "Untitled";
                    }
                    lore.ore.historyManager.addToHistory(remurl, title);  
               }
               if (lore.ore.ui.topView && lore.ore.ui.graphicalEditor.lookup[lore.ore.controller.currentURL]){
                    lore.ore.ui.topView.hideAddIcon(true);
               } else {
                    lore.ore.ui.topView.hideAddIcon(false);
               }
               //lore.debug.timeElapsed("done");
               var readOnly = !remurl.match(lore.ore.reposAdapter.idPrefix);
               Ext.getCmp('currentCOMsg').setText(Ext.util.Format.ellipsis(title, 50) + (readOnly? ' (read-only)' : ''),false);
            } catch (e){
                lore.ore.ui.vp.error("Error loading compound object");
                lore.debug.ore("exception loading RDF from string",e);
                lore.debug.ore("the RDF string was",rdf);
                lore.debug.ore("the serialized databank is",databank.dump({format:'application/rdf+xml', serialize: true}));
            }
    },
    /** Prompt whether to save the current compound object, then calls newCO to create new compound object */
    createCompoundObject: function(dontRaise){
        try{
            // Check if the currently loaded compound object has been modified and if it has prompt the user to save changes
            var currentCO = lore.ore.cache.getLoadedCompoundObject();
            if (currentCO && currentCO.isDirty()){
                Ext.Msg.show({
                    title : 'Save Compound Object?',
                    buttons : Ext.MessageBox.YESNOCANCEL,
                    msg : 'Would you like to save the compound object before proceeding?<br><br>Any unsaved changes will be lost if you select "No".',
                    //msg: 'Any unsaved changes to the current compound object will be lost. Would you like to continue anyway?',
                    fn : function(btn) {
                        if (btn === 'yes') {
                            var currentCO = lore.ore.cache.getLoadedCompoundObject();
                            // TODO: #56 check that the save completed successfully before calling newCO
                            var remid = currentCO.uri;
                            // TODO: this should be handled by repository adapter
                            var therdf = currentCO.toRDFXML(false);
                            lore.ore.reposAdapter.saveCompoundObject(remid,therdf,function(){
                                lore.ore.controller.afterSaveCompoundObject(remid);
                                lore.ore.controller.newCO(dontRaise);  
                            });
                            
                        } else if (btn === 'no') {
                            lore.ore.controller.newCO(dontRaise);
                        }
                    }
                });
            } else {
                this.newCO(dontRaise);
            }
    
        } catch (e){
            lore.debug.ore("Error in createCompoundObject",e);
        }
        
    },

    /**
     * Create new Compound object
     * @param {} dontRaise
     */
    newCO : function(dontRaise){
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
            {id:"rdf:about_0", name: lore.ore.controller.REM_ID_PROP, value: currentREM},
            {id: "dc:creator_0", name: "dc:creator", value: lore.ore.controller.defaultCreator},
            {id: "dcterms:modified_0", name: "dcterms:modified", value: cDate},
            {id:"dcterms:created_0", name:"dcterms:created",value: cDate},
            {id: "dc:title_0", name: "dc:title", value: ""}
        ]  
        );
        lore.ore.ui.graphicalEditor.initGraph();
        lore.ore.ui.graphicalEditor.bindModel(lore.ore.cache.getLoadedCompoundObject());
        Ext.getCmp('currentCOMsg').setText('New compound object');
        if (!dontRaise) {
            Ext.getCmp("propertytabs").activate("properties");
        }
        
    }, 
    /**
    * Delete the compound object that is loaded
    */
    deleteCompoundObjectFromRepository: function(aURI, aTitle){
        var remid = aURI;
        var title = aTitle;
        if (!remid){
            remid = lore.ore.ui.grid.getPropertyValue(lore.ore.controller.REM_ID_PROP);
            title = lore.ore.ui.grid.getPropertyValue("dc:title") 
                || lore.ore.ui.grid.getPropertyValue("dcterms:title");
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
                    lore.ore.reposAdapter.deleteCompoundObject(remid,function(deletedrem){
                            try{
                            if (lore.ore.cache.getLoadedCompoundObjectUri() == deletedrem){
                                lore.ore.cache.setLoadedCompoundObjectUri("");
                                lore.ore.ui.graphicalEditor.coGraph.clear();
                                lore.ore.controller.createCompoundObject(); 
                            }
                            lore.ore.coListManager.remove(deletedrem);
                            lore.ore.historyManager.deleteFromHistory(deletedrem);
                            lore.ore.ui.vp.info("Compound object deleted");
                        } catch (ex){
                            lore.debug.ore("Error after deleting compound object",ex);
                        }
                    });
                }
            }
        });
    },
    /**
    * Save the compound object to the repository - prompt user to confirm
    */
    saveCompoundObjectToRepository: function(){
        // TODO: compare new compound object with contents of rdfquery db that stores initial state - don't save if unchanged
        // update rdfquery to reflect most recent save
        var remid = lore.ore.ui.grid.getPropertyValue(lore.ore.controller.REM_ID_PROP);
        var title = lore.ore.ui.grid.getPropertyValue("dc:title") 
            || lore.ore.ui.grid.getPropertyValue("dcterms:title") 
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
                    var therdf = lore.ore.cache.getLoadedCompoundObject().toRDFXML(false);
                    lore.ore.reposAdapter.saveCompoundObject(remid,therdf,lore.ore.controller.afterSaveCompoundObject);
                }
            }
        });
    },
    /** Recover from failure to load compound object 
     * @param {} resp
     * @param {} opt
     */
    afterLoadCompoundObjectFail : function(resp,opt){
        lore.debug.ore("Unable to load compound object " + opt.url, resp);
        lore.ore.ui.vp.error("Unable to load compound object");
        lore.ore.controller.createCompoundObject(true);
        Ext.Msg.hide();
    },
    /** Add saved compound object to the model lsits
      * @param {String} remid The compound object that was saved */
    afterSaveCompoundObject : function(remid){
        lore.ore.cache.setLoadedCompoundObjectIsNew(false);
        lore.ore.ui.graphicalEditor.isDirty = false;
        var title = lore.ore.ui.grid.getPropertyValue("dc:title") 
            || lore.ore.ui.grid.getPropertyValue("dcterms:title") 
            || "Untitled";
        var coopts = {
                'uri': remid,
                'title': title,
                'creator': lore.ore.ui.grid.getPropertyValue("dc:creator"),
                'modified': lore.ore.ui.grid.getPropertyValue("dcterms:modified")
        };
        // If the current URL is in the compound object, show in related compound objects
        if (lore.ore.ui.graphicalEditor.lookup[lore.ore.controller.currentURL]){
           lore.ore.coListManager.add([coopts]);
        }
        lore.ore.historyManager.addToHistory(remid, title);  
    },
    /** Prompt for location to save serialized compound object and save as file
    * @param {String} format The format to which to serialize (rdf, wordml, foxml or trig)
    */
    exportCompoundObject: function(format){
        var fileExtensions = {
            "rdf": "xml",
            "wordml": "xml",
            "foxml": "xml",
            "trig": "txt",
            "json": "txt"
        };
        try {
            format = format || "rdf"; // default value
            var fObj = lore.global.util.writeFileWithSaveAs("Export Compound Object as", 
                fileExtensions[format], 
                function(){
                    return lore.ore.cache.getLoadedCompoundObject().serialize(format);
                },
                window
            );
            if ( fObj ) {
                lore.ore.ui.vp.info("Successfully saved Compound Object data to " +fObj.fname);
            }                                           
        } catch (e) {
            lore.debug.ore("Error saving Compound Objects data: " + e,e );
            lore.ore.ui.vp.error("Error saving Compound Object: " + e);
        }
    
    },
    addResourceWithPrompt: function(){
    	Ext.Msg.show({
            title : 'Add resource URL',
            buttons : Ext.MessageBox.OKCANCEL,
            msg : 'Please enter the URL of the resource:',
            scope: this,
            fn : function(btn, theurl) {
                if (btn == 'ok') {
                    this.addResource(theurl);
                }
            },
            prompt : true
        });
    },
    /**
     * Add a resource to the compound object
     * @param {} theURL
     * @param {} props
     */
    addResource: function(uri,props){      
        // TODO: #34 MVC:  make it add to model and get view to listen on model
        lore.ore.ui.graphicalEditor.addFigure({url:uri, props: props});
    },
    /** Add a bunch of resources from open browser tabs
     * @param {} thebrowser Provided by overlay: represents the tabbed browser
     */
    addFromTabs: function(thebrowser) {
    	try{
    	var num = thebrowser.browsers.length;
	    if (num == 0) {return;}
	    var formitems = [{
	    	xtype: 'label',
	    	anchor: '100%',
	    	text: 'Add the following resources to the Compound Object:'
	    }];
	    for (var i = 0; i < num; i++) {
	        var b = thebrowser.getBrowserAtIndex(i);
	        var burl = b.currentURI.spec;
	        var globalHistory = Components.classes["@mozilla.org/browser/global-history;2"].
            	getService(Components.interfaces.nsIGlobalHistory2);
	        var title  = globalHistory.getPageTitle(b.currentURI);
	        if (title) {
	        	title = Ext.util.Format.ellipsis(title,100);
	        }
	        if (burl != "about:blank"){
	        	formitems.push({
	        		xtype: "checkbox",
	        		name: burl,
	        		boxLabel: title || burl,
	        		checked: true,
	        		anchor: "100%"
	        	});
	        }
	    }
	    var win = new Ext.Window({
	        layout      : 'fit',
	        width       : 600,
	        height      : 300,
	        autoScroll: true,
	        items: formitems,
	        title: 'Add resources from browser tabs',
	        buttons: [{
		        text     : 'OK',
		        handler: function(){
		        	win.hide();
		        	Ext.MessageBox.show({
	                    msg: 'Adding resources',
	                    width:250,
	                    defaultTextHeight: 0,
	                    closable: false,
	                    cls: 'co-load-msg'
		        	});
		        	lore.ore.ui.graphicalEditor.coGraph.commandStack.startCommandGroup();
			        win.items.each(
			        	 function(item, index, length){      		 
			        		 if (index > 0 && item.getValue()){
			        			 // add them as collapsed nodes
			        			 lore.ore.ui.graphicalEditor.addFigure({url:item.getName(),
			        				 oh: 170,
			        				 w: 220,
			        				 h: 70,
			        				 props: {title: item.label}});
			        			
			        		 }	   		 
			        });
			        lore.ore.ui.graphicalEditor.coGraph.commandStack.endCommandGroup();
			        Ext.MessageBox.hide();
		            
		        }
	        },{
		        text     : 'Cancel',
		        handler  : function(){
		            win.hide();
		        }
	        }, {
	        	text : 'Select all',
	        	handler: function(){
	        		win.items.each(function(item,index,length){
	        			if (index > 0){
	        				item.setValue(true);
	        			}
	        		});
	        	}
	        }, {
	        	text : 'Deselect all',
	        	handler: function(){
	        		win.items.each(function(item,index,length){
	        			if (index > 0){
	        				item.setValue(false);
	        			}
	        		});
	        	}
	        }]
	    });
	    
	    win.show();
	    // work around scrolling content over iframe bug by redrawing
	    win.body.on("scroll",function(e,t,o){this.repaint();},win.body);
    	} catch (e){
    		lore.debug.ore("problem adding from tabs",e);
    	}
    },
    /** Handle search */
    search : function (searchuri, searchpred, searchval){
        if (!searchuri && !searchpred && !searchval){
            // blank search searches for all compound objects for now (not scalable!)
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
            //.setDetails(searchTerms);

            // onBeforeLoad triggers display of loading message
            Ext.getCmp('cosview').onBeforeLoad();
            lore.ore.reposAdapter.getCompoundObjects(searchuri, searchpred,searchval,true);
        } catch (e){
            lore.debug.ore("Controller: exception in search",e);
        }
    },
    /** Triggered when extension preferences change (eg user updates preferences).
     *  Always handled regardless of whether controller is active 
     *  @param {Object} prefs The updated prefrence values */
    handlePreferencesChanged: function(prefs){
      try{ 
          this.defaultCreator = prefs.creator;
          var om = lore.ore.ontologyManager;
          if (om){
            om.loadOntology(prefs.relonturl);
          } 
          //Disabled for now
          //lore.ore.textm.tmkey = prefs.tmkey;
          this.setRepos(prefs.rdfrepos, prefs.rdfrepostype, prefs.annoserver);
          lore.global.util.setHighContrast(window, prefs.high_contrast);
      } catch (e){
        lore.debug.ore("Controller: Problem handling changed preferences",e);
      }
    },
    /**
     * Set the compound object repository: typically triggered after user updates preferences
     *
     * @param {String} rdfrepos The repository access URL
     * @param {String} rdfrepostype The type of the repository (eg sesame, fedora)
     * @param {String} annoserver The annotation server access URL
     */
    setRepos : function(/*String*/rdfrepos, /*String*/rdfrepostype, /*String*/annoserver){
        /** The access URL of the annotation server */
        this.annoServer = annoserver;
        
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
            title = lore.ore.ui.grid.getPropertyValue("dc:title") ||
                lore.ore.ui.grid.getPropertyValue("dcterms:title");
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
            var currentCO = lore.ore.cache.getLoadedCompoundObject();
            if (currentCOMsg) {
            	currentCOMsg.setText(Ext.util.Format.ellipsis(title, 50) + ' (read-only)',false);
            }
            if (currentCO.isDirty()){
                lore.debug.ore("setRepos: dirty");
                Ext.Msg.show({
                    title : 'Save Compound Object?',
                    buttons : Ext.MessageBox.YESNO,
                    msg : 'The default Compound Object repository preferences have been changed. <br>You will be able to view the current compound object in read-only mode, however you will not be able to save changes unless the repository preferences are changed back to the repository that contains this compound object. <br><br>Would you like to save your changes before proceeding?',
                    fn : function(btn, theurl) {
                        if (btn == 'yes') {
                            // TODO: #56 check that the save completed successfully?
                            var remid = currentCO.uri;
                            var therdf = currentCO.toRDFXML(false);
                            lore.ore.reposAdapter.saveCompoundObject(remid,therdf,function(){
                                lore.ore.controller.afterSaveCompoundObject(remid);
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
            lore.ore.reposAdapter = new lore.ore.repos.SesameAdapter(rdfrepos);
        } else if (rdfrepostype == 'fedora'){
            lore.ore.reposAdapter = new lore.ore.repos.FedoraAdapter(rdfrepos);
        }else {
            lore.ore.ui.vp.warning("Not yet implemented: change your repository type preference");
        }
        if (isEmpty) {
                // empty compound object, reset it to get a new id
                lore.debug.ore("setrepos: empty");
                this.newCO(true);
        }
        // Reload history so that compound objects from other repositories are marked as read-only
        if (lore.ore.historyManager){
            lore.ore.historyManager.onEndUpdateBatch();
        }
        if (lore.ore.reposAdapter){
            // Trigger reposAdapter to get related compound objects
            lore.ore.reposAdapter.getCompoundObjects(this.currentURL);
        }
        
        // Reset the search results and explore view
        if (lore.ore.coListManager){
            lore.ore.coListManager.clear("search");
            //lore.ore.ui.searchtreeroot.setDetails([]);
        }
        if (lore.ore.explorePanel && lore.ore.cache){
            lore.ore.explorePanel.showInExploreView(lore.ore.cache.getLoadedCompoundObjectUri(),"Current Compound Object",true);
        }
    },
    /** Triggered when the user navigates to a different page in the browser, or switches between tabs.
     *  Only handled when controller is active
     *  @param {String} contextURL The new URL */
    handleLocationChange : function (contextURL) {
        this.currentURL = lore.global.util.preEncode(contextURL);
        //var uri = lore.global.util.makeURI(this.currentURL);
        //lore.debug.ore("loaded " + this.currentURL, uri.asciiSpec);

        if (!this.active){
            return;
        }
        if (lore.ore.reposAdapter){
            // Trigger reposAdapter to get related compound objects
            lore.ore.reposAdapter.getCompoundObjects(this.currentURL);
        }
        this.loadedURL = this.currentURL; 
    },
    /** Asks the model whether theURL is aggregated by the current compound object. 
     *  Used by overlay to determine whether to update the url-bar icon after user has browsed to new location
     *  @param {String} theURL 
     *  @return boolean */
    isInCompoundObject : function(theURL){
        // TODO: delegate to model
        var isInCO = typeof(lore.ore.ui.graphicalEditor.lookup[theURL]) !== 'undefined';
        return isInCO;
    },
    /** Triggered by user dragging and dropping a URL from the main browser and dropping anywhere on the Compound Objects UI */
    onDropURL: function(sn, aEvent){
        try{
        lore.debug.ore("onDropURL",sn);
        // If sourceNode is not null, then the drop was from inside the application
        // add to compound object if it is a link or image
        if (sn){
                if (sn instanceof HTMLAnchorElement){
                    var sntitle = sn.textContent;
                    var figopts = {
                        url: sn.href,
                        x: Math.max(0,aEvent.layerX),
                        y: Math.max(0,aEvent.layerY)
                    };
                    if (sntitle){
                        figopts.props = {"dc:title_0": sntitle};
                    }
                    lore.ore.ui.graphicalEditor.addFigure(figopts);
                } else if (sn instanceof HTMLImageElement){
                    lore.ore.ui.graphicalEditor.addFigure({url:sn.src});
                } 
                
                return;
          }
        } catch (e){
            lore.debug.ore("Controller: problem in onDropURL",e);
        }
            
    }
});
