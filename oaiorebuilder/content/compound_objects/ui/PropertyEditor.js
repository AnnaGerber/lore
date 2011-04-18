/** Override to prevent using inline styles, which are stripped out by the sanitization process */
Ext.intercept(Ext.form.HtmlEditor.prototype, 'execCmd', function() {
    var doc = this.getDoc();
    doc.execCommand('styleWithCSS', false, false);
});
/** 
 * @class lore.ore.ui.PropertyEditor Grid-based editor for Compound object or resource properties and relationships
 * @extends Ext.grid.EditorGridPanel
 */
lore.ore.ui.PropertyEditor = Ext.extend(Ext.grid.EditorGridPanel,{ 
    initComponent: function(config){
        Ext.apply(this, { 
            clicksToEdit : 1,
            columnLines : true,
            autoHeight : true,
            autoWidth: true,
            collapsible : true,
            collapseFirst: false,
            animCollapse : false,
            /** Pop-up editor for property values */
            propEditorWindow: new Ext.Window({ 
            	propEditor: this,
                modal: true,
                closable: false,
                layout: 'fit',
                animateTarget: 'properties',
                focus: function() {
                    this.getComponent(0).focus();
                },
                editField: function(tfield,rownum){
                    try {
                        this.triggerField = tfield;
                        this.activeRow = rownum;
                        var val = tfield.getValue();
                        this.getComponent(0).setValue(val? val : '');
                        this.show(); 
                        this.focus();
                    } catch (e){
                        lore.debug.ore("problem in editField",e);
                    }
                },
                onShow: function(){
                	var rec = this.propEditor.store.getAt(this.activeRow);       	
                	var ccbuttons = this.getBottomToolbar().getComponent(0);
                	if (rec.data.name == "dc:rights"){
                		ccbuttons.show();
                	} else {		         		
                		ccbuttons.hide();        		
                	}
                    this.getComponent(0).show(); // force htmleditor handler to display or hide formatting toolbar
                	Ext.Window.prototype.onShow.call(this);
                },
                items: [
                    {
                        xtype: 'htmleditor',
                        propEditor: this,
                        plugins: [ new Ext.ux.form.HtmlEditor.IndentOutdent(), new Ext.ux.form.HtmlEditor.ToggleFormatting()],
                        width: 400,
                        height: 150,
                        enableColors: false,
                        enableFont: false,
                        enableLinks: false,
                        enableSourceEdit: false
                    }
                ],
                bbar: [
                    {
                    	xtype: 'buttongroup',           	
                    	columns: 3,
                    	items: [
		                    {
		                    	xtype: 'button',                 	
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/by.png',
		                    	tooltip: 'Set to Creative Commons Attribution license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work by is licensed under a Creative Commons Attribution 3.0 Australia License. http://creativecommons.org/licenses/by/3.0/au/");
		                    	}
		                    },
		                    {
		                    	xtype: 'button',
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/bysa.png',
		                    	tooltip: 'Set to Creative Commons Attribution Share Alike license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work is licensed under a Creative Commons Attribution Share Alike 3.0 Australia. License http://creativecommons.org/licenses/by-sa/3.0/au/");
		                    	}
		                    },
		                    {
		                    	xtype: 'button',
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/bync.png',
		                    	tooltip: 'Set to Creative Commons Attribution Noncommercial license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work is licensed under a Creative Commons Attribution Noncommercial 3.0 Australia License. http://creativecommons.org/licenses/by-nc/3.0/au/");
		                    	}   	
		                    },
		                    {
		                    	xtype: 'button',
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/bynd.png',
		                    	tooltip: 'Set to Creative Commons Attribution No Derivative Works license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work is licensed under a Creative Commons Attribution No Derivative Works 3.0 Australia License. http://creativecommons.org/licenses/by-nd/3.0/au/");
		                    	}
		                    },
		                    {
		                    	xtype: 'button',
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/byncsa.png',
		                    	tooltip: 'Set to Creative Commons Attribution Noncommercial Share Alike license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work is licensed under a Creative Commons Attribution Noncommercial Share Alike 3.0 Australia License. http://creativecommons.org/licenses/by-nc-sa/3.0/au/");
		                    	}
		                    },
		                    {
		                    	xtype: 'button',                    	
		                    	text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
		                    	icon: 'chrome://lore/skin/icons/cc/byncnd.png',
		                    	tooltip: 'Set to Creative Commons Attribution Noncommercial No Derivatives license',
		                    	scope: this,
		                    	handler: function(){
		                    		this.propEditorWindow.getComponent(0)
		                    			.setValue("This work is licensed under a Creative Commons Attribution Noncommercial No Derivative Works 3.0 Australia License. http://creativecommons.org/licenses/by-nc-nd/3.0/au/");
		                    	}
		                    }
		                ]
                    },
                    '->',
                    {
                        xtype: 'button',
                        tooltip: 'Update the property value and close editor',
                        text: 'Update',
                        scope: this, // the properties panel
                        handler: function(btn, ev){
                            try{
                                var w = this.propEditorWindow;
                                var ta = w.getComponent(0);
                                // need to start/stop editing to trigger handlePropertyChange to update model
                                this.startEditing(w.activeRow,1);
                                var val = ta.getRawValue();
                                // Remove markup such as scripts from value before updating property field
                                val = (val? lore.global.util.sanitizeHTML(val,window,true) : '');
                                w.triggerField.setValue(val);
                                // Call update formatting status before stopEditing to ensure type is finalised before value is saved back to model
                                this.updateFormattingStatus(w.activeRow, true);
                                this.stopEditing();
                                w.hide();
                            } catch (e){
                                lore.debug.ore("problem in update",e);
                            }
                        }
                    },
                    {
                        xtype: 'button', 
                        tooltip: 'Cancel edits and close editor',
                        text: 'Cancel',
                        scope: this, // the properties panel
                        handler: function(btn, ev){
                            try{
                                var w = this.propEditorWindow;
                                this.updateFormattingStatus(w.activeRow, false);
                                w.hide();
                            } catch (e){
                                lore.debug.ore("problem in cancel",e);
                            }
                        }
                    }
                ]
            }),
            store : new Ext.data.JsonStore({
                idProperty : 'id',
                fields : [
                    {
                        name : 'id',
                        type : 'string'
                    }, {
                        name : 'name',
                        type : 'string'
                    }, {
                        name : 'value',
                        type : 'auto'
                    }, {
                        name: 'type',
                        type: 'string',
                        defaultValue: 'plainstring'
                    }
                ]
            }),
            colModel : new Ext.grid.ColumnModel({
                propEditor: this, // reference to PropertyEditor object
                isCellEditable: function(col, row) {
                    try {
	                    var g = this.propEditor;
					    var record = g.store.getAt(row);
	                    // TODO: use MVC, store read only status of properties in model rather than hardcoding this?
	                    if (((g.id == "nodegrid") && (record.id == "dc:format_0" || record.id == "rdf:type_0")) 
	                        || ((g.id != "nodegrid") && (record.id == "dcterms:modified_0"
	                        || record.id == "dcterms:created_0"
	                        || record.id == "rdf:about_0"))){
						      return false;
						} 
                    } catch (ex){
                        lore.debug.ore("Error in isCellEditable",ex);
                    }
				    return Ext.grid.ColumnModel.prototype.isCellEditable.call(this, col, row);
				},
                columns : [{
                            header : 'Property Name',
                            dataIndex : 'name',
                            menuDisabled : true,
                            width: 70,
                            scope: this,
                            renderer: this.renderFunction
                 }, {
                            header : 'Value',
                            dataIndex : 'value',
                            menuDisabled : true,
                            scope: this,
                            renderer: this.renderFunction, // in PropertyEditor
                            editor: new Ext.form.TriggerField({
                                 propertyEditor: this, // reference to PropertyEditor object
                                 triggerClass: 'x-form-ellipsis-trigger',
                                 triggerConfig: {
                                    tag : "img", 
                                    src : Ext.BLANK_IMAGE_URL,
                                    cls: "x-form-trigger x-form-ellipsis-trigger",
                                    qtip: 'Edit this value in a pop up window'
                                 },
                                 onTriggerClick: function(ev) {
                                    try{ 
                                     var row = this.propertyEditor.lastEdit.row;
                                     this.propertyEditor.stopEditing();
                                     this.propertyEditor.propEditorWindow.editField(this,row);
                                    } catch (e){
                                        lore.debug.ore("problem in trigger click",e);
                                    }
                                 } 
                           })
                        }

                ]
            }),
            sm : new Ext.grid.RowSelectionModel({
                singleSelect : true  
            }),
            viewConfig : {
                forceFit : true,
                deferEmptyText: false,
                emptyText: "No resource selected"
            },
            tools : [{
                        id : 'plus',
                        qtip : 'Add a property',
                        handler : this.addPropertyAction
                    }, {
                        id : 'minus',
                        qtip : 'Remove the selected property',
                        handler : this.removePropertyAction
                    }, {
                        id : 'help',
                        qtip : 'Display information about the selected property',
                        handler : this.helpPropertyAction
                    }
            ]
                        
        });
        lore.ore.ui.PropertyEditor.superclass.initComponent.call(this,config);   
        // hide/show the properties when the collapse/expand button in the toolbar is triggered
        // FIXME: collapse/expand getting out of sync when CO is loaded
        this.on('beforecollapse', function(p){
            p.body.setStyle('display','none');
        });
        this.on('beforeexpand', function(p){
            p.body.setStyle('display','block');
        });

        this.on('rowcontextmenu',function(g,i,e){
            g.getSelectionModel().selectRow(i);
            var cmodel = g.getColumnModel();
            if (cmodel.isCellEditable(1,i)){
                // The property value field is field number 1, i is the current row index
	            var tfield = g.getColumnModel().getCellEditor(1,i);
	            // call startEditing + stopEditing (ensures value is updated into triggerfield)
	            this.startEditing(i,1);
	            this.stopEditing();
	            // open the popup editor
	            g.propEditorWindow.editField(tfield,i);
            } else {
                 lore.ore.ui.vp.info("Property value is not editable");
            }
        });
        // Set up listeners
        this.on("afteredit", this.handlePropertyChange,this);
        this.store.on("remove", this.handlePropertyRemove,this);
        
        this.propEditorWindow.on("show", function(){
            // force redraw of text area of popup editor on scroll to get around FF iframe bug see #209
            var taEl = this.getComponent(0).getEl();
            taEl.on("scroll",function(e,t,o){this.repaint();},taEl);
        }, this.propEditorWindow, {single:true});
    },
    /** Check whether the formatting toolbar should be enabled for this type: currently only enabled for strings or html */
    checkFormattingAllowed : function(){  
        try{
            if (this.store){
                var currentRec = this.store.getAt(this.lastEdit.row);
                if (currentRec){
                    var currentType = currentRec.get("type");
                    if (!currentType || currentType == "string" || currentType == "html" || currentType == "string-pending" || currentType == "html-pending"){
                        return true;
                    }
                }
            }
        } catch (ex){
            lore.debug.ore("Problem in checkFormattingAllowed",ex)
        }
        return false;
    },
    /** enable formatting for the currently selected property */
    setFormattingEnabled : function(enable){
        try{
            if (this.store){
		        var currentRec = this.store.getAt(this.lastEdit.row);
		        if (currentRec){
                    var currentType = currentRec.get("type");
                    if (enable && (!currentType || currentType == "string" || currentType == "string-pending")){
                      // We only allow html formatting if the original type was string 
                      // (as opposed to plainstring for properties like creator, title that should not have formatting)
                      // "pending" is appended to type so we can tell whether the format was changed: 
                      // this change of type will be reverted if editing is cancelled, pending is removed if changes are saved
		              currentRec.set("type","html-pending");
                      return true;
                    } else if (!enable && (!currentType || currentType == "html" || currentType == "html-pending")){
                        currentRec.set("type","string-pending");
                        return true;
                    } 
		        }
            } 
        } catch (ex){
            lore.debug.ore("Problem in setFormattingEnabled",ex)
        }
        // Return false to indicate nothing happened or formatting is not allowed (e.g. original type was not string)
        return false;
    },
    /** disable formatting for the currently selected property */
    getFormattingEnabled : function(){ 
        try{
        var currentRec = this.store.getAt(this.lastEdit.row);
        if (currentRec && currentRec.get("type") == "html" || currentRec.get("type") == "html-pending"){ 
            return true;
        } else {
            return false;
        }
        } catch (ex){
            lore.debug.ore("Problem in getFormattingEnabled",ex);
        }
    },
    /** Finalise format of field upon update or cancel */
    updateFormattingStatus: function (row, accept){
        var currentRec = this.store.getAt(row);
        if (currentRec){
            var formatType = currentRec.get("type");
            if (formatType.match("pending")){
                // only change the type if it has been changed during this edit (i.e. has pending in type name)
                var newType = "string";
                if ((formatType == "html-pending" && accept) ||  (formatType == "string-pending" && !accept)){
                    newType = "html";
                }
                currentRec.set("type",newType);
            }
        }
    },
    bindModel : function(model){
    	// Listen to model for property changes
    	if (this.model){
    		this.model.un("propertyChanged",this.onModelPropertyChanged,this);
    	}
    	this.model = model;
    	if (this.model){
    		this.model.on("propertyChanged",this.onModelPropertyChanged,this);
    	}
    },
    /** Update grid if property value changes in model */
    onModelPropertyChanged: function(config, index){
    	try{
	    	if (config){
	    		var rec = this.store.getById(config.prefix + ':' + config.name + "_" + index);
	    		// check whether value has actually changed
	    		if (rec && rec.value != config.value){
	    			// update record
	    			rec.set('value',config.value);
	    			rec.commit();
	    		}
	    	}
    	} catch (ex){
    		lore.debug.ore("onModelPropertyChanged",ex);
    	}
    },
    /** Grey out rows that are not editable by the user */
	renderFunction: function(val, cell, rec){
        // Escape double quotes for display in tooltips 
        var escVal = (val.replace) ? val.replace(/"/g,"&quot;"): val;
    	if (rec && rec.data && 
    			(rec.data.id == "dc:format_0" 
    				|| rec.data.id == "rdf:type_0"
    			    || rec.data.id == "rdf:about_0" 
    			    || (this.id != 'nodegrid' 
    			    		&& (rec.data.id == "dcterms:modified_0" ||
    			    		rec.data.id == "dcterms:created_0"))
    			    )){
    		
    		return '<span title="' + escVal + '" style="color:grey;">' + val + '</span>';
    	} else {
    		return '<span title="' + escVal + '">' + val + '</span>';
    	}
        return val;
    },
    makeAddPropertyMenu: function (mp){
    	var panel = this;
    	panel.propMenu = new Ext.menu.Menu({
            id: panel.id + "-add-metadata"
        });
        panel.propMenu.panelref = panel.id;
        for (var i = 0; i < mp.length; i++) {
            var propname = mp[i];
            panel.propMenu.add({
                id: panel.id + "-add-" + propname,
                text: propname,
                handler: function () {
                    try{
                        var panel = Ext.getCmp(this.parentMenu.panelref);
                        var pstore = panel.getStore();
                        var counter = 0;
                        var prop = pstore.getById(this.text + "_" + counter);
                        while (prop) {
                            counter = counter + 1;
                            prop = pstore.getById(this.text + "_" + counter);
                        }
                        var theid = this.text + "_" + counter;
                        var ptype = (this.text == "dcterms:abstract" || this.text == "dc:description")? "string" : "plainstring";
                        pstore.loadData([{id: theid, name: this.text, value: "", type: ptype}],true);
                        
                    } catch (ex){
                        lore.debug.ore("exception adding prop " + this.text,ex);
                    }
                }
            });
        }
    },
    /** Handler for plus tool button on property grids 
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    addPropertyAction : function (ev, toolEl, panel) {
    	try{
        if (!panel.propMenu || !panel.loadedOntology || (lore.ore.ontologyManager.ontologyURL != panel.loadedOntology)) {        	
        	panel.loadedOntology = lore.ore.ontologyManager.ontologyURL;
        	panel.makeAddPropertyMenu(lore.ore.ontologyManager.getDataTypeProperties());
        }
        if (panel.id == "remgrid" || lore.ore.ui.graphicalEditor.getSelectedFigure() instanceof lore.ore.ui.graph.ResourceFigure){
            if (panel.collapsed) {
                panel.expand(false);
            }
            panel.propMenu.showAt(ev.xy);
        } else {
            lore.ore.ui.vp.info("Please click on a Resource node before adding property");
        }
    	} catch (e){
    		lore.debug.ore("Problem in addPropertyAction",e);
    	}
    },
    /** Handler for minus tool button on property grids
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    removePropertyAction: function (ev, toolEl, panel) { 
        try {
        var om = lore.ore.ontologyManager;
        var sel = panel.getSelectionModel().getSelected();
        // don't allow delete when panel is collapsed (user can't see what is selected)
        if (panel.collapsed) {
            lore.ore.ui.vp.info("Please expand the properties panel and select the property to remove");
        } else if (sel) {
            // TODO: #2 (refactor): should allow first to be deleted as long as another exists
            // should also probably renumber
                 if (sel.id.match("_0")){ // first instance of property: check if it's mandatory
                    var propId = sel.id.substring(0,sel.id.indexOf("_0"));
                    if ((panel.id == "remgrid" && om.CO_REQUIRED.indexOf(propId)!=-1) ||
                        (panel.id == "nodegrid" && 
                            (om.RES_REQUIRED.indexOf(propId) !=-1 ||
                                om.REL_REQUIRED.indexOf(propId)!=-1))){
                        lore.ore.ui.vp.warning("Cannot remove mandatory property: " + sel.data.name);
                    } else {
                        panel.getStore().remove(sel);
                    }
                } else { // not the first instance of the property: always ok to delete
                    panel.getStore().remove(sel);
                }
         } else {
            lore.ore.ui.vp.info("Please click on the property to remove prior to selecting the remove button");
         }
        } catch (ex) {
            lore.debug.ore("error removing property ",ex);
        }
    },
    /** Handler for help tool button on property grids
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    helpPropertyAction : function (ev,toolEl, panel) {
        var sel = panel.getSelectionModel().getSelected();
        if (panel.collapsed){
            lore.ore.ui.vp.info("Please expand the panel and select a property");
        } else if (sel){
            var splitprop =  sel.data.name.split(":");
            var infoMsg = "<p style='font-weight:bold;font-size:130%'>" + sel.data.name + "</p><p style='font-size:110%;margin:5px;'>" 
            + sel.data.value + "</p>";
            if (splitprop.length > 1){
                var ns = lore.constants.NAMESPACES[splitprop[0]];
                infoMsg += "<p>This property is defined in " 
                        + "<a style='text-decoration:underline' href='#' onclick='lore.global.util.launchTab(\"" 
                        + ns + "\");'>" + ns + "</a></p>";
            }
            
            Ext.Msg.show({
                    title : 'About ' + sel.data.name,
                    buttons : Ext.MessageBox.OK,
                    msg : infoMsg
                });
        } else {
            lore.ore.ui.vp.info("Please click on a property prior to selecting the help button");
        }
    },
    handlePropertyRemove : function(store, record, index){
        if (this.id == "nodegrid"){            
        	lore.ore.ui.graphicalEditor.getSelectedFigure().unsetProperty(record.id);
        }
        lore.ore.ui.graphicalEditor.isDirty = true;
    },
    /** update the properties for the selected figure */
    handlePropertyChange : function(args) {
    	lore.ore.ui.graphicalEditor.isDirty = true;
        // at present this only updates resource/rel properties - also needs to update on compound object
        try{
            if (this.id == "nodegrid"){
                var theval;
                var selfig = lore.ore.ui.graphicalEditor.getSelectedFigure();
                //lore.debug.ore("handle property change " + args.record.id + "  to " + args.value + " " + args.originalValue,args);
                if (selfig instanceof lore.ore.ui.graph.ContextmenuConnection){
                    if (args.record.data.name == 'relationship'){ 
                        selfig.setRelationship(
                            this.getPropertyValue("namespace"),args.value);
                    }
                } else { // Resource property
                    if (args.record.data.name == 'resource') {
                        // the URL of the resource has changed
                        if (args.value && args.value != '') {
                            theval = args.value;
                        } else {
                            theval = "about:blank";
                        }
                        if (lore.ore.ui.graphicalEditor.lookup[theval]) {
                            lore.ore.ui.vp.warning("Cannot change resource URL: a node already exists for " + theval);
                            return;
                        } else {
                           lore.ore.ui.graphicalEditor.lookup[theval] = selfig.getId();
                           delete lore.ore.ui.graphicalEditor.lookup[args.originalValue];
                        }
                        if (lore.ore.ui.topView){
                            if (lore.ore.controller.currentURL == theval){
                               lore.ore.ui.topView.hideAddIcon(true);
                            } else if (lore.ore.controller.currentURL == args.originalValue){
                               lore.ore.ui.topView.hideAddIcon(false);
                            }
                        }
                    }
                    // update figure (which in turn updates the model)
                    // Ensure value is clean from scripts tags etc
                    var cleanvalue = lore.global.util.sanitizeHTML(args.value,window,true);
                    selfig.setProperty(args.record.id,cleanvalue,args.record.data.type);
                }
                lore.ore.ui.nodegrid.store.commitChanges();
            } else {
                 // update the CO title in the dataview
                  if (args.record.id == "dc:title_0") {
                    lore.ore.coListManager.updateCompoundObject(
                        lore.ore.cache.getLoadedCompoundObjectUri(),
                        {title: args.value}
                    );
                    // update the name of the compound object in the bottom right
                    var readOnly = !lore.ore.cache.getLoadedCompoundObjectUri().match(lore.ore.reposAdapter.idPrefix);
                    Ext.getCmp('currentCOMsg').setText(Ext.util.Format.ellipsis(args.value, 50) + (readOnly? ' (read-only)' : ''),false);
                  }
                // commit the change to the datastore
                this.store.commitChanges();       
            }
        } catch (e){
            lore.debug.ore("error handling property change",e);
        }
    },
    /** Looks up property value from a grid by name
     * 
     * @param {} propname The name of the property to find
     * @return Object The value of the property
     */
    getPropertyValue : function(propname){
        var proprecidx = this.store.find("name",propname);
        if (proprecidx != -1){
           return this.store.getAt(proprecidx).get("value");
        } else {
            return "";
        }
    },
    /** Set property value in grid by name (Temporary: should be using model instead)
     * @param {} propname The name of the property to set
     * @param {} val The value of the property to set
     */
    setPropertyValue : function(propname, val){
    	var proprecidx = this.store.find("name",propname);
    	if (proprecidx != -1){
			this.store.getAt(proprecidx).set("value", val);
			this.store.commitChanges();
    	}
    }

});

