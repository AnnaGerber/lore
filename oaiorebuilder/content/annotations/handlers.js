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
 * @include  "/oaiorebuilder/content/annotations/annotations.js"
 * @include  "/oaiorebuilder/content/debug.js"
 * @include  "/oaiorebuilder/content/util.js"
 * @include  "/oaiorebuilder/content/uiglobal.js"
 * @include  "/oaiorebuilder/content/constants.js"
 */

	try {
	
		/**
		 * 
		 * @param {Object} args
		 */
		lore.anno.ui.handlePrefsChange = function (args ) {
			lore.anno.ui.disableUIFeatures({disable: args.disable});
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
				var cc = lore.anno.ui.pageui.getCreatorColour(lore.anno.ui.page.curSelAnno.data.creator);
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
				lore.anno.ui.pageui.toggleAllAnnotations();
			}
			if ( lore.anno.ui.page.curAnnoMarkers.length > 0) {
				for (var i = 0; i < lore.anno.ui.page.curAnnoMarkers.length; i++) {
					lore.anno.ui.page.curAnnoMarkers[i].hide();
				}
			}
		}
		
		lore.anno.ui.hasModifiedAnnotations = function () {
			lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
			return lore.anno.annodsunsaved.getCount() > 0;
		}
		
		/* Form Editor Handler Functions */
		
		
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
		// save - Shared handler handleSaveAnnotationChanges
		// delete - Shared Handler handleDeleteAnnotation
		
		
		/**
		 * Update the annotation object to use the values from the
		 * form
		 * @param {Record} rec The annotation to update
		 */
		lore.anno.ui.updateAnnoFromRecord = function(rec, updatereal){
			var form = lore.anno.ui.formpanel.form;
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
				if (!unsavedRec && ( rec.data.isNew() || lore.anno.ui.isFormDirty(form))) {
				
					//var anno = lore.anno.addAnnotation(null, rec.data.resource, null);
					var clone = {};
					// shallow clone
					for (var e in rec.data) {
						clone[e] = rec.data[e];
					}
					
					
					lore.anno.annodsunsaved.loadData([clone], true);
					unsavedRec = lore.global.util.findRecordById(lore.anno.annodsunsaved, rec.data.id);
				 
				}
			}
			
			if (unsavedRec) {
				form.updateRecord(unsavedRec);
				lore.debug.anno("Annotation record updated.");
			}
			
			form.reset(); // clear dirty flag
			
		}
				
		/**
		 * Attach context menu events to a tree node
		 * @param {TreeNode} childNode  The tree node to attach the events to
		 */
		lore.anno.ui.attachAnnoCtxMenuEvents = function(tree, thus, childNode, index){
			 
			 childNode.on('contextmenu', function(node, ev){
			 	node.select();
			 });
			 
			 
			 childNode.on('contextmenu', function(node, e){
			 	if (!node.contextmenu) {
				 node.contextmenu = new Ext.menu.Menu({
				 id: node.id + "-context-menu"
			 	});
			 
			 var isNew = lore.global.util.findRecordById(lore.anno.annods, lore.anno.ui.recIdForNode(node)).data.isNew();
			 
				if (!isNew) {
					node.contextmenu.add({
						text: "Show in Timeline",
						handler: function(evt){
							lore.anno.ui.timeline.showAnnoInTimeline(node.id);
						},
						id:'timelineshow_' + node.id
					});
					node.contextmenu.add({
						text: "Reply to annotation",
						handler: function(evt){
							lore.anno.ui.handleReplyToAnnotation(node.id);
						},
						id: 'reply_' + node.id
					});
				}
				
								 
				 node.contextmenu.add({
				 text: "Edit annotation",
				 handler: function(evt){
				 	lore.anno.ui.handleEditTreeNode(node);
				 },
				 id: 'edit_' + node.id
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
						currentContext = lore.anno.ui.pageui.getCurrentSelection();
					} 
					catch (e) {
						lore.debug.anno("exception creating xpath for new annotation", e);
					}
				}
				
				
				if (rec) {
					lore.anno.annoMan.addAnnotation(currentContext,  lore.anno.ui.currentURL, rec);
				}
				else {
					lore.anno.annoMan.addAnnotation(currentContext, lore.anno.ui.currentURL);
				}
			} 
			catch (e) {
				lore.debug.anno(e, e);
			}
		}
		
		
		lore.anno.ui.handleNewAnnotation = function(tree, thus, childNode, index){
			var rec = lore.global.util.findRecordById(lore.anno.annodsunsaved, lore.anno.ui.recIdForNode(childNode));

			// update the currently selected annotation before the focus is taken off it
			// for the newly created annotation
			if (lore.anno.ui.page.curSelAnno &&	(lore.anno.ui.formpanel.isDirty() || 
				lore.anno.ui.page.curSelAnno.data.isNew())) {
				lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
			}
			
			lore.anno.ui.formpanel.show(rec);
			Ext.getCmp("treeview").doLayout();
			lore.anno.ui.page.setCurrentAnno(rec, lore.anno.annodsunsaved);
		}
		
		lore.anno.ui.handleAttachNodeLinks = function(tree, thus, n, index){ 
			try {
				var anno = lore.global.util.findRecordById(lore.anno.annods, n.id).data;
				
				var nodeLinks = [{
					title: 'View annotation body in a new window',
					iconCls: 'anno-icon-launchWindow',
					jscript: "lore.global.util.launchWindow('" + anno.bodyURL + "',false, window);"
				}, {
					title: 'View annotation in the timeline',
					iconCls: 'anno-icon-timeline',
					jscript: "lore.anno.ui.timeline.showAnnoInTimeline('" + anno.id + "');"
				}];
				
				if (lore.global.util.splitTerm(anno.type).term == 'VariationAnnotation') {
					nodeLinks.push({
						title: 'Show Variation Window',
						iconCls: 'anno-icon-splitter',
						jscript: "lore.anno.ui.showSplitter('" + anno.id + "');"
					});
				}
				n.links = nodeLinks;
			} catch(e ) {
				lore.debug.anno('append: ' + e, e);
			}
		}
		
		/**
		 * Save all annotation changes
		 */		
		lore.anno.ui.handleSaveAllAnnotationChanges = function(uri ){
			try {
				
				if (lore.anno.ui.page.curSelAnno && lore.anno.ui.formpanel.isDirty()) {
					lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno, true);
				}

				lore.anno.annoMan.updateAnnotations(lore.anno.ui.currentURL, uri, function(action, result, resultMsg, anno){
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
				if (!anno.data.isNew() && !lore.anno.ui.formpanel.isDirty() && !anno.dirty ) {
					lore.anno.ui.loreWarning('Annotation content was not modified, save will not occur.');
					return;
				}
				
				// update anno with properties from form
				lore.anno.ui.updateAnnoFromRecord(anno, true);
				
				
				// if the record isn't found on the current page tree and it's variation annotation
				// then need update to tree as it should appear once the save is complete 
				var refresh = anno.data.type == (lore.constants.NAMESPACES["vanno"] + "VariationAnnotation")
				&& 	(lore.anno.ui.findNode(anno.data.id, lore.anno.ui.treeroot) == null);
				
				
				lore.anno.annoMan.updateAnnotation(anno, lore.anno.ui.currentURL, refresh, function(action, result, resultMsg){
				
					if (result == "success") {
						lore.anno.ui.loreInfo('Annotation ' + action + 'd.');
						lore.debug.anno(action + 'd ' + anno.data.title, resultMsg);
						lore.anno.ui.hideAnnotation();
					}
					else {
						lore.anno.ui.loreError('Unable to ' + action + ' annotation');
						lore.debug.anno('Unable to ' + action + ' annotation', resultMsg);
					}
				});
				lore.anno.ui.page.setCurrentAnno();
				
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
				 lore.anno.ui.page.setCurrentAnno();
				 return;
			}
		 
	       	var msg = 'Are you sure you want to delete this annotation forever?';
	       	if ( lore.anno.ui.page.curSelAnno.data.hasChildren() ) {
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
		   } else {
		   		lore.debug.anno("Nothing selected to delete.");
		   }
	    }
		
		lore.anno.ui.handleDeleteAnnotation2 = function(){
			try {
				lore.debug.anno("deleting " + lore.anno.ui.page.curSelAnno);
				
				lore.anno.annoMan.deleteAnnotation(lore.anno.ui.page.curSelAnno, function(result, resultMsg){
					if (result == 'success') {
						lore.debug.anno('Annotation deleted', resultMsg);
						lore.anno.ui.loreInfo('Annotation deleted');
					}
					else {
					
						lore.anno.ui.loreError('Unable to delete annotation');
					}
				});
				
				lore.anno.ui.page.setCurrentAnno();
			} 
			catch (ex) {
				lore.debug.anno("Exception when deleting annotation", ex);
				lore.anno.ui.loreWarning("Unable to delete annotation");
			}
		}
		
		lore.anno.ui.handleAddResultsToCO = function(evt){
			try {
				var sels = lore.anno.ui.search.grid().getSelectionModel().getSelections();
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
		lore.anno.ui.pageui.updateSplitter(rec, true);
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
  	
	lore.anno.ui.handleToggleAllAnnotations = function () {
		lore.anno.ui.pageui.toggleAllAnnotations();
	}
	/**
	 * When an annotation is selected in the tree this function is called. The annotation
	 * is loaded into the form. It is highlighted on the current content window's document and if
	 * it's a variation annotation the splitter is shown
	 * @param {Node} node The tree node that was selected
	 * @param {Object} event Not Used
	 */
	lore.anno.ui.handleTreeNodeSelection = function(node, event){
		
			try {
				var unsavedNode = node.isAncestor(lore.anno.ui.treeunsaved);
				//lore.debug.anno("unsavedNode? " + unsavedNode + "n: " + node.getPath(), node);
				
				var store = unsavedNode ? lore.anno.annodsunsaved : lore.anno.annods;
				
				var rec = lore.global.util.findRecordById(store, lore.anno.ui.recIdForNode(node));
				
				
				if ( rec == lore.anno.ui.page.curSelAnno )
					return;
				
				if (lore.anno.ui.page.curSelAnno &&
				(lore.anno.ui.formpanel.isDirty() ||
				lore.anno.ui.page.curSelAnno.data.isNew())) {
					lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
				}
				
				if (rec == null) { // if they select root element, if it's shown 
					lore.anno.ui.page.setCurrentAnno();
					return;
				}
				
				lore.anno.ui.page.setCurrentAnno(rec, store);
				 
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
					if ( rec) lore.anno.ui.page.setCurrentAnno(rec);//lore.anno.ui.page.curSelAnno = rec;
				}
					
				if (!rec) {
					lore.debug.anno("Couldn't find record to reply to: " + arg, arg);
					return;
				}
				
				if ( rec.data.isNew() ) {
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
	 	* When the edit link from the timeline popup is clicked, load the supplied annotation into the form editor and show it.
	 	*
		* @param {Object} id The id of the annotation to load in the form editor
		*/
		lore.anno.ui.handleEditTimeline = function ( id ) {
			try{
				lore.anno.ui.views.activate('treeview');
				var rec =  lore.global.util.findRecordById(lore.anno.annods, id);
				lore.anno.ui.selectAndShowNode(rec);
			} catch (e) {
				lore.debug.anno(e,e);
			}
		}
		
		/**
	 	* When the edit button from the toolbar is clicked, load the current annotation into the form editor and show it.
	 	*/
		
		lore.anno.ui.handleEdit = function ( ) {
			try {
				var rec = lore.anno.ui.page.curSelAnno
				if (!rec) 
					return;
				if (lore.anno.ui.page.curSelAnnoStore == lore.anno.annodsunsaved) {
					treeroot = lore.anno.ui.treeunsaved;
				}
				
				lore.anno.ui.selectAndShowNode(rec);
			} catch (e) {
				lore.debug.anno(e,e);
			}
		}
		
		/**
	 	* When the a node in the tree view is double clicked, load the annotation in the form editor and show the editor.
	 	* @param {Object} node  The tree node 
	 	*/
		lore.anno.ui.handleEditTreeNode = function (node) {
			try {
				var treeroot, rec;
				
				if (node.isAncestor(lore.anno.ui.treeunsaved)) {
					//store =  lore.anno.annodsunsaved;
					treeroot = lore.anno.ui.treeunsaved;
					rec = lore.global.util.findRecordById(lore.anno.annodsunsaved, lore.anno.ui.recIdForNode(node));
				}
				else {
					// check if there's an unsaved copy and use that instead for editing
					rec = lore.global.util.findRecordById(lore.anno.annodsunsaved, lore.anno.ui.recIdForNode(node));
					if (!rec) 
						rec = lore.global.util.findRecordById(lore.anno.annods, lore.anno.ui.recIdForNode(node));
					else 
						lore.anno.ui.page.setCurrentAnno(rec, lore.anno.annodsunsaved); // set current anno to the unsaved copy
				}
				lore.anno.ui.selectAndShowNode(rec);
			}catch (e ) {
				lore.debug.anno(e,e);
			}
		}
		
		lore.anno.ui.selectAndShowNode = function (rec) {
			var node = lore.anno.ui.findNode(rec.data.id);
			if (node) {
				lore.anno.ui.formpanel.show(rec);
				Ext.getCmp("treeview").doLayout();
				node.ensureVisible();
				node.select();
			}
		}
		
		
	 
		
	} catch(e ) {
		alert(e + " " + e.stack);
	}


	lore.anno.ui.handleUpdateAnnotationContext = function () {
		lore.anno.ui.formpanel.updateAnnotationContext();
		lore.anno.ui.show();
		Ext.getCmp("treeview").doLayout();
	}
		
	lore.anno.ui.handleUpdateVariationAnnotationContext = function () {
		lore.anno.ui.formpanel.handleUpdateVariationAnnotationContext();
		lore.anno.ui.show();
		Ext.getCmp("treeview").doLayout();
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
													return lore.anno.annoMan.serialize(format);
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
			lore.anno.annoMan.importRDF(theRDF, lore.anno.ui.currentURL, output);
		} catch(e) {
			lore.debug.anno("Error importing annotations: " + e, e);
			lore.anno.ui.loreError("Error importing annotations: " + e );
		}
	}
	
	lore.anno.ui.handleClose = function(uri) {
		lore.anno.ui.handleSaveAllAnnotationChanges(uri);
	}
	
	lore.anno.ui.refreshPage = function () {
		lore.debug.anno("page refreshed");
		
		try {
			if (lore.anno.ui.page) 
				lore.anno.ui.page.clear();
			else 
				lore.anno.ui.initPage(lore.anno.annods);
			
			lore.anno.ui.pageui.enableImageHighlighting();
			lore.anno.ui.page.setCurrentAnno();
		} catch(e ){
			lore.debug.anno("refreshPage(): " + e, e);
		}
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
				lore.anno.ui.page.store(oldurl);
				lore.anno.ui.updateAnnoFromRecord(lore.anno.ui.page.curSelAnno);
				
				// tag any unsaved new annotations for the new page
				lore.anno.annodsunsaved.each(function(rec){
					//if (lore.anno.isNewAnnotation(rec)) {
						var n = lore.anno.ui.findNode(rec.data.id + "-unsaved", lore.anno.treeunsaved); 
						if ( n) 
							n.setText(rec.data.title, "Unsaved annotation from " + rec.data.resource, '', lore.anno.ui.genTreeNodeText(rec.data));
						else {
							lore.debug.anno("modified/new annotation not found in unsaved window. This is incorrect. " + rec.data.id );
						}
					//}
				})
				
				if (lore.anno.ui.page.curSelAnno && !lore.anno.ui.page.curSelAnno.data.isNew()) {
					lore.anno.ui.hideAnnotation();
				}
				
				lore.anno.ui.page.load(contextURL, true);
			} catch (e ) {
				lore.debug.anno(e,e);
			}
			
		}else {
			if (lore.anno.ui.page)
			lore.anno.ui.page.clear();
		else 
			lore.anno.ui.initPage(lore.anno.annods);
		}
		
		try {
			lore.anno.ui.pageui.enableImageHighlighting();
			lore.anno.ui.loreInfo("Loading annotations for " + contextURL);
			lore.anno.annoMan.updateAnnotationsSourceList(contextURL, 
				function(result, resultMsg){
					if (result == 'fail') {
						lore.anno.annods.each(function(rec){
							lore.anno.annods.remove(rec);
						});
						lore.anno.ui.loreError("Failure loading annotations for page.");
					}
				}
			);
		} catch(e) {
			lore.debug.anno(e,e);
		}
		lore.anno.ui.loadedURL = contextURL;
	}


