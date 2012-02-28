
Ext.namespace('lore.anno.ui');

/**
 * Object that encapsulates a search screen for annotations
 * @class lore.anno.ui.PropertyEditor
 * @extends Ext.grid.EditorGridPanel
 */
lore.anno.ui.PropertyEditor = Ext.extend(Ext.grid.EditorGridPanel, {
    initComponent: function(config) {
        Ext.apply(this, { 
            clicksToEdit : 1,
            columnLines : true,
            propEditorWindow: new Ext.Window({ 
                modal: true,
                closable: false,
                layout: 'fit',
                animateTarget: 'properties',
                focus: function() {
                    this.getComponent(0).focus();
                },
                editField: function(tfield,row){
                    try {
                        lore.debug.anno("editField",[tfield,row]);
                        this.triggerField = tfield;
                        this.activeRow = row;
                        var val = tfield.getValue();
                        this.getComponent(0).setValue(val? val : '');
                        this.show(); 
                        this.focus();
                    } catch (e){
                        lore.debug.anno("editField",e);
                    }
                },
                items: [
                    {
                        xtype: 'textarea',
                        validateOnBlur: false,
                        width: 300,
                        grow: false,
                        height: 150
                    }
                ],
                bbar: [
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
                                w.triggerField.setValue(ta.getRawValue());
                                this.stopEditing();
                                
                                w.hide();
                            } catch (e){
                                lore.debug.anno("update",e);
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
                                w.hide();
                            } catch (e){
                                lore.debug.anno("cancel",e);
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
                        type : 'string'
                    }
                ]
            }),
            colModel : new Ext.grid.ColumnModel({
                columns : [{
                            header : 'Property Name',
                            sortable : true,
                            dataIndex : 'name',
                            menuDisabled : true
                 }, {
                            header : 'Value',
                            dataIndex : 'value',
                            menuDisabled : true,
                            
                           editor: new Ext.form.TriggerField({
                                 propertyEditor: this,
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
                                        lore.debug.anno("trigger click",e);
                                    }
                                 } 
                           })
                        }

                ]
                    }),
            sm : new Ext.grid.RowSelectionModel({
                        singleSelect : true
                    }),
            title : 'Metadata',
    
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
                        handler : this.helpPropertyAction,
                        scope: this
                    }],
            id : "remgrid",
            autoHeight : true,
            anchor: '-30',
            viewConfig : {
                forceFit : true,
                scrollOffset : 0

            }
        });
        
        try {

            lore.anno.ui.PropertyEditor.superclass.initComponent.apply(this, arguments);
            
            
            this.propertiesList = [];
        } catch (e) {
            lore.debug.anno("PropertyEditor:initComponent", e);
        }
    },
    
    
    /** Handler for plus tool button on property grids */
    addPropertyAction: function (ev, toolEl, panel) {
        if (panel.propertiesList.length === 0) {
            lore.anno.ui.loreInfo("Make a semantic selection before adding metadata");
            return;
        }
        var makeAddMenu  = function(panel){
            panel.propMenu = new Ext.menu.Menu({
                id: panel.id + "-add-metadata"
            });

            var props = panel.propertiesList;
            var pstore = panel.getStore();
            for (var i = 0; i < props.length; i++) {
                var propname = props[i];
                panel.propMenu.add({
                    id: panel.id + "-add-" + propname,
                    text: propname,
                    handler: function () {
                        try{
                            var counter = 0;
                            var prop = pstore.getById(this.text + "_" + counter);
                            
                            while (prop) {
                                counter = counter + 1;
                                prop = pstore.getById(this.text + "_" + counter);
                            }
                            var theid = this.text + "_" + counter;
                            pstore.loadData([{id: theid, name: this.text, value: ""}],true);
                        } catch (ex){
                            lore.debug.anno("exception adding prop " + this.text,ex);
                        }
                    }
                });
            }
        };
        if (!panel.propMenu || panel.propertiesListChanged) {
            makeAddMenu(panel);
            panel.propertiesListChanged = false;
        }
        panel.propMenu.showAt(ev.xy);
    },
    /** Handler for minus tool button on property grids */
    removePropertyAction: function (ev, toolEl, panel) { 
        try {
            var sel = panel.getSelectionModel().getSelected();
            
            if (panel.collapsed) {
                lore.anno.ui.loreInfo("Please expand the properties panel and select the property to remove");
            } else if (sel) {
                panel.getStore().remove(sel);
            } else {
                lore.anno.ui.loreInfo("Please click on the property to remove prior to selecting the remove button");
            }
        } catch (ex) {
            lore.debug.anno("error removing property ",ex);
        }
    },
    /* Used for displaying property values : values have been sanitized before being passed to template */
    helpTpl: new Ext.XTemplate(
        '<p style="font-weight:bold;font-size:130%">{name}</p>',
        '<p style="font-size:110%;margin:5px;">{value}</p>',
        '<tpl if="ns">',
            '<p>This property is defined in ',
            '<a style="text-decoration:underline" href="#" onclick="lore.util.launchTab(\'{ns}\');">{ns}</a>',
            '</p>',
        '</tpl>'
    ),
    /** Handler for help tool button on property grids
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    helpPropertyAction: function (ev,toolEl, panel) {
        try{
        var sel = panel.getSelectionModel().getSelected();
        if (panel.collapsed){
            lore.anno.ui.loreInfo("Please expand the properties panel and select a property");
        } else if (sel){
            var helpConfig = {
                name: lore.util.sanitizeHTML(sel.data.name, window, true), 
                value: lore.util.sanitizeHTML(sel.data.value, window, true)
            };
            var splitprop =  sel.data.name.split(":");
            if (splitprop.length > 1){
                // TODO : this value should be safe, but make sure it doesn't have any nasties in it
                helpConfig.ns = lore.constants.NAMESPACES[splitprop[0]];
            }
            Ext.Msg.show({
                    title : lore.util.sanitizeHTML('About ' + sel.data.name,window,true),
                    buttons : Ext.MessageBox.OK,
                    msg : this.helpTpl.apply(helpConfig)
                });
        } else {
            lore.anno.ui.loreInfo("Please click on a property prior to selecting the help button");
        }
        } catch (ex){
            lore.debug.anno("Error creating help",ex);
        }
    },
    
    /**
     * Set the type of object we are editing the metadata for, restricting the
     * list of properties that can be added.
     * @param {} ourl 
     */
    setObjectType: function (ourl, type) {
        var tthis = this;
        if (this.metadataOnturl === ourl && this.type === type) {
            return;
        }
        this.metadataOnturl = ourl;
        this.type = type;
        this.loadOntology(ourl, function callback(ontology) {
            lore.debug.anno('loadOntology callback', {ontology: ontology, type: type});
            tthis.propertiesList = [];
            
            ontology.where('?prop rdfs:domain <' + type + '>')
                .each(function () {
                    var name = this.prop.value.toString();
                    tthis.propertiesList.push(name.replace(lore.constants.NAMESPACES['austlit'], ''));
            });
            tthis.propertiesListChanged = true;
        });
    },
    
    /**
     * Return the short name of an RDF object
     * @param {} longName full reference to an rdf object
     * @return {} 
     */
    shortName: function (longName) {
        // TODO: actually do this for all the namespaces we know about!
        return longName.replace(lore.constants.NAMESPACES['austlit'], '');
    },
    
    /**
     * Load an ontology into the property editor panel
     * @param {} ourl URL to load the ontology from
     * @param {} callback callback function, passed the ontology as a jQuery.rdf data store
     */
    loadOntology: function (ourl, callback) {
        if (ourl) {
            lore.debug.anno("getting ontology : " + ourl);
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType('text/xml');
            xhr.open("GET", ourl);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    try {
                        var db = jQuery.rdf.databank();
                        for (ns in lore.constants.NAMESPACES){
                            db.prefix(ns,lore.constants.NAMESPACES[ns]);
                        }
                        db.load(xhr.responseXML);
                        lore.debug.anno("loading relationships from " + ourl);      
                        if (typeof(callback) == 'function')
                            callback(jQuery.rdf({databank: db}));
                        
                    } catch (e){
                        lore.debug.anno("problem loading rels",e);
                    }
                } 
            };
            xhr.send(null);
        }
    },
    
    reset: function () {
        this.propertiesList = [];
        this.metadataOnturl = "-";
        this.propertiesListChanged = true;
        this.getStore().removeAll();
    }
});



Ext.reg("annopropertyeditor", lore.anno.ui.PropertyEditor);
//Ext.reg("annopropertyeditor", 'lore.anno.ui.PropertyEditor');