Ext.reg('propertyeditor',lore.ore.ui.PropertyEditor);

/**
 * ToggleFormatting used by Compound Objects Property Editor
 */
Ext.ux.form.HtmlEditor.ToggleFormatting = Ext.extend(Ext.util.Observable, {
    init: function(cmp){
        this.cmp = cmp;
        this.cmp.on('render', this.onRender, this); 
        this.cmp.on('beforeshow', this.onShow, this);
    },
    /** Determine whether formatting toolbar should be shown for this property */
    onShow: function(){
        var allowed = this.cmp.propEditor.checkFormattingAllowed();
        if (!allowed){
            // disable formatting button
            Ext.getCmp("enableFormatToolbar").hide();
        } else {
            // enable formatting button
            Ext.getCmp("enableFormatToolbar").show();
        }
        var enabled = this.cmp.propEditor.getFormattingEnabled();
        this.toggleToolbar(!enabled);
        // set button state (and suppress event)
        Ext.getCmp("enableFormatToolbar").toggle(enabled,true);
    },
    /**
     * Set up button to toggle formatting toolbar on or off
     * It is hidden by default to discourage use of formatting by most users
     */
    onRender: function() {
        var cmp = this.cmp;
        cmp.getToolbar().add('->');
        var btn = cmp.getToolbar().addButton({
          pressed: false,
          id: 'enableFormatToolbar',
          iconCls: 'x-edit-pt',
          handler: function(t) {
            try{  
              var pressed = t.pressed;
              t.toggle(!pressed);
              var fe = this.cmp.propEditor.setFormattingEnabled(!this.cmp.propEditor.getFormattingEnabled());
              if (!fe){
                // set formatting failed, reset the button and toolbar
                t.toggle(pressed,true); 
                this.toggleToolbar(!pressed);
              }
            } catch (ex){
                lore.debug.ore("Problem in onRender",ex);
            }
          },
          scope: this,
          tooltip: {
            title:'Formatting toolbar',
            text: 'Toggle text formatting on or off'
          }
        });
        btn.on('toggle', this.onToggle, this);
    },
    /** 
     * Show or display the toolbar items for formatting
     * @param {} disable
     */
    toggleToolbar : function(disable){
        var tb = this.cmp.getToolbar();
        tb.items.each(function(i){
              if ((i instanceof Ext.Button 
                      || i instanceof Ext.Toolbar.Separator)
                      && i.iconCls != 'x-edit-pt'){
                  if (disable) {
                      i.hide();
                  } else {
                      i.show();
                  }
              }
          });
    },
    /**
     * Respond to formatting toolbar button being pressed: hide or show the toolbar
     * If the property had formatting, warn the user that it will be removed
     * @param {} b
     * @param {} pressed
     */
    onToggle: function(b, pressed){
         
          if (b.iconCls != 'x-edit-pt'){
              return;
          }
          var disable = this.cmp.propEditor.getFormattingEnabled();
          //var tooltip = (disable? "Enable text formatting toolbar" : "Hide toolbar and remove formatting");
          //b.setTooltip(tooltip);
          try{
              if (disable){
                  Ext.Msg.show({
                      title : 'Remove formatting',
                        buttons : Ext.MessageBox.OKCANCEL,
                        msg : 'Disabling the formatting toolbar will remove all formatting from the text. Are you sure you wish to continue?',
                        scope: this,
                        fn : function(btn) {
                            if (btn == 'ok') {
                              var doc = this.cmp.getDoc();
                              doc.execCommand('selectAll',false, null); 
                              var content = doc.getSelection();
                              // strip out html tags by converting selection to string
                              doc.execCommand('insertHTML',false, content.toString());
                              this.cmp.syncValue();
                              this.toggleToolbar(disable);
                            } else {
                                // cancel: force toolbar to show (and suppress event)
                                b.toggle(true, true);
                                this.cmp.propEditor.setFormattingEnabled(!this.cmp.propEditor.getFormattingEnabled());
                            }
                        }
                  });
              } else {
                  this.toggleToolbar(disable);
              }
          } catch (ex){
              lore.debug.ore("Problem removing formatting",ex);
          } 
    }
});