/**
 * @singleton
 * @class loreoverlay
 */
try {
    // Load and cache global ui functions
    
    // for naming consistency with other code
    var lore = { global: {} };
    // lore.debug
    Components.utils["import"]("resource://lore/debug.js", lore);  
    // lore.global.ui
    Components.utils["import"]("resource://lore/uiglobal.js", lore.global);
    // lore.global.store
    Components.utils["import"]("resource://lore/annotations/store.js", lore.global);
    
    // lore.global.util
    Components.utils["import"]("resource://lore/util.js", lore.global);
    
    if (!lore.global.ui || !lore.global.store || !lore.debug ) {
        // sanity check
        alert("loreoverlay: Not all js modules loaded.");
    }
    
    lore.debug.initRecentLog();
    
    // consistent access to JSON across versions of FF
    if (typeof(JSON) == "undefined") {  
    	  Components.utils["import"]("resource://gre/modules/JSON.jsm");
    	  JSON.parse = JSON.fromString;
    	  JSON.stringify = JSON.toString;
    }
    
    var loreoverlay = {
        /** The compound objects view */
        coView: function () { 
            return lore.global.ui.compoundObjectView.get(this.instId);
        },
        /** The annotations view */
        annoView: function () { 
            return lore.global.ui.annotationView.get(this.instId);
        },
        /** Location listener to listen for browser page events */
        oreLocationListener: {
            
            QueryInterface: function(aIID){
                if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports)) 
                    return this;
                throw Components.results.NS_NOINTERFACE;
            },
            
            /** 
             * Respond to the URL loaded in the browser changing  
             * @param {} aProgress
             * @param {} aRequest
             * @param {} aURI
             */
             
            onLocationChange: function(aProgress, aRequest, aURI){
                var updateURI = "about:blank";
                try {
                    if (aURI) {
                        updateURI = aURI.spec;
                    }
                    var co = loreoverlay.coView();
                    var an = loreoverlay.annoView();
                    if (lore.global.ui.compoundObjectView.loaded(loreoverlay.instId)){
                        // If the URL is not in the current compound object, show the add url icon
                        var hideAdd = loreoverlay.coView().isInCompoundObject(updateURI);
                        loreoverlay.hideAddIcon(hideAdd);
                    }
                    
                    if (updateURI == lore.global.ui.getCurrentURL(loreoverlay.instId)) {
                        if ( co && co.refreshPage) co.refreshPage();
                        loreoverlay.fireEvent("location_refresh", []);
                        return;
                    }
                    if ( lore.global.ui.compoundObjectView.loaded(loreoverlay.instId)) {
                        lore.global.ui.setCurrentURL(loreoverlay.instId, updateURI);
                        co.handleLocationChange(updateURI);
                        loreoverlay.fireEvent("location_changed", [updateURI]);
                    }
                } catch(e) {
                    alert("loreoverlay.onLocationChange: " + e + " " +  e.stack);
                }
            },
            /** 
             * Respond to a page loading in the browser 
             * @param {} aProgress
             * @param {} aRequest
             * @param {} stateFlags
             * @param {} status
             * */
            onStateChange: function(aProgress, aRequest, stateFlags, status){
                var WPL = Components.interfaces.nsIWebProgressListener;
                if (stateFlags & WPL.STATE_IS_DOCUMENT) {
                    //alert("document");
                }
                if (stateFlags & WPL.STATE_IS_NETWORK) { // entire page has loaded
                    if (stateFlags & WPL.STATE_STOP) {
                        //lore.global.ui.locationLoaded();
                    }
                }
            },
            onProgressChange: function(){
            },
            onStatusChange: function(){
            },
            onSecurityChange: function(){
            },
            onLinkIconAvailable: function(){
            }
        },
        /**
         * The URL that was previously visisted
         */
        oldURL: null,
        /**
         * Initialization code performed onLoad
         */
        onLoad: function(){
            try {
                this.instId = lore.global.ui.genInstanceID();
                
                lore.global.ui.topWindowView.registerView(this, this.instId);
                gBrowser.addProgressListener(this.oreLocationListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
                window.addEventListener("close", this.onClose, false); 
                
                this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.lore.");
                this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this.loadGlobalPrefs();  
                
                this.initialized = true;
                this.addEvents(["location_changed", "location_refresh", "tab_changed"]);
                lore.global.ui.load(window, this.instId);
                
                var self = this;
                window.addEventListener("dragover", function(ev){self.onDragOver(ev);}, true);
                
                var container = gBrowser.tabContainer;
                container.addEventListener("TabSelect", this.onTabSelected, false);
                
                var splashVersion = this.prefs.getCharPref("splashVersion");
                try {
                    // Firefox 4
                    Components.utils["import"]("resource://gre/modules/AddonManager.jsm");
                    AddonManager.getAddonByID("lore@maenad.itee.uq.edu.au", function(addon) {              
                        var version = addon.version;
                        if (version != splashVersion){
                            // show info page for LORE
                            lore.global.util.launchTab("http://itee.uq.edu.au/~eresearch/projects/aus-e-lit/loreupdated.php?version=" + version,window);
                            loreoverlay.prefs.setCharPref("splashVersion", version);
                        }   
                        loreoverlay.version = version; 
                  });
                } catch (ex) {
                    // Firefox 3.6 and earlier
                    var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                       .getService(Components.interfaces.nsIExtensionManager);
                    this.version = gExtensionManager.getItemForID("lore@maenad.itee.uq.edu.au").version;
                    if (this.version != splashVersion){
                        // show info page for LORE
                        lore.global.util.launchTab("http://itee.uq.edu.au/~eresearch/projects/aus-e-lit/loreupdated.php?version=" + this.version,window);
                        this.prefs.setCharPref("splashVersion", this.version);
                    }
                } 
                this.prefs.addObserver("", this, false);
            } 
            catch (e) {
                alert("loreoverlay.onLoad: " + e + "\n" + e.stack);
            }
        },
        
        /**
         * Trigger save changes if closing
         * @param {} subject
         * @param {} topic
         * @param {} data
         */
        onClose: function(event) {
            try {
                lore.global.ui.onClose(this, loreoverlay.instId);
            } catch(e) {
                lore.debug.ui("loreoverlay.onClose",e);
            }
        },
        
        /**
         *
         */
        onTabSelected: function(event) {
            var browser = gBrowser.selectedBrowser;
            loreoverlay.fireEvent("tab_changed", [browser]);
        },
        getAuthManager: function(){
          return this.authManager;  
        },
        setAuthManager: function(am){
          if (!this.authManager){
            this.authManager = am;
            this.authManager.on('signedin', this.setSignedIn, this);
            this.authManager.on('signedout', this.setSignedOut, this);
          }
          return this.authManager;
        },
        /** 
         * Observe if preferences have changed 
         * @param {} subject
         * @param {} topic
         * @param {} data
         **/
        observe: function(subject, topic, data){
            try {
                
                if (topic != "nsPref:changed") {
                    return;
                }
                
                this.loadGlobalPrefs();
                if (this.coView()){
                    this.loadCompoundObjectPrefs();
                }
                if (this.annoView()){
                    this.loadAnnotationPrefs();
                }
            } catch (e ) {
                lore.debug.ui("Error updating preferences on prefs change", e);
            }
            
        },
        /**
         * Tear down code to remove progress listener and perform ui unloading
         * Handles window.onunload event 
         */
        unLoad: function(){
            if ( lore.global.ui.annotationView.loaded(this.instId) || lore.global.ui.compoundObjectView.loaded(this.instId)) {
                gBrowser.removeProgressListener(this.oreLocationListener);
            }
            
            lore.global.ui.onUnLoad(this, loreoverlay.instId);
        },
        /** Support user dragging URLs/files directly from the browser or OS onto LORE */
        onDragOver : function(aEvent){
            var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
            var dragSession = dragService.getCurrentSession();
            var supported = dragSession.isDataFlavorSupported("text/x-moz-url");
            /*if (!supported){
              supported = dragSession.isDataFlavorSupported("application/x-moz-file");
            }*/
            
            // currently only support dragging URLs onto compound objects
            if (supported && aEvent.view.name == 'graphiframe'){
              dragSession.canDrop = true;
            } 
        },
        onDragDrop : function(aEvent){
            var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
            var dragSession = dragService.getCurrentSession();
            this.coView().onDropURL(dragSession.sourceNode, aEvent);
        },
        /** 
         * Toggle LORE visibility when the status bar icon is clicked 
         * @param {} event
         * */
        onClickStatusIcon: function(event){
            this.toggleBar();
        },
        /**
         *  Trigger adding a node to the compound object editor from browser context menu on links
         *  @param {} event
         **/
        onMenuItemCommand: function(event){
            if (gContextMenu.onLink) {
                loreoverlay.coView().addResource(gContextMenu.linkURL, {"dc:title_0": gContextMenu.linkText()});
            }
        },
        /** Show a popup menu with cut/copy/paste in the extension */
        beforeClipMenuPopup: function(event){
            // only enable edit menu within editable fields
            try{
               var contextMenu = new nsContextMenu(this);
               if (!contextMenu.onTextInput){
                    event.preventDefault();
               } 
            } catch (e){
                lore.debug.ui("clip before popup",e);
            }
        },
        onClipMenuPopup: function(event){
            // TODO: disable copy & paste if text is not selected
            // However isTextSelected always returning false for ext grid fields
            var contextMenu = new nsContextMenu(this);
            //var textSelected = contextMenu.isTextSelected;
            //document.getElementById('clip-copy').disabled = !textSelected;
            //document.getElementById('clip-cut').disabled = !textSelected;
            //document.getElementById('clip-paste').disabled = !contextMenu.onTextInput
        },
        /** 
         * Show a context menu in the browser on images, links and background images, 
         * for creating nodes in compound object editor and annnotations.
         * Menu options are enabled even if lore is closed to allow adding nodes while browsing.
         * Menu options are hidden for disabled components.
         * @param {] event
         * */
        onMenuPopup: function(event){
            try {
                if (!this.prefs.getBoolPref("disable_annotations")){
                    if (typeof loreoverlay.annoView().getCurSelImage == 'function'){
                        var img = loreoverlay.annoView().getCurSelImage();
                        var imgSelArea = document.popupNode.getAttribute("_lore_imgareaselect");
                        
                        gContextMenu.showItem('addanno-lore', gContextMenu.isContentSelected || (  imgSelArea  && img));
                        gContextMenu.showItem('modannosel-lore', (gContextMenu.isContentSelected || (  imgSelArea && img)) &&
                            (loreoverlay.annoView().getCurrentEditedAnno() != null));
                    }
                } else {
                    gContextMenu.showItem('addanno-lore',false);
                    gContextMenu.showItem('modannosel-lore',false);
                }
                if (!this.prefs.getBoolPref("disable_compoundobjects")){
                    gContextMenu.showItem('addimage-lore', gContextMenu.onImage);
                    gContextMenu.showItem('addlink-lore', gContextMenu.onLink);
                    gContextMenu.showItem('addbgimg-lore', gContextMenu.hasBGImage);
                    gContextMenu.showItem('oaioresep', gContextMenu.onImage || gContextMenu.onLink || gContextMenu.hasBGImage);
                } else {
                    gContextMenu.showItem('addimage-lore', false);
                    gContextMenu.showItem('addlink-lore', false);
                    gContextMenu.showItem('addbgimg-lore', false);
                    gContextMenu.showItem('oaioresep', false);
                }
            } catch (e) {
                lore.debug.ui("loreoverlay.onMenuPopup",e);
            }
        },
        
        /** Begin selecting a region of the image to highlight for an annotation 
         * 
         * @param {Object} event
         */
        selImageMenuItemCommand: function(event) {
            //TODO: Security risk? document.popupNode?
            try {
                loreoverlay.annoView().handleBeginImageSelection(document.popupNode);
            } catch (e ) {
                lore.debug.ui("image selection failed", e);
            }
        },
        /** Trigger adding a node to the compound object editor from browser context menu on images */ 
        addImageMenuItemCommand: function(e){
            if (gContextMenu.onImage) {
                var props = {"dc:source_0": gContextMenu.browser.currentURI.spec};
                if (gContextMenu.onLink){
                    props["dc:relation_0"] = gContextMenu.linkURL;
                }
                loreoverlay.coView().addResource(gContextMenu.imageURL, props);
            }
        },
        /** Trigger adding a node to the compound object editor from browser context menu on background images */
        addBGImageMenuItemCommand: function(e){
            if (gContextMenu.hasBGImage) {
                loreoverlay.coView().addResource(gContextMenu.bgImageURL,{"dc:source_0": gContextMenu.browser.currentURI.spec});
            }
        },
        /** Toggle LORE visibility when LORE menu item is selected */
        onToolbarMenuCommand: function(e){
            this.toggleBar();
        },
        
        /** Toggle the visibility of LORE */
        toggleBar: function(forceVisible){
            try {
                var toolsMenuItem = document.getElementById('lore-tools-item');
                var annoContentBox = document.getElementById('oobAnnoContentBox');
                var contentBox = document.getElementById('oobContentBox');
                
                lore.global.ui.setCurrentURL(loreoverlay.instId,gBrowser.currentURI.spec);
                if (!forceVisible && (annoContentBox.getAttribute("collapsed") == "false" || contentBox.getAttribute("collapsed") == "false")){
                   toolsMenuItem.removeAttribute("checked");
                    this.setAnnotationsVisibility(false);
                    this.setCompoundObjectsVisibility(false);
                } else {
                   toolsMenuItem.setAttribute("checked", "true");
                   this.setAnnotationsVisibility(true);
                   this.setCompoundObjectsVisibility(true);
                   
                   // trigger events to be fired that will allow annotations/compound objects to update
                   this.authManager.isAuthenticated();
                }
            } catch (e ) {
                lore.debug.ui("loreoverlay.toggleBar",e);
            }
        },
        /** Compound Objects Toolbar button handler: Triggers loading compound object RDF from a URL **/
        loadRDFURL: function(){
            loreoverlay.coView().loadCompoundObjectPromptForURL();
        },
        
        loadAnnoRDF: function () {
            loreoverlay.annoView().handleImportRDF();
        },
        
        /** Compound Objects Toolbar button handler: Allow the user to choose an RDF/XML file describing a compound object and display it in the editor */
        loadRDF: function(){
            
            try{
                var fObj =  lore.global.util.loadFileWithOpen("Select Compound Object RDF/XML file", 
                {desc:"RDF documents", filter:"*.rdf"}, window);
                
                if ( fObj) {
                    loreoverlay.coView().loadCompoundObject(fObj.data);
                }
            } catch (e){
                lore.debug.ui("Exception importing compound object from file",e);
            }
        },
        /** Compound Objects toolbar button handler: pop up find window to find text within Compound Object window */
        find: function(){
        	document.getElementById("graphiframe").contentWindow.find("",false, false, true, false, true, true);        	
        },

        /** Annotations Toolbar button handler: Trigger adding an annotation */
        addAnnotation: function(){
            try {
                loreoverlay.annoView().handleAddAnnotation();
            }catch (e ) {
                lore.debug.ui("loreoverlay.addAnnotation",e) ;
            }
        },
        updateAnnotationSel: function (type) {
            try {
                if (type == "variation") 
                    loreoverlay.annoView().handleUpdateVariationAnnotationContext();
                else 
                    loreoverlay.annoView().handleUpdateAnnotationContext();
            }catch (e ) {
                lore.debug.ui("updateAnnotationSel", e);
            }
        },
        login: function () {
            if (this.authManager){
                this.authManager.displayLoginWindow();
            }
        },
        logout: function () {
        	if (this.authManager){
                this.authManager.logout();
            }
        },
        reportProblem: function(){  
            try{ 
              var version = this.version;
              if (!version){
                version = this.prefs.getCharPref("splashVersion");
              }
              var url = "mailto:auselit@gmail.com?subject=Problem%20with%20LORE%20" + version
                + "&Body=Please describe the problem in as much detail as possible, " 
                + "including URLs for the web resources you were working with when the problem occurred:%0A%0A%0A%0A"
                + "Recent activity (this information may assist the developers to diagnose the problem): %0A"
                + lore.debug.getRecentLog();
              document
                .getElementById("content")
                .webNavigation
                .loadURI(url, 0, null, null, null);
            } catch (e){
                lore.debug.ui("loreoverlay.reportProblem",e);
            }
        },
        /** Annotations Toolbar button handler: Trigger removing an annotation */
        removeAnnotation: function() {
            try {
                loreoverlay.annoView().handleDeleteAnnotation();
            } catch (e) {
                lore.debug.ui("loreoverlay.removeAnnotation",e);
            }
        },
        /** Annotations Toolbar button handler: Triger replying to an annotation */
        replyToAnnotation: function () {
            loreoverlay.annoView().handleReplyToAnnotation();
        },
        /** Annotations Toolbar button handler: Trigger saving a modified annotation */
        saveAnnotation: function () {
            loreoverlay.annoView().handleSaveAnnotationChanges();
        },
        /** Annotations Toolbar button handler: Trigger saving all modified annotations */
        saveAllAnnotations: function () {
            loreoverlay.annoView().handleSaveAllAnnotationChanges();
        },
        
        serializeAnnotations: function (format) {
            loreoverlay.annoView().handleSerialize(format);
        },
        
        /** Annotations Toolbar button handler: Trigger highlighting all annotation contexts in the page */
        showAnnotations: function(){
            loreoverlay.annoView().handleToggleAllAnnotations();
        },
        /** Compound Objects Toolbar button handler: Trigger saving the current compound object to the repository */
        saveRDF: function(){
            loreoverlay.coView().saveCompoundObjectToRepository();
        },
        lockRDF: function(){
           loreoverlay.coView().lockCompoundObjectInRepository(); 
        },
        copyRDF: function(){
            loreoverlay.coView().copyCompoundObjectToNew();  
        },
        /** Compound Objects Toolbar button handler: Trigger deleting a compound object from the repository */
        deleteRDF: function(){
            loreoverlay.coView().deleteCompoundObjectFromRepository();
        },
        /** Compound Objects Toolbar button handler: Trigger serializing a compound object to a file
         * @param {String} format The format of the serialization
         */
        serializeREM: function (format) {
            loreoverlay.coView().exportCompoundObject(format);
        },
        /** Compound Object Toolbar button handler: Trigger adding the current URI to the compound object editor */
        addGraphNode: function(prompt){
        	if (prompt){
        		loreoverlay.coView().addResourceWithPrompt();
        	} else {
        		loreoverlay.coView().addResource(window.content.location.href);
        	}
        },
        /** Compound Object Toolbar button handler: Batch add from open tabs */
        addFromTabs: function(){
        	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
        		    .getService(Components.interfaces.nsIWindowMediator);
        	var mainWindow = wm.getMostRecentWindow("navigator:browser");
        	var thebrowser = mainWindow.getBrowser();
        	loreoverlay.coView().addFromTabs(thebrowser);
        },
        addPlaceholder: function(){
          loreoverlay.coView().addPlaceholder();  
        },
        createCompoundObject: function(){
            loreoverlay.coView().createCompoundObject();  
        },
        /** Toolbar button handler: reset the compound objects and annotations views */
        resetUI: function(){
            if (this.authManager){
	            this.authManager.purgeListeners();
	            delete this.authManager;
            }
            lore.global.ui.reset(window, this.instId);
        },
        /** Display the about window */
        openAbout: function(){
            window.open("chrome://lore/content/about.xul", "", "chrome,centerscreen,modal");
        },
        /** Display the preferences window */
        openOptions: function(){
            var instantApply = getBoolPref("browser.preferences.instantApply", false);
            var features = "chrome,titlebar,toolbar,centerscreen,resizable=yes" + (instantApply ? ",dialog=no" : ",modal");
            openDialog("chrome://lore/content/options.xul","", features);
        },
        
        loadGlobalPrefs: function () {
            try {
                var logging = this.prefs.getBoolPref("filelogging");
                lore.debug.enableFileLogger(logging);
                if (this.authManager){
                    this.authManager.reloadEmmetUrls({url: this.prefs.getCharPref("annoserver")});
                }
            } catch (ex) {
            }
        },
        /** Reload preferences for compound objects and disable/enable the compound objects view depending on prefs 
         * @param {boolean} ignoreDisable Don't do anything with the disable preference eg on initial load */
        loadCompoundObjectPrefs: function(ignoreDisable){
            if (this.prefs) {
                var dccreator = this.prefs.getCharPref("dccreator");
                var relonturl = this.prefs.getCharPref("relonturl");
                var rdfrepos = this.prefs.getCharPref("rdfrepos");
                var rdfrepostype = this.prefs.getCharPref("rdfrepostype");
                var annoserver = this.prefs.getCharPref("annoserver");
                var disable_co = this.prefs.getBoolPref("disable_compoundobjects");
                var high_contrast = this.prefs.getBoolPref("high_contrast");
                var tmkey = this.prefs.getCharPref("tmkey");
                var ontologies = this.prefs.getCharPref("ontologies");
                var editor = this.prefs.getCharPref("coeditor");
                if (ontologies){
                	ontologies = JSON.parse(ontologies);
                } 
                loreoverlay.coView().handlePreferencesChanged({
                    creator: dccreator,
                    relonturl: relonturl,
                    rdfrepos: rdfrepos,
                    rdfrepostype: rdfrepostype,
                    annoserver: annoserver,
                    disable: disable_co,
                    tmkey: tmkey,
                    high_contrast: high_contrast,
                    ontologies: ontologies,
                    editor: editor
                });
                if(!ignoreDisable){
                    this.setCompoundObjectsVisibility(!disable_co);
                }
                if (this.authManager){
                    this.authManager.reloadEmmetUrls({url: annoserver});
                }
            } 
        },
        
        loadAnnotationPrefs: function(){
            if (this.prefs) {
                // FIXME: should pass base URL and get annotation code to add /annotea
                var annoserver = this.prefs.getCharPref("annoserver");
                var solr = this.prefs.getCharPref("solr");
                var dccreator = this.prefs.getCharPref("dccreator");
                var high_contrast = this.prefs.getBoolPref("high_contrast");
                var disable = this.prefs.getBoolPref("disable_annotations");
                var mode = this.prefs.getBoolPref("annotationmode");
                var timeout = this.prefs.getIntPref("annocache_timeout") * 1000; // to millis
                var metadataOntologyURL = this.prefs.getCharPref("annotationMetadataOntologyURL");
                var loginUrl = annoserver.replace('annotea', 'account/loggedIn.html');
                
                loreoverlay.annoView().setPrefs({
                    creator: dccreator,
                    url: annoserver + "/annotea",
                    solr: solr,
                    cacheTimeout: timeout,
                    loginUrl: loginUrl,
                    disable: disable,
                    mode: mode, 
                    high_contrast: high_contrast,
                    metadataOntologyURL: metadataOntologyURL
                });
                if (this.authManager){
                    this.authManager.reloadEmmetUrls({url: annoserver});
                }
            }
            else {
                lore.debug.ui("preferences object not loaded, can't read in annotation preferences!");
            }
        },
        
        /*
         * Ext-like Event functions
         */
        fireEvent: function (eventName, args) {
            try {
                
                if (this.events) {
                    
                    var regListeners = this.events[eventName];
                    if (regListeners && regListeners.length > 0) {
                        for (var i = 0; i < regListeners.length; i++) {
                            if ( regListeners[i].callback)
                                regListeners[i].callback.apply(regListeners[i].scope ? regListeners[i].scope : this, args);
                        }
                    }
                }
            } catch (e ) {
                lore.debug.ui("loreoverlay.fireEvent",e);
            }
        },
        
        addEvents: function (eventNames ) {
            if ( !this.events)
                this.events = {};
            if (!eventNames.length)
                eventNames = [eventNames];
            for ( var i =0; i < eventNames.length; i++) {
                    this.events[eventNames[i]] = [];
            }
        },
        
        on : function ( eventName, callback, scope ) {
            if ( this.events && this.events[eventName]) {
                this.events[eventName] = this.events[eventName].concat({
                    callback: callback,
                    scope: scope
                });
            }
        },
        
        un : function (eventName, callback, scope) {
            var evt = this.events[eventName];
            if ( evt ) {
                for ( var i=0; i< evt.length; i++) {
                    if (evt[i].callback == callback && evt[i].scope == scope){
                        evt.splice(i,1);
                        break;
                    }
                }
            }
        },
        
        /** Trigger the relationships ontology to be reloaded */
        loadOntology: function(){
            var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
            var loreprefs = prefservice.getBranch("extensions.lore.");
            var relonturl = loreprefs.getCharPref("relonturl");
            loreoverlay.coView().setOntology(relonturl);
            return true;
        },
        /** Used to provide tooltips for title attributes in HTML inside the chrome window */
        fillInHTMLTooltip: function(tipElement){
            // From http://forums.mozillazine.org/viewtopic.php?f=19&t=561451&start=0&st=0&sk=t&sd=a
            var retVal = false;
            if (tipElement.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") {
                return retVal;
            }
            var XLinkNS = "http://www.w3.org/1999/xlink";
            var titleText = null;
            var XLinkTitleText = null;
            while (!titleText && !XLinkTitleText && tipElement) {
                if (tipElement.nodeType == Node.ELEMENT_NODE) {
                    titleText = tipElement.getAttribute("title");
                    XLinkTitleText = tipElement.getAttributeNS(XLinkNS, "title");
                }
                tipElement = tipElement.parentNode;
            }
            var texts = [titleText, XLinkTitleText];
            var tipNode = document.getElementById("aHTMLTooltip");
            for (var i = 0; i < texts.length; ++i) {
                var t = texts[i];
                if (t && t.search(/\S/) >= 0) {
                    tipNode.setAttribute("label", t.replace(/\s+/g, " "));
                    retVal = true;
                }
            }
            return retVal;
        },
        /**
         * Update the variation splitter
         */
        updateVariationSplitter: function(url,title,show, callBack){
            try {
                
                if (show) {
                    document.getElementById("oobAnnoVarContentSplitter").setAttribute("collapsed", "false");
                    document.getElementById("oobAnnoVarContentBox").setAttribute("collapsed", "false");
                }
                title = title + ': ' + url;
                document.getElementById("oobAnnoVarContentLabel").setAttribute("value", title);
                //document.getElementById("oobAnnoVarContentLabelURL").setAttribute("value", url);

                var iframe = document.getElementById("oobAnnoVarContent");
        
                // location hasn't changed so just call the callback
                if ( iframe.contentWindow.location == url ) {
                    if ( callBack) 
                        callBack();
                    return;
                }
                
                if (callBack) {
                    iframe.addEventListener("load", function variationCallback(){
                        try {
                            callBack();
                            iframe.removeEventListener("load", variationCallback, true);
                        } catch (e ) {
                            lore.debug.anno("Error updateVariationSplitter callback", e);
                        }
                        
                    }, true);
                }

                // Must use .location not the src attriubte of iframe
                // as it's not updated by users action within the iframe
                iframe.contentWindow.location = url;
            } catch ( e ) {
                lore.debug.anno("loreoverlay.updateVariationSplitter",e);
            }
        },
        /**
         * Hide the variation splitter
         */
        hideVariationSplitter: function(){
            try {
                var splitter = document.getElementById("oobAnnoVarContentSplitter");
                if (splitter.getAttribute("collapsed") == "false") {
                    loreoverlay.annoView().hideVariationSplitter();
                    document.getElementById("oobAnnoVarContentSplitter").setAttribute("collapsed", "true");
                    document.getElementById("oobAnnoVarContentBox").setAttribute("collapsed", "true");
                    document.getElementById("oobAnnoVarContentLabel").setAttribute("value", "");
                    document.getElementById("oobAnnoVarContent").setAttribute("src", "about:blank");
                }
            } catch(e) {
                lore.debug.anno("hideVariationSplitter", e);
            }
        },
        hideAddIcon: function(hideAdd){
            document.getElementById('ore-add-icon').hidden = hideAdd;
            document.getElementById('ore-added-icon').hidden = !hideAdd;
        },
        /**
         * @return {boolean} Returns true if the annotations view is visible
         */
        annotationsVisible: function() {
            return document.getElementById('oobAnnoContentBox').getAttribute("collapsed") == "false";   
        },
        /**
         * @return {boolean} Returns true if the compound object view is visible
         */
        compoundObjectsVisible: function () {
            return document.getElementById('oobContentBox').getAttribute("collapsed") == "false";
        },
        /**
         * Hide or show the annotations view
         * @param {boolean} show Set to true to make the annotations view visible
         */
        setAnnotationsVisibility: function (show) {
            var annoContentBox = document.getElementById('oobAnnoContentBox');
            var annoContentSplitter = document.getElementById('oobAnnoContentSplitter');
            
            if (show) {
                if (this.prefs) {
                    var disable = this.prefs.getBoolPref("disable_annotations");
                    if (disable)
                        return; // don't make visible a disabled component                  
                }
                
                annoContentBox.setAttribute("collapsed", "false");
                annoContentSplitter.setAttribute("collapsed", "false");
                
                if ( lore.global.ui.annotationView.loaded(this.instId)) {
                    loreoverlay.annoView().show();
                } else {
                    lore.global.ui.annotationView.onload(this.instId, function () {
                        lore.debug.ui("Annotations: Delayed loreOpen running...");
                        loreoverlay.annoView().show();
                    });
                }
                
            } else {
                annoContentBox.setAttribute("collapsed", "true");
                annoContentSplitter.setAttribute("collapsed", "true");
                
                if ( this.variationContentWindowIsVisible())
                    this.hideVariationSplitter();
                
                if ( lore.global.ui.annotationView.loaded(this.instId) ) {
                    loreoverlay.annoView().hide();
                }       
            }
        },
        /**
         * Hide or show the compound objects view
         * @param {boolean} show Set to true to make the compound objects view visible
         */
        setCompoundObjectsVisibility: function (show) {
            var contentBox = document.getElementById('oobContentBox');
            var contentSplitter = document.getElementById('oobContentSplitter');
            if (show) {
                if ( this.prefs) {
                    var disable_co = this.prefs.getBoolPref("disable_compoundobjects");
                    if ( disable_co)
                        return; // don't make visible a disabled component
                }
                contentBox.setAttribute("collapsed", "false");
                contentSplitter.setAttribute("collapsed", "false");
                if ( lore.global.ui.compoundObjectView.loaded(this.instId)) {
                    loreoverlay.coView().onShow();
                }else {
                    lore.global.ui.compoundObjectView.onload(this.instId, function () {
                        lore.debug.ore("Compound Objects: Delayed loreOpen running...");
                        loreoverlay.coView().onShow();
                    });
                }
            } else {
                contentBox.setAttribute("collapsed", "true");
                contentSplitter.setAttribute("collapsed", "true");
                if ( lore.global.ui.compoundObjectView.loaded(this.instId)) {
                    loreoverlay.coView().onHide();
                }
            }
                
        },
        /** 
         * @return {} The variation content window
         */
        getVariationContentWindow: function(){
            return document.getElementById("oobAnnoVarContent").contentWindow;
        },
        /**
         * @return {boolean} True if the variation content window is visible
         */
        variationContentWindowIsVisible: function () {
            return document.getElementById("oobAnnoVarContentBox").getAttribute("collapsed") == "false";
            
        },
        setSignedIn: function(username){
            this.setAnnotationsSignedIn(username);
            this.setCompoundObjectsSignedIn(username);
        },
        setSignedOut: function(){
            this.setAnnotationsSignedOut();
            this.setCompoundObjectsSignedOut();
        },
        setAnnotationsSignedIn: function(username) {
            lore.debug.anno("setAnnotationsSignedIn()");
            var authStatusIcon = document.getElementById("auth-status-icon");
            authStatusIcon.className = 'signed-in';
            authStatusIcon.tooltipText = "Signed in to Annotation Server as " + username;
            var authButton = document.getElementById("auth-signout");
            authButton.label = "Sign Out " + username;
            authButton.hidden = false;
            document.getElementById("auth-signin").hidden = true;
        },
        
        setAnnotationsSignedOut: function() {
            lore.debug.anno("setAnnotationsSignedOut()");
            var authStatusIcon = document.getElementById("auth-status-icon");
            authStatusIcon.className = '';
            authStatusIcon.tooltipText = "Signed Out";
            document.getElementById("auth-signout").hidden = true;
            document.getElementById("auth-signin").hidden = false;
        },
        setCompoundObjectsSignedIn: function(username) {
            var authStatusIcon = document.getElementById("auth-status-icon-co");
            authStatusIcon.className = 'signed-in';
            authStatusIcon.tooltipText = "Signed in to Compound Object server as " + username;
            var authButton = document.getElementById("auth-signout-co");
            authButton.label = "Sign Out " + username;
            authButton.hidden = false;
            document.getElementById("auth-signin-co").hidden = true;
        },
        setCompoundObjectsSignedOut: function() {
            var authStatusIcon = document.getElementById("auth-status-icon-co");
            authStatusIcon.className = '';
            authStatusIcon.tooltipText = "Signed Out";
            document.getElementById("auth-signout-co").hidden = true;
            document.getElementById("auth-signin-co").hidden = false;
        }
        
    };
    window.addEventListener("load", function(e){
        // delay onload for better browser responsiveness
        window.setTimeout(function(){loreoverlay.onLoad(e);},200);
    }, false);
    
    window.addEventListener("unload", function overlayonunload(){
        window.removeEventListener("unload", overlayonunload, false);
        loreoverlay.unLoad();
    }, false);
    
} catch (e ) {
    alert("loreoverlay: " + e + " " + e.lineNumber);

}
