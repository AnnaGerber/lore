/*
 * Copyright (C) 2008 - 2009 School of Information Technology and Electrical
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
 * @include  "/oaiorebuilder/content/annotations/annotations.js"
 * @include  "/oaiorebuilder/content/debug.js"
 * @include  "/oaiorebuilder/content/util.js"
 * @include  "/oaiorebuilder/content/uiglobal.js"
 * @include  "/oaiorebuilder/content/constants.js"
 */

	try {
	
		/*
		 * Initialization
		 */
		
		/*lore.anno.ui.initPageData = function(){
		
			lore.anno.ui.page.multiSelAnno = new Array();
			lore.anno.ui.page.colourForOwner = {};
			lore.anno.ui.page.colourCount = 0;
			lore.anno.ui.page.curSelAnno;
			lore.anno.ui.page.curAnnoMarkers = new Array();
		}
		
		lore.anno.ui.initPageData();*/
		
		
		
		lore.anno.ui.PageData = function(){
		
			this.store = function(url){
				var update_ds = {
					multiSelAnno: this.multiSelAnno.slice(),
					colourForOwner: lore.global.util.clone(this.colourForOwner),
					colourCount: this.colourCount,
					curSelAnnoId: this.curSelAnno ? this.curSelAnno.data.id : null,
					curAnnoMarkers: this.curAnnoMarkers.slice(),
					curImage: this.curImage,
				//rdfa: lore.global.util.clone(lore.anno.ui.rdfa) 
				};
				
				lore.global.store.set(lore.constants.HIGHLIGHT_STORE, update_ds, url);
			};
			
			this.clear = function () {
				this.multiSelAnno = new Array();
				this.colourForOwner = {};
				this.colourCount = 0;
				this.curSelAnno;
				this.curAnnoMarkers = new Array();
			}
			
			this.load = function(url, clear){
				var ds = lore.global.store.get(lore.constants.HIGHLIGHT_STORE, url);
				if (ds) {
					this.multiSelAnno = ds.multiSelAnno;
					this.colourForOwner = ds.colourForOwner;
					this.colourCount = ds.colourCount
					var curSelAnnoId = ds.curSelAnnoId;
					this.curAnnoMarkers = ds.curAnnoMarkers;
					this.curImage = ds.curImage;
					//lore.anno.ui.rdfa = ds.rdfa;
					
					//TODO: should find unsaved version first?
					var rec = lore.global.util.findRecordById(lore.anno.annods, curSelAnnoId);
					if (rec) {
						this.curSelAnno = rec;
					}
				} else if ( clear)
					this.clear();
			}
			
			this.clear();
		}
		
		lore.anno.ui.page = new lore.anno.ui.PageData();
				
				
    /**
		 * Setup the event hooks that notify the view functions of store events
		 */
		lore.anno.ui.initModelHandlers = function(){
			var annosourcestreeroot = Ext.getCmp("annosourcestree").getRootNode();
			lore.anno.annods.on({
				"update": {
					fn: lore.anno.ui.updateUIOnUpdate
				},
				"load": {
					fn: lore.anno.ui.updateUI
				},
				"remove": {
					fn: lore.anno.ui.updateUIOnRemove
				},
				"clear": {
					fn: lore.anno.ui.updateUIOnClear
				}//,
			// "datachanged": {fn: lore.anno.ui.updateUIOnRefresh},
			});
			
			lore.anno.annodsunsaved.on( {
			"load": {
					fn: lore.anno.ui.updateUIUnsavedChanges
				},
			"remove": {
					fn: lore.anno.ui.updateUIOnRemoveUnsavedChanges
				},
			"update": {
					fn: lore.anno.ui.updateUIOnUpdateUnsavedChanges
				}
			});
			
		}
		
	
		
		
		/**
		 * Set the default creator for annotations
		 * @param {String} creator The default creator of annotations
		 */
		lore.anno.ui.setdccreator = function(creator){
			lore.defaultCreator = creator;
		}
		
		/**
		 * Set the annotation server URL
		 * @param {String} annoserver The annotation server URL
		 */
		lore.anno.ui.setRepos = function(annoserver){
			lore.anno.annoURL = annoserver; // annotation server
		}
		
		lore.anno.ui.getAnnotationMode = function () {
			if ( !lore.anno.ui.annomode)
				return lore.constants.ANNOMODE_NORMAL;
			
			return lore.anno.ui.annomode ? lore.constants.ANNOMODE_SCHOLARLY: lore.constants.ANNOMODE_NORMAL;	
		}
		
		lore.anno.ui.setAnnotationMode = function(mode) {
			lore.anno.ui.annomode = mode;
			lore.anno.ui.setAnnotationFormUI(null, null, lore.anno.ui.getAnnotationMode());
		}
		
		lore.anno.ui.setCacheTimeout = function ( millis) {
			//TODO: should be at a finer granularity 
			lore.anno.cachetimeout = millis;
		}		
		
		/**
		 * Show the annotations view. Update the annotations source list
		 * to match this page
		 */
		lore.anno.ui.show = function(){
			lore.anno.ui.lorevisible = true;
			
			if (lore.anno.ui.currentURL && lore.anno.ui.currentURL != 'about:blank' &&
			lore.anno.ui.currentURL != '' &&
			(!lore.anno.ui.loadedURL || lore.anno.ui.currentURL != lore.anno.ui.loadedURL)) {
				lore.anno.ui.handleLocationChange(lore.anno.ui.currentURL);
			//lore.anno.ui.loadedURL = lore.anno.ui.currentURL; 
			}
			if ( lore.anno.ui.page.curAnnoMarkers.length > 0 && lore.anno.ui.page.curSelAnno) {
				var cc = lore.anno.ui.getCreatorColour(lore.anno.ui.page.curSelAnno.data.creator);
				for (var i = 0; i < lore.anno.ui.page.curAnnoMarkers.length; i++) {
					lore.anno.ui.page.curAnnoMarkers[i].show(cc, lore.anno.ui.setCurAnnoStyle,true);
				}
			}
		}
		
		/**
		 * Hide the annotations view
		 */
		lore.anno.ui.hide = function(){
			lore.anno.ui.lorevisible = false;
			if ( lore.anno.ui.page.multiSelAnno.length > 0) {
				lore.anno.ui.toggleAllAnnotations();
			}
			if ( lore.anno.ui.page.curAnnoMarkers.length > 0) {
				for (var i = 0; i < lore.anno.ui.page.curAnnoMarkers.length; i++) {
					lore.anno.ui.page.curAnnoMarkers[i].hide();
				}
			}
		}
		
		/**
		 * Update GUI elements based off the record passed in
		 * @param {Record} rec Ext Annotation record to base update off of
		 */
		lore.anno.ui.updateUIElements = function(rec){
			// update the highlighted fields colour in the event the creator is changed
			// the colour is identified by the creator's name
			
			if (rec) {
				lore.anno.ui.hideMarker();
				lore.anno.ui.highlightCurrentAnnotation(rec);
			}
			
			if (lore.anno.ui.page.multiSelAnno.length > 0) {
				// hide then reshow 
				lore.anno.ui.toggleAllAnnotations();
				lore.anno.ui.toggleAllAnnotations();
			}
		}
		
		/**
		 * Store the annotation that is currently selected in the view
		 * @param {Record} rec Record Currently selected annotation
		 */
		lore.anno.ui.setCurrentAnno = function(rec, store){
			lore.anno.ui.hideMarker();
			lore.anno.ui.page.curSelAnno = rec;
			lore.anno.ui.page.curSelAnnoStore = store;
		}
		
		lore.anno.ui.getCurrentAnno = function(){
			return lore.anno.ui.page.curSelAnno;
		}
		
		/* Form Editor Functions */
		
		
	//	 Can use for debugging purposes when isDirty() is overzealous on the form
		 
		 lore.anno.ui.isFormDirty = function() {
			 var dirtyList = [];
			 var isDirty = false;
			 lore.anno.ui.form.items.each( function (item, index, length) {
			 if ( item.isDirty()) {
			 	isDirty = true;
			 dirtyList.push(item.getName());
			 }
			 });
			 
			 lore.debug.anno("The dirty items are: " + dirtyList.join());
			 return isDirty;
		 }
		
		/**
		 * Reject any changes made to the current annotation
		 */
		lore.anno.ui.rejectChanges = function(){
			lore.anno.ui.page.curSelAnno.reject();
		}
		
		/**
		 * Hide the annotation editor
		 */
		lore.anno.ui.hideAnnotation = function() {
			if ( lore.anno.ui.formpanel.isVisible() ) {
				lore.anno.ui.formpanel.hide();
				Ext.getCmp("treeview").doLayout();
			}
		}
		
		/**
		 * Show the annotation editor. 
		 * @param {Record} rec  The record containing the annotation to show in the editor
		 * @param {Boolean} loadOnly (Optional) Load the annotation data into form fields but don't show editor. Defaults to false.
		 */
		lore.anno.ui.showAnnotation = function(rec, loadOnly){
			try {
				
				// display contents of context
				if (rec.data.context) {
					
					var ctxtField = lore.anno.ui.form.findField('contextdisp');
					if (rec.data.original == lore.anno.ui.currentURL) {
						var selText = '';
						try {
							selText = lore.global.util.getSelectionText(
							rec.data.context, lore.global.util.getContentWindow(window).document)
						} 
						catch (e) {
						}
						
						lore.anno.ui.form.setValues([{
							id: 'contextdisp',
							value: '"' + selText + '"'
						}]);
					} else if ( !lore.anno.ui.topView.variationContentWindowIsVisible() ){
						lore.anno.ui.updateSplitter(lore.anno.ui.page.curSelAnno, false); // when content is loaded in splitter
															// context field will be set
					}

					ctxtField.getEl().setStyle("background-color", lore.anno.ui.getCreatorColour(rec.data.creator));
					lore.anno.ui.setVisibilityFormField('contextdisp', false);
					
				}
				else {
					var ctxtField = lore.anno.ui.form.findField('contextdisp');
					lore.anno.ui.form.setValues([{
						id: 'contextdisp',
						value: ""
					}]);
					ctxtField.getEl().setStyle("background-color", "inherit");
				}
				if (rec.data.variantcontext) {
					var vCtxtField = lore.anno.ui.form.findField('rcontextdisp');
					if (rec.data.variant == lore.anno.ui.currentURL) {
						var selText = '';
						try {
							// need to do this while the xpointer library still has emotional problems
							selText = lore.global.util.getSelectionText(
							rec.data.variantcontext, lore.global.util.getContentWindow(window).document)
						} 
						catch (e) {
						}
						lore.anno.ui.form.setValues([{
							id: 'rcontextdisp',
							value: '"' + selText + '"'
						}]);
					} else if ( !lore.anno.ui.topView.variationContentWindowIsVisible() ){
						lore.anno.ui.updateSplitter(lore.anno.ui.page.curSelAnno, false); // when content is loaded in splitter
															// context field will be set
					}
					vCtxtField.getEl().setStyle("background-color", lore.anno.ui.getCreatorColour(rec.data.creator));
					lore.anno.ui.setVisibilityFormField('rcontextdisp', false);
				}
				else {
					var ctxtField = lore.anno.ui.form.findField('rcontextdisp');
					lore.anno.ui.form.setValues([{
						id: 'rcontextdisp',
						value: ""
					}]);
					ctxtField.getEl().setStyle("background-color", "inherit");
				}
				
				lore.anno.ui.form.setValues([{ id: 'metares', value: ''}]);
				
	 			//lore.anno.ui.form.findField('metares').setValue('');
				if (lore.anno.ui.rdfa != null  ) {
				
					var theField =  lore.anno.ui.form.findField('metares');
					
					try {
						if (rec.data.meta.context) {
							var d = lore.global.util.getContentWindow(window).document;
							var triple;
							
							if ( lore.anno.ui.rdfa.triples.length > 0) {
								lore.debug.anno("resolving context from hashed triple", rec.data.meta.context);
								triple = lore.global.util.stringHashToTriple(rec.data.meta.context[0], lore.anno.ui.rdfa.rdf.databank.triples());	
							} else {
								var n = lore.global.util.getNodeForXPointer(rec.data.meta.context[1], d);
								triple = $(n.firstChild).rdfa().databank.triples()[0];
							}
							
							//theField.setValue(lore.anno.ui.tripleToString(triple, lore.anno.ui.rdfa.rdf));
							theField.setValue(lore.anno.ui.tripleURIToString(triple.property));
						}
	 					//lore.anno.ui.addPageMetadataToStore(lore.anno.annopagemetads);
						theField.getEl().setStyle("background-color", lore.anno.ui.getCreatorColour(rec.data.creator));
						
				} catch (e) {
					lore.debug.anno(e,e);	
				}


			}
			else {
					
				lore.anno.ui.form.setValues([{ id: 'metares', value: ''}]);
		 	}
			
			var isNormal = lore.anno.ui.getAnnotationMode() == lore.constants.ANNOMODE_NORMAL;
			lore.anno.ui.setVisibilityFormField('importance', 	isNormal);
			lore.anno.ui.setVisibilityFormField('altbody', 		isNormal);
			lore.anno.ui.setVisibilityFormField('references', 	isNormal);
		
				
				if (!loadOnly) {
					lore.anno.ui.formpanel.show();
					Ext.getCmp("treeview").doLayout();
				}
					lore.anno.ui.form.loadRecord(rec);
					
				
				
				var val = rec.data.resource;
				if (rec.data.isReply) {
					var prec = lore.global.util.findRecordById(lore.anno.annods, rec.data.about);
					
					val = "'" + prec.data.title + "'";
					if (!lore.anno.isNewAnnotation(prec)) {
						val += " ( " + rec.data.about + " )";
					}
				}
				lore.anno.ui.form.setValues([{ id: 'res', value: val }]);
						
				if ( !loadOnly){	
					if (rec.data.isReply) {
						//Ext.getCmp("updctxtbtn").hide();
						//Ext.getCmp("updrctxtbtn").hide();
							
					}
					else {
						//Ext.getCmp("updctxtbtn").show();
					}
				}
				
			} 
			catch (e) {
				lore.debug.anno("Error display annotation: " + e, e);
			}
		}
		
		/**
		 * Show/hide a field on a form
		 * @param {String} fieldName The field name to set the visibility of
		 * @param {Boolean} hide (Optional)Specify whether to hide the field or not. Defaults to false
		 */
		lore.anno.ui.setVisibilityFormField = function(fieldName, hide){
			
			var thefield = lore.anno.ui.form.findField(fieldName);
			if (thefield) {
				var cont = thefield.container.up('div.x-form-item');
				
				cont.setDisplayed(false);
				if (hide && cont.isVisible()) {
					cont.slideOut();
					thefield.hide();
				}
				else if (!hide && !cont.isVisible()) {
						thefield.hide();
						cont.slideIn();
						thefield.show();
						cont.setDisplayed(true);
					}
			}
		}
		
		/**
		 * Hide list of form fields
		 * @param {Array} fieldNameArr List of fields to hide
		 */
		lore.anno.ui.hideFormFields = function(fieldNameArr){
			for (var i = 0; i < fieldNameArr.length; i++) {
				lore.anno.ui.setVisibilityFormField(fieldNameArr[i], true);
			}
		}
		
		/**
		 * Show list of form fields
		 * @param {Array} fieldNameArr List of fields to show
		 */
		lore.anno.ui.showFormFields = function(fieldNameArr){
			for (var i = 0; i < fieldNameArr.length; i++) {
				lore.anno.ui.setVisibilityFormField(fieldNameArr[i], false);
			}
		}
		
		/**
		 * Show hide fields depending on whether the current annotation is a variation
		 * @param {Boolean} variation Specify whether the annotation is variation annotation or not
		 */
		lore.anno.ui.setAnnotationFormUI = function(variation, rdfa, annomode){
		
			var nonVariationFields = ['res'];
			var variationFields = ['original', 'variant', 'rcontextdisp', 'variationagent', 'variationplace', 'variationdate'];
			var rdfaFields = ['metares','metausergrid', 'metauserlbl','metapagelbl'];
			
			var scholarlyFields = ['importance', 'references', 'altbody'];
			// annotation mode
			
			if (annomode != null) {
			
				if ( annomode == lore.constants.ANNOMODE_NORMAL) {
					lore.anno.ui.hideFormFields(scholarlyFields);
				}
				else {
					lore.anno.ui.showFormFields(scholarlyFields);
				}
			}
			
			// variation
			if (variation != null) {
				if (variation) {
					lore.anno.ui.hideFormFields(nonVariationFields);
					lore.anno.ui.showFormFields(variationFields);
					var isReply = (lore.anno.ui.page.curSelAnno && lore.anno.ui.page.curSelAnno.data.isReply);
					if (!isReply) {
						//Ext.getCmp('updrctxtbtn').setVisible(true);
					}
				}
				else {
					//Ext.getCmp('updrctxtbtn').setVisible(false);
					lore.anno.ui.hideFormFields(variationFields);
					lore.anno.ui.showFormFields(nonVariationFields);
				}
			}
			
			// rdfa
			if (rdfa != null) {
				if (rdfa) {
					lore.anno.ui.showFormFields(rdfaFields);
				}
				else {
					lore.anno.ui.hideFormFields(rdfaFields);
				}
				
				Ext.getCmp('chgmetactxbtn').setVisible(rdfa);
				//TODO: temporary until this component properly implemented
				//Ext.getCmp('metausergrid').setVisible(rdfa);
				//Ext.getCmp('addmetabtn').setVisible(rdfa);
				//Ext.getCmp('remmetabtn').setVisible(rdfa);
				
				Ext.getCmp('metausergrid').setVisible(false);
				Ext.getCmp('addmetabtn').setVisible(false);
				Ext.getCmp('remmetabtn').setVisible(false);
				
			}
		}
		
		lore.anno.ui.recIdForNode = function(node) {
			return node.id.replace("-unsaved", "");
			//return node.id;
		}
		/**
		 * Update the annotation object to use the values from the
		 * form
		 * @param {Record} rec The annotation to update
		 */
		lore.anno.ui.updateAnnoFromRecord = function(rec, updatereal){
		/*	if (!rec.data.isReply) {
				var resField = lore.anno.ui.form.findField('res');
				if (resField.getValue() != rec.data.resource) {
					rec.data.resource = resField.getValue();
				}
			}*/
			
			if ( rec == null)
				return;
				
			var unsavedRec;
			
			
			if (updatereal) {
				unsavedRec =  lore.global.util.findRecordById(lore.anno.annods, rec.data.id);
				if ( !unsavedRec)
					unsavedRec =  lore.global.util.findRecordById(lore.anno.annodsunsaved, rec.data.id);
				
			}
			else {
				unsavedRec = lore.global.util.findRecordById(lore.anno.annodsunsaved, rec.data.id);
				if (!unsavedRec && ( lore.anno.isNewAnnotation(rec) || lore.anno.ui.form.isDirty())) {
				
					//var anno = lore.anno.addAnnotation(null, rec.data.resource, null);
					var clone = {};
					// shallow clone
					for (var e in rec.data) {
						clone[e] = rec.data[e];
					}
					
					
					lore.anno.annodsunsaved.loadData([clone], true);
					unsavedRec = lore.global.util.findRecordById(lore.anno.annodsunsaved, rec.data.id);
					lore.debug.anno('meh', {
						c: clone,
						u: unsavedRec
					});
				}
			}
			
			if (unsavedRec) {
				lore.anno.ui.form.updateRecord(unsavedRec);
				lore.debug.anno("Annotation record updated.");
			}
			
			/*var r = lore.anno.ui.metausergrid.getStore().getRange();
			for (var i =0; i < r.length; i++) {
				var d = r[i].data;
				rec.data.meta.fields.push ( {type: d.type, prop: d.prop, value: d.value}  );
			}*/
		}
				
		/** Tree UI Functions */

		
		/**
		 * Generate the tree node text
		 * @param {Object} anno Annotation to generate the node text for
		 */
		lore.anno.ui.genTreeNodeText = function(anno, store){
		
			return lore.anno.ui.genDescription(anno, true);
			
		}
		
				
		
		/**
		 * Create a tree node and insert into the tree. If it's a new annotation then set
		 * inital values.  If it's not a new annotation, add it to the timeline. 
		 * @param {Object} anno  Annotation to add as a tree node
		 * @param {Object} defparent (Optional) The default parent to add the annotation to
		 */
		lore.anno.ui.createAndInsertTreeNode = function(anno, nodeid, defparent, store){
			
			var parent = null;
			
			if ( defparent ) {
				parent = defparent;
			}
		
			if ( !parent && anno.isReply) {
				parent = lore.anno.ui.findNode(anno.about, lore.anno.ui.treeroot);				
			} 

			if ( !parent){
				parent = lore.anno.ui.treeroot;
			}
			
			var tmpNode;
			var nodeLinks = [{title: 'View annotation body in a new window',
							iconCls: 'anno-icon-launchWindow',
							 jscript: "lore.global.util.launchWindow('" + anno.bodyURL + "',false, window);"},
							
							 { title: 'View annotation in the timeline',
							 	iconCls: 'anno-icon-timeline',
							 jscript: "lore.anno.ui.showAnnoInTimeline('" + anno.id + "');"}
							  ];
			
			var iCls = lore.anno.ui.getAnnoTypeIcon(anno);
				  
			if (lore.anno.isNewAnnotation(anno)) {
				
				tmpNode = new lore.anno.ui.AnnoColumnTreeNode ( {
					id: anno.id + nodeid,
					nodeType: anno.type,
					title: lore.anno.ui.getAnnoTitle(anno),
					text: anno.body || '',
					iconCls: iCls,
					uiProvider: lore.anno.ui.ColumnTreeNodeUI,
					// links: nodeLinks,
					qtip:  lore.anno.ui.genAnnotationCaption(anno, 't by c, d')
				});
				
				parent.appendChild(tmpNode);
				
			}
			else {
				if (lore.global.util.splitTerm(anno.type).term == 'VariationAnnotation' ) {
					nodeLinks.push({ title: 'Show Variation Window',
									 iconCls:'anno-icon-splitter', 
									 jscript: "lore.anno.ui.showSplitter('" + anno.id + "');"});
				}
				
				var args = {
					id: anno.id + nodeid,
					nodeType: anno.type,
					text: lore.anno.ui.genTreeNodeText(anno, store ),
					title: anno.title,
					bheader: lore.anno.ui.genAnnotationCaption(anno, 'by c, d r'),
					iconCls: iCls,
					uiProvider: lore.anno.ui.ColumnTreeNodeUI,
					links: nodeLinks,
					qtip: lore.anno.ui.genAnnotationCaption(anno, 't by c, d')
				};
				
				tmpNode = new lore.anno.ui.AnnoColumnTreeNode (args );
				
				parent.appendChild(tmpNode);
				///TODO: timeline no no a go go for unsaved changes, need to have a check here, param passed in etc
  			    lore.anno.ui.addAnnoToTimeline(anno, lore.anno.ui.getAnnoTitle(anno));
				
			}
			lore.anno.ui.attachAnnoCtxMenuEvents(tmpNode);
			
			return tmpNode;
			
		}
		
		/**
		 * Attach context menu events to a tree node
		 * @param {TreeNode} annoNode  The tree node to attach the events to
		 */
		lore.anno.ui.attachAnnoCtxMenuEvents = function(annoNode){
			 annoNode.on('contextmenu', function(node, ev){
			 	node.select();
			 });
			 
			 
			 annoNode.on('contextmenu', function(node, e){
			 	if (!node.contextmenu) {
				 node.contextmenu = new Ext.menu.Menu({
				 id: node.id + "-context-menu"
			 	});
			 
			 var isNew = lore.anno.isNewAnnotation(lore.global.util.findRecordById(lore.anno.annods, lore.anno.ui.recIdForNode(node)));
			 
				if (!isNew) {
					node.contextmenu.add({
						text: "Show in Timeline",
						handler: function(evt){
							lore.anno.ui.showAnnoInTimeline(node.id);
						}
					});
					node.contextmenu.add({
						text: "Reply to annotation",
						handler: function(evt){
							lore.anno.ui.handleReplyToAnnotation(node.id);
						}
					});
				}
				
								 
				 node.contextmenu.add({
				 text: "Edit annotation",
				 handler: function(evt){
				 	lore.anno.ui.handleEditAnnotation(lore.anno.ui.recIdForNode(node));
				 }
				 });
	 
	 			if (!isNew) {
					node.contextmenu.add({
						text: "Add as node in compound object editor",
						handler: function(evt){
							try {
                                var rec = lore.global.util.findRecordById(lore.anno.annods, lore.anno.ui.recIdForNode(node));
								lore.global.ui.compoundObjectView.get(window.instanceId).addFigure(lore.anno.ui.recIdForNode(node),
                                    {"rdf:type_0":rec.data.type});
							} catch (e ){
								lore.debug.anno("Error adding node to compound editor:" + e, e);
							}
						}
					});
					
					if (node.nodeType == lore.constants.NAMESPACES["vanno"] + "VariationAnnotation") {
						node.contextmenu.add({
							text: "Show Variation Window",
							handler: function(evt){
								lore.anno.ui.showSplitter(lore.anno.ui.recIdForNode(node));
							}
						});
					}
				}
			 }
	 		node.contextmenu.showAt(e.xy);
	 	});
	 }
	
	
	/**
	 * Generate a description for an annotation
	 * @param {Object} annodata The annotation to generate the description for 
	 * @param {Object} noimglink (Optional) If true, specifies that a link to a new window containing the 
	 * annotation body will not be generated in the description
	 * @return {String} A string containing the annotation description. The string may contain HTML.
	 */	
	lore.anno.ui.genDescription = function(annodata, noimglink){
			var res = "";
			if (!noimglink) {
                res += "<a title='Show annotation body in separate window' xmlns=\"" +
                lore.constants.NAMESPACES["xhtml"] +
                "\" href=\"javascript:lore.global.util.launchWindow('" +
                annodata.bodyURL +
                "',false);\" ><img src='chrome://lore/skin/icons/page_go.png' alt='View annotation body in new window'></a>&nbsp;";
            }
			
			var defText = annodata.bodyLoaded ? annodata.body : 'Loading content...';
			var body = lore.global.util.externalizeLinks(defText);
			res += body;
			
			
			return res;
		}
		
		
		 
	/*
	 * Handlers
	 */
		
		/**
		 * Retrieve the currently selected text and, create a new annotation in
		 * the local store
		 * @param {Record} rec (Optional) The parent annotation record. Defaults to null
		 */
		lore.anno.ui.handleAddAnnotation = function(rec){
			try {
				var currentContext = "";
				
				if (!rec) {
					try {
						currentContext = lore.anno.ui.getCurrentSelection();
					} 
					catch (e) {
						lore.debug.anno("exception creating xpath for new annotation", e);
					}
				}
				
				
				if (rec) {
					lore.anno.addAnnotation(currentContext,  lore.anno.ui.currentURL, rec);
				}
				else {
					lore.anno.addAnnotation(currentContext, lore.anno.ui.currentURL);
				}
			} 
			catch (e) {
				lore.debug.anno(e, e);
			}
		}
		
		lore.anno.ui.handleEndImageSelection = function(img, sel) {
			if ((sel.x1 + sel.x2 + sel.y1 + sel.y2) == 0) 
				return;

				lore.anno.ui.setCurSelImage(img);
			 
		}
		
		/**
		 * Reset all changes made to annotation
		 */
		lore.anno.ui.handleCancelAnnotationEdit = function(){
			// reset all annotation form items to empty
			lore.anno.ui.form.items.each(function(item, index, len){
				item.reset();
			});
			
			if (lore.anno.ui.page.curSelAnno && lore.anno.isNewAnnotation(lore.anno.ui.page.curSelAnno)) {
				lore.anno.annods.remove(lore.anno.ui.page.curSelAnno);
			}
		}
		
		/**
		 * Save all annotation changes
		 */		
		lore.anno.ui.handleSaveAllAnnotationChanges = function(uri ){
			try {
				
				if (lore.anno.ui.page.curSelAnno &&
					(lore.anno.ui.form.isDirty() && 
					lore.anno.ui.form.findField('id').getValue() == lore.anno.ui.page.curSelAnno.data.id)) {
						lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno, true);
						//lore.anno.ui.form.updateRecord(lore.anno.ui.page.curSelAnno);
					
				}
							
				lore.anno.updateAnnotations(lore.anno.ui.currentURL, uri, function(anno, action, result, resultMsg){
					/*if (failures.length == 0) {
				 lore.anno.ui.loreInfo('Saved all annotation changes');
				 }
				 else {
				 lore.anno.ui.loreInfo("Could not update " + failures.length + " annotations.");
				 }
				 lore.debug.anno("Successfully updated " + successes.length + " annotations", successes);
				 lore.debug.anno("Failed to update " + failures.length + " annotations", failures);*/
					try {
						if (result == "success") {
							lore.anno.ui.loreInfo('Annotation ' + action + 'd.');
							lore.debug.anno(action + 'd ' + anno.data.title, anno);
						}
						else {
							lore.anno.ui.loreError('Unable to ' + action + ' annotation');
							lore.debug.anno('Unable to ' + action + ' annotation', resultMsg);
						}
					} 
					catch (e) {
						lore.debug.anno(e, e);
					}
				});
				
			} 
			catch (e) {
				lore.debug.anno(e, e);
			}
		}
		
		/**
		 * Save the currently selected annotation
		 */
		lore.anno.ui.handleSaveAnnotationChanges = function(){
		
			try {
			
				var anno = lore.anno.ui.page.curSelAnno;
				
				if (!anno) {
					lore.anno.ui.loreError('No annotation selected to save!');
					return;
				}
				
				// update existing annotation
				if (!lore.anno.isNewAnnotation(anno) && !lore.anno.ui.form.isDirty() && !anno.dirty ) {
					lore.anno.ui.loreWarning('Annotation content was not modified, save will not occur.');
					return;
				}
				
				// update anno with properties from form
				lore.anno.ui.updateAnnoFromRecord(anno, true);
				lore.anno.ui.form.reset(); // clear dirty flag
				
				// if the record isn't found on the current page tree and it's variation annotation
				// then need update to tree as it should appear once the save is complete 
				var refresh = anno.data.type == (lore.constants.NAMESPACES["vanno"] + "VariationAnnotation")
				&& 	(lore.anno.ui.findNode(anno.data.id, lore.anno.ui.treeroot) == null);
				
				
				lore.anno.updateAnnotation(anno, lore.anno.ui.currentURL, refresh, function(action, result, resultMsg){
				
					if (result == "success") {
						lore.anno.ui.loreInfo('Annotation ' + action + 'd.');
						lore.debug.anno(action + 'd ' + anno.data.title, resultMsg);
						
						// maybe need to replace this with firing event that when annotation 
						// is saved or 'cleaned' that UI elements are updated i.e highlight fields
						// are updated ( i.e the colour may change as it's based of creator name),
						// the annotation summary window needs to be updated etc.
						lore.anno.ui.updateUIElements(anno);
					}
					else {
						lore.anno.ui.loreError('Unable to ' + action + ' annotation');
						lore.debug.anno('Unable to ' + action + ' annotation', resultMsg);
					}
				});
				lore.anno.ui.setCurrentAnno(null);
				
				
				
			} 
			catch (e) {
				lore.debug.anno("Error updating saving annotation: " + e, e);
			}
		}
		
		
		/**
		 * Delete the currently selected annotation
		 */
		lore.anno.ui.handleDeleteAnnotation = function (){
	       if (lore.anno.ui.page.curSelAnno ){
		   	if ( lore.anno.ui.page.curSelAnnoStore == lore.anno.annodsunsaved) {
				 lore.anno.annodsunsaved.remove(lore.anno.ui.page.curSelAnno);
				 lore.anno.ui.setCurrentAnno(null, null);
				 return;
			}
		 
	       	var msg = 'Are you sure you want to delete this annotation forever?';
	       	if ( lore.anno.hasChildren(lore.anno.ui.page.curSelAnno) ) {
	       		//msg = "Are you sure you want to delete this annotation and its REPLIES forever?";
				lore.anno.ui.loreError("Delete the replies for this annotation first.");
				return;
	       	}
		   	Ext.MessageBox.show({
		   	
		   		title: 'Delete annotation',
		   		msg: msg,
		   		buttons: Ext.MessageBox.YESNO,
		   		fn: function(btn){
		   			if (btn == 'yes') 
		   				lore.anno.ui.handleDeleteAnnotation2();
		   		},
		   		icon: Ext.Msg.QUESTION
		   	});
		   }
	    }
		
		lore.anno.ui.handleDeleteAnnotation2 = function(){
			try {
				lore.debug.anno("deleting " + lore.anno.ui.page.curSelAnno);
				
				lore.anno.deleteAnnotation(lore.anno.ui.page.curSelAnno, function(result, resultMsg){
					if (result == 'success') {
						lore.debug.anno('Annotation deleted', resultMsg);
						lore.anno.ui.loreInfo('Annotation deleted');
					}
					else {
					
						lore.anno.ui.loreError('Unable to delete annotation');
					}
				});
				
				lore.anno.ui.hideAnnotation();
				lore.anno.ui.setCurrentAnno(null);
			} 
			catch (ex) {
				lore.debug.anno("Exception when deleting annotation", ex);
				lore.anno.ui.loreWarning("Unable to delete annotation");
			}
		}
		
		
		/**
		 * Search the annotation respository for the given filters on the search
		 * forms and display results in grid
		 */
		lore.anno.ui.handleSearchAnnotations = function () {
			
			var searchParams = { 
							  'creator':  lore.constants.DANNO_RESTRICT_CREATOR,
		 					  'datecreatedafter': lore.constants.DANNO_RESTRICT_AFTER_CREATED,
							  'datecreatedbefore': lore.constants.DANNO_RESTRICT_BEFORE_CREATED,
							  'datemodafter': 	lore.constants.DANNO_RESTRICT_AFTER_MODIFIED,
							  'datemodbefore': 	lore.constants.DANNO_RESTRICT_BEFORE_MODIFIED};
							  
			
			try {
				var vals = lore.anno.ui.sform.getValues();
				lore.debug.anno("vals: " + vals, vals);
				var filters = [];
				for (var e in vals) {
					var v = vals[e];
					
					if (v && e != 'url') {
						v = lore.anno.ui.sform.findField(e).getValue()
						if (e.indexOf('date') == 0) {
							v = v.format("c");
						}
						filters.push({
							attribute: searchParams[e],
							filter: v
						});
					}
				}
				lore.anno.ui.loreInfo("Searching...");
				lore.anno.searchAnnotations(vals['url']!='' ? vals['url']:null, filters, function(result, resp){
	 				lore.debug.anno("result from search: " + result, resp);
					lore.anno.ui.loreInfo("Search Finished");
					
					lore.anno.ui.sgrid.doLayout();
	 			});
			} catch (e) {
				lore.debug.anno("error occurring performing search annotations: " +e, e);
			}
			
		}
		
		lore.anno.ui.handleAddResultsToCO = function(evt){
			try {
				var sels = lore.anno.ui.sgrid.getSelectionModel().getSelections();
				for (var i =0; i < sels.length; i++ ) {								
                var rec = sels[i];
				lore.global.ui.compoundObjectView.get(window.instanceId).addFigure(rec.data.id,
                {"rdf:type_0":rec.data.type});
				}
			} catch (e ){
				lore.debug.anno("Error adding node/s to compound editor:" + e, e);
			}
		}
		
		/**
		 * Update the annotation xpath context
		 * @param {Object} btn Not currently used
		 * @param {Object} e Not currently used
		 */
		lore.anno.ui.handleUpdateAnnotationContext = function(){
			try {
				if (!lore.anno.ui.formpanel.isVisible())
					 lore.anno.ui.showAnnotation(lore.anno.ui.page.curSelAnno);
				var currentCtxt = lore.anno.ui.getCurrentSelection();
				var theField = lore.anno.ui.form.findField('context');
				theField.setValue(currentCtxt);
				theField = lore.anno.ui.form.findField('originalcontext');
				theField.setValue(currentCtxt);
				theField = lore.anno.ui.form.findField('res');
				theField.setValue(lore.anno.ui.currentURL);
				if ( lore.anno.ui.page.curSelAnno)
					lore.anno.ui.page.curSelAnno.data.resource = lore.anno.ui.currentURL;
				theField = lore.anno.ui.form.findField('original');
				theField.setValue(lore.anno.ui.currentURL);
				theField = lore.anno.ui.form.findField('contextdisp');
				theField.setValue('"' + lore.global.util.getSelectionText(currentCtxt, lore.global.util.getContentWindow(window).document) + '"');
			} 
			catch (ex) {
				lore.debug.anno("Exception updating anno context", ex);
			}
		}
		/**
		 * Update the variation annotation xpath context
		 * @param {Object} btn Not currently used
		 * @param {Object} e Not currently used
		 */
		lore.anno.ui.handleUpdateAnnotationVariantContext = function(btn, e){
			try {
				var currentCtxt = lore.anno.ui.getCurrentSelection();
				var theField = lore.anno.ui.form.findField('variantcontext');
				theField.setValue(currentCtxt);
				theField = lore.anno.ui.form.findField('variant');
				theField.setValue(lore.anno.ui.currentURL);
				theField = lore.anno.ui.form.findField('rcontextdisp');
				theField.setValue('"' + lore.global.util.getSelectionText(currentCtxt, lore.global.util.getContentWindow(window).document) + '"');
			} 
			catch (ex) {
				lore.debug.anno("Exception updating anno variant context", ex);
			}
		}
		
		/**
		 * Update the form when the annotation type changes
		 * @param {Combo} combo The Combo field that has changed
		 */
		lore.anno.ui.handleAnnotationTypeChange = function(combo){
			var theVal = combo.getValue();
			
			if ( theVal == 'Variation'){
				lore.anno.ui.setAnnotationFormUI(true, false);
			} else if ( theVal == 'Semantic') {
				lore.anno.ui.setAnnotationFormUI(false, true);
			}
			else if (theVal == 'Question' ||  theVal == 'Comment' || theVal == 'Explanation' ) {
					lore.anno.ui.setAnnotationFormUI(false, false);
			}
		}
		
		lore.anno.ui.handleUpdateMetaSelection = function () {
			try {
			 
				try {
					var triple = lore.anno.ui.rdfa.triples[this.getAttribute("rdfIndex")];
					
					if (triple) 
						lore.anno.ui.page.curSelAnno.data.meta.context = lore.global.util.getMetaSelection(triple);
						
					lore.debug.anno("meta-context set to: " + lore.anno.ui.page.curSelAnno.data.meta.context, {
						val: triple,
						ctx: lore.anno.ui.page.curSelAnno.data.meta.context
					});
					
					var theField = lore.anno.ui.form.findField('metares');
					theField.setValue(lore.anno.ui.tripleURIToString(triple.property));
				} catch (e ) {
					lore.debug.anno(e,e);
				}
				lore.anno.ui.setVisibilityForPageTriples(false);
				
			} catch (e) {
				lore.debug.anno(e,e);
			}
		}
		
		lore.anno.ui.handleUpdateMetaObject = function () {
					try {
			 
				try {
					var triple = lore.anno.ui.rdfa.triples[this.getAttribute("rdfIndex")];
					
					//TODO: This needs to be changed to store object not triple
					if (triple) 
						lore.anno.ui.page.curSelAnno.data.meta.context = lore.global.util.getMetaSelection(triple);
						
					lore.debug.anno("meta-context set to: " + lore.anno.ui.page.curSelAnno.data.meta.context, {
						val: triple,
						ctx: lore.anno.ui.page.curSelAnno.data.meta.context
					});
					
					var theField = lore.anno.ui.form.findField('metares');
					theField.setValue(lore.anno.ui.tripleURIToString(triple.object));
				} catch (e ) {
					lore.debug.anno(e,e);
				}
				lore.anno.ui.setVisibilityForPageTriples(false);
				
			} catch (e) {
				lore.debug.anno(e,e);
			}
		}
		
		
		lore.anno.ui.handleChangeMetaSelection = function () {
			 try {
			 	if (!lore.anno.ui.rdfa) {
			 		lore.anno.ui.gleanRDFa();
			 	}
			 	
			 	if (!lore.anno.ui.metaSelections) 
			 		lore.anno.ui.metaSelections = [];
					
				if (lore.anno.ui.metaSelections.length == 0)
					lore.anno.ui.setVisibilityForPageTriples(true);
				else
					lore.anno.ui.setVisibilityForPageTriples(false);
			} catch (e) {
				lore.debug.anno(e,e);
			}
		}	
		
		lore.anno.ui.tripleURIToString = function ( prop) {
			prop = prop.toString();
			if ( prop.indexOf('#')!=-1)
				prop = prop.substring(prop.indexOf("#") + 1, prop.length - 1);
			else if ( prop.lastIndexOf("/")!=-1) {
				prop = prop.substring(prop.lastIndexOf("/")+1, prop.length -1);
			}
			return prop;
		}
		/*lore.anno.ui.tripleToString = function (triple, rdf, parent) {
				rdf = rdf ||  lore.anno.ui.rdfa.rdf;
				
					if (triple.property.toString().indexOf("#type") == -1 ) {
						var val = triple.object.value.toString();
						
						if (triple.object.type == 'uri') {
							val = lore.anno.ui.tripleURIToString(triple.object.value);
						}
						var prop = lore.anno.ui.tripleURIToString(triple.property);
						if ( val.length > 50)
							val = val.substring(0,50) + "...";
						
						var sub = parent || triple.parentSubject.toString();
						sub = lore.anno.ui.tripleURIToString(sub);
						
						return sub + "->" + prop + ": " + val;
					}
				return '';
		}*/
				
		/**
		 * Launch field value in a new window
		 * @param {Field} field Form field to launch in a new window
		 */
		lore.anno.ui.launchFieldWindow = function(field){
			lore.global.util.launchWindow(field.value, true, window);
		}
		
		
		
		/**
		 * Show the variation splitter for the current/supplied annotation
		 * @param {Record} rec (Optional)The annotation to show in the splitter window. Defaults to currently
		 * selected annotation
		 */
		lore.anno.ui.showSplitter = function (rec) {
			if (!rec) {
				rec = lore.anno.ui.page.curSelAnno;
			} else if ( typeof(rec) == 'string') {
				rec = lore.global.util.findRecordById(lore.anno.annods, rec);
			}
			lore.anno.ui.updateSplitter(rec, true);
		}
		
		/**
		 * Update the variation splitter for the supplied annotation
		 * @param {Record} rec The annotation to update in the splitter window. 
		 * @param {Boolean} show Specifies whether the variation window is to be made visible
		 */
		lore.anno.ui.updateSplitter =  function (rec, show) {
						
			try {
				
				if (rec.data.variant) {
					// show splitter
					var ctx = null;
					var title = '';
					if (rec.data.original == lore.anno.ui.currentURL) {
						ctx = rec.data.variant;
						title = "Variation Resource";
					}
					else {
						ctx = rec.data.original;
						title = "Original Resource";
					}
					
					lore.anno.ui.topView.updateVariationSplitter(ctx, title, show, function(){
						// when page has loaded perform the following
						try {
							lore.anno.ui.hideMarker();
							var cw = lore.anno.ui.topView.getVariationContentWindow();
							lore.anno.ui.enableImageHighlightingForPage(cw);
							lore.anno.ui.highlightCurrentAnnotation(rec);
							
							var n = 'rcontextdisp';
							var ctx = rec.data.variantcontext;
							if (rec.data.variant == lore.anno.ui.currentURL) {
								n = 'contextdisp';
								ctx = rec.data.context;
							}
							
							var selText = '';
							try {
								lore.debug.anno('updateVariationSplitter: ' + ctx);
								selText = lore.global.util.getSelectionText(ctx, cw.document);
							} 
							catch (e) {
								lore.debug.anno(e, e);
							}
							lore.anno.ui.form.setValues([{
								id: n,
								value: '"' + selText + '"'
							}]);
						} catch(e){
							lore.debug.anno("updateVariationSplitter-callback: " + e, e);
						}
					});
				}
			} catch (e ) {
				lore.debug.anno(e, e);
			}
		}
	
		lore.anno.ui.updateUIUnsavedChanges = function(store,records, options) {
		try {
			// add
				if (records.length == 1 ) {
					lore.debug.anno("updateUI() - add", records);
					var rec = records[0];
					var node;
					
					node = lore.anno.ui.createAndInsertTreeNode(rec.data, '-unsaved', lore.anno.ui.treeunsaved, lore.anno.annodsunsaved);
						
					// update the currently selected annotation before the focus is taken off it
					// for the newly created annotation
					if (lore.anno.ui.page.curSelAnno &&
						((lore.anno.ui.form.isDirty()||
							lore.anno.isNewAnnotation(lore.anno.ui.page.curSelAnno)) && 
							lore.anno.ui.form.findField('id').getValue() == lore.anno.ui.page.curSelAnno.data.id)) {
							
							lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
					}
					
					if (!lore.anno.ui.formpanel.isVisible()) {
					
						lore.anno.ui.formpanel.show();
					}
					lore.anno.ui.showAnnotation(rec);
				
					node.ensureVisible();
					lore.anno.ui.setCurrentAnno(rec, lore.anno.annodsunsaved);
					
					node.select();
				//	if ( rec.dirty)
				//		node.getUI().addClass("annochanged");
					
				}
			}
			catch (e) {
				lore.debug.ui("Error loading annotation tree view: " + e, e);
			}
		}
		/**
		 * Notification function called when a load operation occurs in the store.
		 * This is called when annotations are loaded in bulk from the server or when
		 * an individual annotation was added by a user.  Adds one or more nodes to the
		 * tree
		 * @param {Store} store The data store that created the notification
		 * @param {Array} records The list of records that have been added to the store
		 * @param {Object} options Not used
		 */
		lore.anno.ui.updateUI = function(store, records, options){
			
			
			try {
				
					lore.debug.anno("updateUI() - load", records);
					for (var i = 0; i < records.length; i++) {
						var rec = records[i];
						var anno = rec.data;
						
						try {
							var node = lore.anno.ui.createAndInsertTreeNode(anno, '', null, lore.anno.annods);
							//lore.debug.anno('eh?');
						//	if (rec.dirty) {
						//		node.getUI().addClass("annochanged");
						////		lore.debug.anno('huh?');
						//	}
						} 
						catch (e) {
							lore.debug.anno("error loading: " + rec.id, e);
						}
					}
					lore.anno.ui.scheduleTimelineLayout();
					lore.anno.ui.updateUIElements();
				//}
				
				if (!lore.anno.ui.treeroot.isExpanded()) {
					lore.anno.ui.treeroot.expand();
				}
				
			} 
			catch (e) {
				lore.debug.ui("Error loading annotation tree view: " + e, e);
			}
		}
		
		/**
		 * Notification function called when a clear operation occurs in the store.
		 * Clears the tree.
		 * @param {Store} store The data store that performed the notification
		 */
		lore.anno.ui.updateUIOnClear = function(store) {
			var tree = lore.anno.ui.treeroot.getOwnerTree();
			lore.anno.ui.treeroot = new Ext.tree.TreeNode({});
			tree.setRootNode(lore.anno.ui.treeroot);
			lore.anno.ui.annoEventSource.clear();
		}
		
		lore.anno.ui.updateUIOnRefresh = function (store) {
			lore.anno.ui.updateUIOnClear(store);
			lore.anno.ui.updateUI(store, store.getRange());
		}
		
		

	lore.anno.ui.findNode = function (id, tree){
		if( tree) {
			return lore.global.util.findChildRecursively( tree, 'id', id);
		}
		var n = lore.global.util.findChildRecursively( lore.anno.ui.treeunsaved, 'id', id + "-unsaved");
		if (!n ) 
			n = lore.global.util.findChildRecursively(lore.anno.ui.treeroot, 'id', id );
		
		return n;
	}
  	/**
		 * Notification function  called when a remove operation occurs in the store.
		 * Removes a node from the tree and the timeline.
		 * @param {Store} store The data store that performed the notification
		 * @param {Record} rec  The record for the annotation that has been removed
		 * @param {Integer} index Not used
		 */
		lore.anno.ui.updateUIOnRemove = function(store, rec, index){
			try {
				var node = lore.anno.ui.findNode(rec.data.id, lore.anno.ui.treeroot);
				if (node) {
					node.remove();
				}
				
				if (!lore.anno.isNewAnnotation(rec)) {
				
					// remove from timeline
					
					var evt = lore.anno.ui.annoEventSource.getEvent(rec.data.id);
					if (evt) {
						evt._eventID = "flagdelete";
						lore.anno.ui.scheduleTimelineLayout();
					}
				}
			} 
			catch (e) {
				lore.debug.ui("Error removing annotation from tree view: " + e, e);
			}
		}
		
		lore.anno.ui.updateUIOnRemoveUnsavedChanges = function(store, rec, index) {
			try {
				var node = lore.anno.ui.findNode(rec.data.id + '-unsaved', lore.anno.ui.treeunsaved );
				if (node) {
					node.remove();
				} else {
					lore.debug.anno("node not found to remove: " + rec.data.id);
				}
			} 
			catch (e) {
				lore.debug.ui("Error removing annotation from tree view: " + e, e);
			}
		}
		
		/**
		 * Notification function called when an update operation occurs in the store
		 * Update the values of a node in tree
		 * @param {Object} store The datastore that perofmred the notification
		 * @param {Object} rec The record of the annotation that has changed
		 * @param {Object} operation The update operation that occurred to the record
		 */
		lore.anno.ui.updateUIOnUpdate = function(store, rec, operation){
			
			try {
				var node = lore.anno.ui.findNode(rec.data.id, lore.anno.ui.treeroot);
				
				if (!node) {
					return;
				}
				
			/*	if (rec.dirty) {
					if (operation == Ext.data.Record.EDIT) {
						node.getUI().addClass("annochanged");
					}
				}
				if ( operation == Ext.data.Record.COMMIT || 
						( operation == Ext.data.Record.REJECT 
						&& !lore.anno.isNewAnnotation(rec)) ) {
						
						node.getUI().removeClass("annochanged");
				}*/
				
				var info = ' ';
			//	if (!lore.anno.isNewAnnotation(rec)) {
					info = lore.anno.ui.genAnnotationCaption(rec.data, 'by c, d r')
			//	}
			/*	else if (lore.anno.isNewAnnotation(rec)) {
					var url = rec.data.resource; 
					if ( url != lore.anno.ui.currentURL) {
						info = "Unsaved annotation from " + url;
					}
				} */
				node.setText(rec.data.title, info,'', lore.anno.ui.genTreeNodeText(rec.data, lore.anno.annods));
				lore.anno.ui.updateAnnoInTimeline(rec.data);
				if ( lore.anno.ui.page.curSelAnno == rec )
					lore.anno.ui.showAnnotation(rec, true);
				
				
			} 
			catch (e) {
				lore.debug.ui("Error updating annotation tree view: " + e, e);
			}
		}
		
		lore.anno.ui.updateUIOnUpdateUnsavedChanges = function(store, rec, operation){
			
			try {
				var node = lore.anno.ui.findNode(rec.data.id + "-unsaved", lore.anno.ui.treeunsaved);
				
				if (!node) {
					return;
				}
				var info = ' ';
				
				//TODO: repplies resource url etc
				if (rec.data.resource != lore.anno.ui.currentURL) {
					info = "Unsaved annotation from " + rec.data.resource + " ";
				}
				
				if (!lore.anno.isNewAnnotation(rec)) {
					info = info + lore.anno.ui.genAnnotationCaption(rec.data, 'by c, d r')
				}
				
				node.setText(rec.data.title, info,'', lore.anno.ui.genTreeNodeText(rec.data, lore.anno.annodsunsaved));
				lore.anno.ui.updateAnnoInTimeline(rec.data);
				if ( lore.anno.ui.page.curSelAnno == rec )
					lore.anno.ui.showAnnotation(rec, true);
				
			} 
			catch (e) {
				lore.debug.ui("Error updating annotation tree view: " + e, e);
			}
		}
		
		
		
		
		/**
		 * When an annotation is selected in the tree this function is called. The annotation
		 * is loaded into the form. It is highlighted on the current content window's document and if
		 * it's a variation annotation the splitter is shown
		 * @param {Node} node The tree node that was selected
		 * @param {Object} event Not Used
		 */
		lore.anno.ui.handleAnnotationSelection = function(node, event){
		
			try {
				// byproduct of this is that if unsaved version exists of this node, that is selected
				// instead of the node that was selected in current page.
				var unsavedNode = node.isAncestor(lore.anno.ui.treeunsaved);
				//lore.debug.anno("unsavedNode? " + unsavedNode + "n: " + node.getPath(), node);
				
				var store = unsavedNode ? lore.anno.annodsunsaved : lore.anno.annods;
				
				var rec = lore.global.util.findRecordById(store, lore.anno.ui.recIdForNode(node));
				
				if ( rec == lore.anno.ui.page.curSelAnno )
					return;
				
				if (lore.anno.ui.page.curSelAnno &&
				(lore.anno.ui.form.isDirty() ||
				lore.anno.isNewAnnotation(lore.anno.ui.page.curSelAnno))) {
					lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
				}
				
				if (rec == null) { // if they select root element, if it's shown 
					lore.anno.ui.setCurrentAnno(null);
					return;
				}
				
				lore.anno.ui.setCurrentAnno(rec, store);
				 
				if ( lore.anno.ui.topView.variationContentWindowIsVisible() &&
					 lore.anno.ui.page.curSelAnno.data.type == lore.constants.NAMESPACES["vanno"] + "VariationAnnotation") {
					 lore.anno.ui.showSplitter();	
				} else {
					lore.anno.ui.highlightCurrentAnnotation(rec);
				}
				
				lore.anno.ui.formpanel.hide();
				Ext.getCmp("treeview").doLayout();				
			} 
			catch (e) {
				lore.debug.anno("Error occurred highlightling " + e, e);
			}
			
		}
		
		/**
		 * Reply to an annotation. Add the reply to the local store. 
		 * @param {Object} arg (Optional) The parent annotation. A string containing the annotation id or if not supplied defaults
		 * to the currently selected annotation
		 */
		lore.anno.ui.handleReplyToAnnotation = function(arg){
			lore.anno.ui.views.activate('treeview');
			try {
				var rec;
				if (!arg) { //toolbar
					rec = lore.anno.ui.page.curSelAnno;
					if (!rec)
						return;
				}
				else if (typeof(arg) == 'string') {  // timeline
					rec = lore.global.util.findRecordById(lore.anno.annods, arg);
					if ( rec) lore.anno.ui.setCurrentAnno(rec);//lore.anno.ui.page.curSelAnno = rec;
				}
					
				if (!rec) {
					lore.debug.anno("Couldn't find record to reply to: " + arg, arg);
					return;
				}
				
				if ( lore.anno.isNewAnnotation(rec) ) {
					lore.anno.ui.loreError("Save the annotation first before replying to it.");
					return;
				}
				lore.anno.ui.handleAddAnnotation(rec);
			} 
			catch (e) {
				lore.debug.anno(e, e);
			}
		}
		
		
		/**
	 	* Load the annoation in the form editor and show the editor.
	 	* @param {Object} annoid (Optional) A string or Annotation object supplying the annotation
	 	* to be editted. Defaults to the currently selected annotation.
	 	*/
		lore.anno.ui.handleEditAnnotation = function(arg){
			lore.anno.ui.views.activate('treeview');
			//TODO: this function needs to be reworked, too brittle, too many
			// weird errors
			var rec;
			var treeroot = lore.anno.ui.treeroot;
			try {
				if (!arg) { // no argument supplied, via the toolbar
					rec = lore.anno.ui.page.curSelAnno
					if (!rec)
						return;
					if (lore.anno.ui.page.curSelAnnoStore == lore.anno.annodsunsaved) {
						treeroot = lore.anno.ui.treeunsaved;
					}
				}
				else if (typeof(arg) == 'string') { // via timeline
						rec = lore.global.util.findRecordById(lore.anno.annods, arg);
				}
				else { // treenode supplied
					if (arg.isAncestor(lore.anno.ui.treeunsaved) ){
						//store =  lore.anno.annodsunsaved;
						treeroot = lore.anno.ui.treeunsaved;
						rec = lore.global.util.findRecordById(lore.anno.annodsunsaved, lore.anno.ui.recIdForNode(arg));
					} else {
					//	store =  lore.anno.annods;
						// check if there's an unsaved copy and use that instead for editing
						rec = lore.global.util.findRecordById(lore.anno.annodsunsaved, lore.anno.ui.recIdForNode(arg));
						if (!rec)
							rec = lore.global.util.findRecordById(lore.anno.annods, lore.anno.ui.recIdForNode(arg));
						else
							lore.anno.ui.setCurrentAnno(rec, lore.anno.annodsunsaved);
					}
					
					//rec = lore.global.util.findRecordById(store, arg.id);
					//rec = lore.glbal.util.findRecordById(store, lore.anno.ui.recIdForNode(arg));
					//lore.debug.anno('w', {s:store, r:rec, arg: arg});
				}
				
				if (!rec) {
					lore.debug.anno("Couldn't find record to edit: " + arg, arg);
					return;
				}
				
				var node = lore.anno.ui.findNode(rec.data.id);

				if (node) {
					
					lore.anno.ui.showAnnotation(rec);
					node.ensureVisible();
					node.select();
				} else {
					lore.debug.anno("Couldn't find node: " + arg, treeroot);
				}
			}
			catch (e ) {
				lore.debug.anno(e,e);
			}
		}
		
	} catch(e ) {
		alert(e + " " + e.stack);
	}


