/**
 * @singleton
 * @class loreoverlay
 */
try {
	// Load and cache global ui functions
	
	// for naming consistency with other code
	var lore = { global: {} };
	// lore.debug
	Components.utils.import("resource://lore/debug.js", lore);	
	// lore.global.ui
	Components.utils.import("resource://lore/uiglobal.js", lore.global);
	// lore.global.store
	Components.utils.import("resource://lore/annotations/store.js", lore.global);
	
	// lore.global.util
	Components.utils.import("resource://lore/util.js", lore.global);
	
		
	if (!lore.global.ui || !lore.global.store || !lore.debug ) {
		// sanity check
		alert("Not all js modules loaded.");
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
					alert(e + " " +  e.stack);
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
				
				this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.lore.");
				this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
				this.loadGlobalPrefs();
				this.prefs.addObserver("", this, false);
				
				this.initialized = true;
				this.strings = document.getElementById("lore-strings");
				this.addEvents(["annoprefs_changed", "location_changed", "location_refresh"]);
				lore.global.ui.load(window, this.instId);
			} 
			catch (e) {
				alert("Error on load: " + e + "\n" + e.stack);
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
				lore.debug.ui("onClose()");
				if (loreoverlay.annoView().hasModifiedAnnotations()) {
					if (confirm("Click 'Ok' to save changes to modified annotations.")) {
						loreoverlay.annoView().handleSaveAllAnnotationChanges();
					}
				}
			} catch(e) {
				alert(e);
			}
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
				this.loadCompoundObjectPrefs();
				this.loadAnnotationPrefs();
			} catch (e ) {
				lore.debug.ui("Error updating preferences on prefs change: " + e, e);
			}
			
		},
        /** Tear down code to remove progress listener */
		uninit: function(){
			if ( lore.global.ui.annotationView.loaded(this.instId) || lore.global.ui.compoundObjectView.loaded(this.instId)) {
				gBrowser.removeProgressListener(this.oreLocationListener);
			}
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
			if (gContextMenu.onLink) 
				loreoverlay.coView().addFigure(gContextMenu.linkURL);
		},
        /** 
         * Show a context menu in the browser on images, links and background images, for creating nodes in compound object editor 
         * @param {] event
         * */
		onMenuPopup: function(event){
			try {
				
				var img = loreoverlay.annoView().getCurSelImage();
				var imgSelArea = document.popupNode.getAttribute("_lore_imgareaselect");
				
				gContextMenu.showItem('addanno-lore', gContextMenu.isContentSelected
				|| (  imgSelArea  && img));
				gContextMenu.showItem('modannosel-lore', (gContextMenu.isContentSelected 
				|| (  imgSelArea && img)) &&
				(loreoverlay.annoView().getCurrentAnno() != null));
				
				gContextMenu.showItem('addimage-lore', gContextMenu.onImage);
				gContextMenu.showItem('addlink-lore', gContextMenu.onLink);
				gContextMenu.showItem('addbgimg-lore', gContextMenu.hasBGImage);
				gContextMenu.showItem('oaioresep', gContextMenu.onImage || gContextMenu.onLink || gContextMenu.hasBGImage);
			} catch (e) {
				lore.debug.ui(e);
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
				lore.debug.ui("image selection failed: " + e, e);
			}
		},
        /** Trigger adding a node to the compound object editor from browser context menu on images */ 
		addImageMenuItemCommand: function(e){
			if (gContextMenu.onImage) 
				loreoverlay.coView().addFigure(gContextMenu.imageURL);
		},
        /** Trigger adding a node to the compound object editor from browser context menu on background images */
		addBGImageMenuItemCommand: function(e){
			if (gContextMenu.hasBGImage) 
				loreoverlay.coView().addFigure(gContextMenu.bgImageURL);
		},
        /** Toggle LORE visibility when LORE menu item is selected */
		onToolbarMenuCommand: function(e){
			this.toggleBar();
		},
        /** Toggle the visibility of LORE */
		toggleBar: function(){
			try {
	            var toolsMenuItem = document.getElementById('lore-tools-item');
	            var annoContentBox = document.getElementById('oobAnnoContentBox');
	            var contentBox = document.getElementById('oobContentBox');
	            
				lore.global.ui.setCurrentURL(loreoverlay.instId,gBrowser.currentURI.spec);
				
	            if (annoContentBox.getAttribute("collapsed") == "false" || contentBox.getAttribute("collapsed") == "false"){
	               toolsMenuItem.removeAttribute("checked");
	                this.setAnnotationsVisibility(false);
	                this.setCompoundObjectsVisibility(false); 
					if ( this.variationContentWindowIsVisible())
						this.hideVariationSplitter();
	            } else {
	               toolsMenuItem.setAttribute("checked", "true");
	               this.setAnnotationsVisibility(true);
	               this.setCompoundObjectsVisibility(true); 
	            }
			} catch (e ) {
				alert(e + " " +  e.stack);
			}
		},
		/** Compound Objects Toolbar button handler: Triggers loading compound object RDF from a URL **/
        loadRDFURL: function(){
            loreoverlay.coView().loadRDF();
        },
		
		loadAnnoRDF: function () {
			loreoverlay.annoView().handleImportRDF();
		},
		
        /** Compound Objects Toolbar button handler: Allow the user to choose an RDF/XML file describing a compound object and display it in the editor */
		loadRDF: function(){
            
			try{
                var fObj = 	lore.global.util.loadFileWithOpen("Select Compound Object RDF/XML file", 
				{desc:"RDF documents", filter:"*.rdf"}, window);
				
				if ( fObj) {
					loreoverlay.coView().loadCompoundObject(fObj.data);
				}
            } catch (e){
                lore.debug.ui("Exception importing compound object from file",e);
            }
        },
        /** Annotations Toolbar button handler: Trigger adding an annotation */
		addAnnotation: function(){
			try {
				loreoverlay.annoView().handleAddAnnotation();
			}catch (e ) {
				alert("addAnnotation: " + e) ;
			}
		},
		updateAnnotationSel: function (type) {
			if (type == "variation")
				loreoverlay.annoView().handleUpdateVariationAnnotationContext();
			else
				loreoverlay.annoView().handleUpdateAnnotationContext();
		},
		/** Annotations Toolbar button handler: Trigger removing an annotation */
		removeAnnotation: function() {
			try {
				loreoverlay.annoView().handleDeleteAnnotation();
			} catch (e) {
				alert(e + " " +  e.stack);
			}
		},
		/** Annotations Toolbar button handler: Trigger editing an annoation */
		editAnnotation: function () {
			loreoverlay.annoView().handleEdit();
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
			loreoverlay.coView().saveRDFToRepository();
		},
        /** Compound Objects Toolbar button handler: Trigger deleting a compound object from the repository */
        deleteRDF: function(){
            loreoverlay.coView().deleteFromRepository();
        },
        /** Compound Objects Toolbar button handler: Trigger serializing a compound object to a file
         * @param {String} format The format of the serialization
         */
        serializeREM: function (format) {
            loreoverlay.coView().handleSerializeREM(format);
        },
        /** Compound Object Toolbar button handler: Trigger adding the current URI to the compound object editor */
		addGraphNode: function(){
			loreoverlay.coView().addFigure(window.content.location.href);
		},
        layoutGraph: function(){
            loreoverlay.coView().doLayout();  
        },
        createCompoundObject: function(){
            loreoverlay.coView().createCompoundObject();  
        },
        /** Toolbar button handler: reset the compound objects and annotations views */
		resetGraph: function(){
			lore.global.ui.reset(window, this.instId);
		},
        /** Display the about window */
		openAbout: function(){
			window.open("chrome://lore/content/about.xul", "", "chrome,centerscreen,modal");
		},
        /** Display the preferences window */
		openOptions: function(){
			window.open("chrome://lore/content/options.xul", "", "chrome,centerscreen,modal,toolbar");
		},
		
		loadGlobalPrefs: function () {
			try {
				var logging = this.prefs.getBoolPref("filelogging");
				lore.debug.enableFileLogger(logging);
			} catch (ex) {
			}
		},
        /** Reload preferences for compound objects and disable/enable the compound objects view depending on prefs */
		loadCompoundObjectPrefs: function(){
			
			if (this.prefs) {
				var dccreator = this.prefs.getCharPref("dccreator");
				var relonturl = this.prefs.getCharPref("relonturl");
				var rdfrepos = this.prefs.getCharPref("rdfrepos");
				var rdfrepostype = this.prefs.getCharPref("rdfrepostype");
				var annoserver = this.prefs.getCharPref("annoserver");
				var disable_co = this.prefs.getBoolPref("disable_compoundobjects");
				
				// hide or show XUL toolbar buttons depending on prefs
				
				document.getElementById('cosep').hidden = disable_co;
				document.getElementById('add-node').hidden = disable_co;
				document.getElementById('save-rdf').hidden = disable_co;
				document.getElementById('load-rdf').hidden = disable_co;
				document.getElementById('import-export').hidden = disable_co;
				
					loreoverlay.coView().setDcCreator(dccreator);
				loreoverlay.coView().setrelonturl(relonturl);
				loreoverlay.coView().setRepos(rdfrepos, rdfrepostype, annoserver);
               
				// hide or show related Ext UI depending on prefs
				loreoverlay.coView().disableUIFeatures({
					'disable_compoundobjects': disable_co
				});
				
			} 
		},
		
		loadAnnotationPrefs: function(){
			
			if (this.prefs) {
				
				var annoserver = this.prefs.getCharPref("annoserver");
				var dccreator = this.prefs.getCharPref("dccreator");
				
				var disable = this.prefs.getBoolPref("disable_annotations");
				document.getElementById('annsep').hidden = disable;
				document.getElementById('annsep2').hidden = disable;
				document.getElementById('annsep3').hidden = disable;
				document.getElementById('add-annotation').hidden = disable;
				document.getElementById('show-annotations').hidden = disable;
				document.getElementById('edit-annotation').hidden = disable;
				document.getElementById('remove-annotation').hidden = disable;
				document.getElementById('reply-annotation').hidden = disable;
				document.getElementById('save-annotation').hidden = disable;
				document.getElementById('save-all-annotations').hidden = disable;
				document.getElementById('import-export-anno').hidden = disable;
				
				var mode = this.prefs.getBoolPref("annotationmode");
				var timeout = this.prefs.getIntPref("annocache_timeout") * 1000; // to millis
				
				this.fireEvent("annoprefs_changed",
				[{
					creator: dccreator,
					url: annoserver,
					cacheTimeout: timeout,
					disable: disable,
					mode: mode
				}]);
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
							regListeners[i].callback.apply(regListeners[i].scope ? regListeners[i].scope : this, args);
						}
					}
				}
			} catch (e ) {
				alert(e + " " + e.stackTrace);
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
		
		/** Trigger the relationships ontology to be reloaded */
		loadOntology: function(){
			var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
			var loreprefs = prefservice.getBranch("extensions.lore.");
			var relonturl = loreprefs.getCharPref("relonturl");
			loreoverlay.coView().setrelonturl(relonturl);
			loreoverlay.coView().loadRelationshipsFromOntology();
			return true;
		},
		/** Used to provide tooltips for title attributes in HTML inside the chrome window */
		fillInHTMLTooltip: function(tipElement){
			// From http://forums.mozillazine.org/viewtopic.php?f=19&t=561451&start=0&st=0&sk=t&sd=a
			var retVal = false;
			if (tipElement.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") {
				return retVal;
			}
			const XLinkNS = "http://www.w3.org/1999/xlink";
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
				document.getElementById("oobAnnoVarContentLabel").setAttribute("value", title);
				document.getElementById("oobAnnoVarContentLabelURL").setAttribute("value", url);

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
							lore.debug.anno("Error updateVariationSplitter callback: " +e, e);
						}
						
					}, true);
				}

				// Must use .location not the src attriubte of iframe
				// as it's not updated by users action within the iframe
				iframe.contentWindow.location = url;
			} catch ( e ) {
				lore.debug.anno(e,e);
			}
		},
		/**
         * Hide the variation splitter
		 */
		hideVariationSplitter: function(){
			var splitter = document.getElementById("oobAnnoVarContentSplitter");
			if (splitter.getAttribute("collapsed") == "false") {
				document.getElementById("oobAnnoVarContentSplitter").setAttribute("collapsed", "true");
				document.getElementById("oobAnnoVarContentBox").setAttribute("collapsed", "true");
				document.getElementById("oobAnnoVarContentLabel").setAttribute("value", "");
				document.getElementById("oobAnnoVarContent").setAttribute("src", "about:blank");
				loreoverlay.annoView().hideMarker(document.getElementById("oobAnnoVarContent").contentWindow);
			}
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
						lore.debug.ui("Compount Objects: Delayed loreOpen running...");
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
			
		}
		
	};
	window.addEventListener("load", function(e){
		loreoverlay.onLoad(e);
	}, false);
	window.addEventListener("unload", function(){
		loreoverlay.uninit()
	}, false);
	
} catch (e ) {
	alert(e + " " + e.lineNumber);

}