lore.anno.ui.handleAddMeta = function () {
			try {
					var defRec = new lore.anno.annousermetads.recordType({
						type: 'Agent',
						source: 'User',
						prop: 'displayName',
						value: ''
					})
					
					lore.anno.annousermetads.add(defRec);
				
			} catch (e) {
				lore.debug.anno(e,e );
			}
		}
		
		lore.anno.ui.handleRemData = function () {
			var rec = lore.anno.ui.metausergrid.getSelectionModel().getSelected();
			if ( rec) {
				lore.anno.annousermetads.remove(rec);
			}
		}
		
	/**
	 * Serialize the annotations on the page into the supplied format to a file.  Opens a save as
	 * dialog to allow the user to select the file path.
	 * @param {String} format The format to serialize the annotations into. 'rdf' or 'wordml'.
	 */
	lore.anno.ui.handleSerialize = function (format ) {
		 var fileExtensions = {
	        "rdf": "xml",
	        "wordml": "xml"
	    }
		if ( !format) {
			format = "rdf";
		}
		try {
			if ( lore.anno.ui.page.curSelAnno) lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
			var fobj = lore.global.util.writeFileWithSaveAs("Export Annotations (for current page) as", fileExtensions[format], 
												function(){
													return lore.anno.serialize(format);
												},window);
			if ( fobj) lore.anno.ui.loreInfo("Annotations exported to " + fobj.fname);
		} catch (e ) {
			lore.debug.anno("Error exporting annotations: " + e, e );
			lore.anno.ui.loreError("Error exporting annotations: " + e);
		}
	}
	
	/**
	 * Import annotations from an xml file in RDF format.  Provides an Open Dialog for the user
	 * to supply the file path.
	 */
	lore.anno.ui.handleImportRDF = function () {
		
			var fObj = lore.global.util.loadFileWithOpen("Select Annotations RDF/XML file", {
				desc: "RDF documents",
				filter: "*.rdf"
			}, window);
			
			if (fObj) {
					Ext.MessageBox.show({
		   	
		   		title: 'Import and save annotations?',
		   		msg: "This will import and SAVE the annotations to the server. Do you wish to proceed?",
		   		buttons: Ext.MessageBox.YESNO,
		   		fn: function(btn){
		   			if (btn == 'yes') 
		   				lore.anno.ui.handleImportRDF2(fObj.data);
		   		},
		   		icon: Ext.Msg.QUESTION
		   	});
			}
		
	}
	
	lore.anno.ui.handleImportRDF2 = function(theRDF){
		try {
			var output = function(result, resultMsg){
				if ( result == 'success') {
					lore.anno.ui.loreInfo("Successfully imported all annotations");		
				} else if ( result == 'fail') {
					lore.anno.ui.loreError("Failed to import all annotations: " + resultMsg, resultMsg);
				}
			};
			lore.anno.ui.loreInfo("Importing annotations...");
			lore.anno.importRDF(theRDF, lore.anno.ui.currentURL, output);
		} catch(e) {
			lore.debug.anno("Error importing annotations: " + e, e);
			lore.anno.ui.loreError("Error importing annotations: " + e );
		}
	}
	
	lore.anno.ui.handleClose = function(uri) {
		lore.anno.ui.handleSaveAllAnnotationChanges(uri);
	}
	
	lore.anno.ui.isDirty = function () {
		lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
		return lore.anno.annodsunsaved.getCount() > 0;
	}
	lore.anno.ui.refreshPage = function () {
		lore.debug.anno("page refreshed");
		
		//lore.anno.ui.initPageData();
		lore.anno.ui.page.clear();
		lore.anno.ui.enableImageHighlightingForPage();
		 
		lore.anno.ui.setCurrentAnno(null);
		
		//TODO: unselect a currently selected node from the tree and make sure curselanno is empty
		
	}
	
	/**
	 * Notifiation function called when a change in location is detected in the currently
	 * selected tab
	 * @param {String} contextURL The url the currently selected browser tab is now pointing to    
	 */
	lore.anno.ui.handleLocationChange = function(contextURL) {
			var oldurl = lore.anno.ui.currentURL + '';
			lore.anno.ui.currentURL = contextURL;
			if (!lore.anno.ui.initialized ||	!lore.anno.ui.lorevisible)
					return;
				
			var initialLoad = oldurl == lore.anno.ui.currentURL;
						
			lore.debug.anno("handleLocationChange: The uri is " + lore.anno.ui.currentURL);
			
			
			
			if ( !initialLoad ) {
			try{
				lore.debug.anno("Setting/Getting cached annotation page data");
				
				//lore.anno.ui.page.store(oldurl);
				
				//TODO: need some de-/serialization function with an array of variable names instead of this
		/*		var update_ds = {
					multiSelAnno: lore.anno.ui.page.multiSelAnno.slice(),
					colourForOwner: lore.global.util.clone(lore.anno.ui.page.colourForOwner),
					colourCount: lore.anno.ui.page.colourCount,
					curSelAnnoId: lore.anno.ui.page.curSelAnno ? lore.anno.ui.page.curSelAnno.data.id:null,
					curAnnoMarkers: lore.anno.ui.page.curAnnoMarkers.slice(),
					curImage: lore.anno.ui.page.curImage,
					//rdfa: lore.global.util.clone(lore.anno.ui.rdfa) 
				};
				
				lore.global.store.set(lore.constants.HIGHLIGHT_STORE, update_ds, oldurl);*/
				
				lore.anno.ui.page.store(oldurl);
				
				lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
				
				// tag any unsaved new annotations for the new page
				lore.anno.annodsunsaved.each(function(rec){
					//if (lore.anno.isNewAnnotation(rec)) {
						var n = lore.anno.ui.findNode(rec.data.id + "-unsaved", lore.anno.treeunsaved); 
						if ( n) 
							n.setText(rec.data.title, "Unsaved annotation from " + rec.data.resource, '', lore.anno.ui.genTreeNodeText(rec.data, lore.anno.annodsunsaved));
						else {
							lore.debug.anno("modified/new annotation not found in unsaved window. This is incorrect. " + rec.data.id );
						}
					//}
				})
				
				if (lore.anno.ui.page.curSelAnno) {
					if (!lore.anno.isNewAnnotation(lore.anno.ui.page.curSelAnno)) {
						lore.anno.ui.hideAnnotation();
					}
				}
				
				lore.anno.ui.page.load(contextURL, true);
				/*var ds = lore.global.store.get(lore.constants.HIGHLIGHT_STORE, contextURL);
				if (ds) {
					lore.anno.ui.page.multiSelAnno = ds.multiSelAnno;
					lore.anno.ui.page.colourForOwner = ds.colourForOwner;
					lore.anno.ui.page.colourCount = ds.colourCount
					var curSelAnnoId = ds.curSelAnnoId;
					lore.anno.ui.page.curAnnoMarkers = ds.curAnnoMarkers;
					lore.anno.ui.page.curImage = ds.curImage;
					//lore.anno.ui.rdfa = ds.rdfa;
					
					//TODO: should find unsaved version first?
					var rec = lore.global.util.findRecordById(lore.anno.annods, curSelAnnoId);
					if (rec) {
						lore.anno.ui.page.curSelAnno = rec;
					}
					*/
					
			//	} else {
				//	lore.anno.ui.page.clear();//lore.anno.ui.initPageData();
				//}
			lore.anno.ui.rdfa = null;	
			} catch (e ) {
				lore.debug.anno(e,e);
			}
			
		}else {
			lore.anno.ui.page.clear();//lore.anno.ui.initPageData();
		}
		
		try {
			lore.anno.ui.enableImageHighlightingForPage();
			lore.anno.ui.checkRDFaEnabled();
			lore.anno.ui.loreInfo("Loading annotations for " + contextURL);
			lore.anno.updateAnnotationsSourceList(contextURL, function(result, resultMsg){
				if (result == 'fail') {
					lore.anno.annods.each(function(rec){
						lore.anno.annods.remove(rec);
					});
					lore.anno.ui.loreError("Failure loading annotations for page.");
				}
			});
			lore.anno.ui.annoEventSource.clear();
		} catch(e) {
			lore.debug.anno(e,e);
		}
		lore.anno.ui.loadedURL = contextURL;
	}


