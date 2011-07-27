// Override Viewport to allow manual resize (for generating images) 
Ext.override(Ext.Viewport, {
    initComponent : function() {
        Ext.Viewport.superclass.initComponent.call(this);
        document.getElementsByTagName('html')[0].className += ' x-viewport';
        this.el = Ext.getBody();
        this.el.setHeight = Ext.emptyFn;
        this.el.setWidth = Ext.emptyFn;
        this.el.dom.scroll = 'no';
        this.allowDomMove = false;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        this.renderTo = this.el;
    },
    syncSize : function(){
        delete this.lastSize;
        this.el.dom.style.height="100%";
        this.el.dom.style.width="auto";
        return this;
    }
});
/**
 * @class lore.ore.ui.Viewport The LORE Compound Objects UI (except for toolbar, status icon etc which are in the overlay)
 * @extends Ext.Viewport
 */
lore.ore.ui.Viewport = Ext.extend(Ext.Viewport, {
    // TODO: implement singleton pattern
    layout : "border",
    border : false,
    initComponent : function() {
        this.items = [{
            region : "center",
            border : false,
            layout : "fit",
            id : "loreviews-container",
            items : [{
                xtype : "tabpanel",
                id : "loreviews",
                /**
                 * Override itemTpl so that we can create menu buttons on the tabs
                 */
                itemTpl: new Ext.XTemplate(
	                '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
                    '<tpl if="menuHandler">',
                        '<a title="{text} Menu" href="#" onclick="{menuHandler}" class="x-tab-strip-menu"></a>',
                    '</tpl>',
	                '<a class="x-tab-right" href="#"><em class="x-tab-left">',
	                '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
	                '</em></a>',
	                '</li>'
				),
				/** 
				 * Override to allow menuHandler to be passed in as config
				 */
			    getTemplateArgs: function(item) {
			        var result = Ext.TabPanel.prototype.getTemplateArgs.call(this, item);
                    if (item.menuHandler){
                        result.cls = result.cls + " x-tab-strip-with-menu";
                    }
			        return Ext.apply(result, {
			            closable: item.closable,
			            menuHandler: item.menuHandler
			        });
			    },
                /** Override to allow mouse clicks on menu button */
                onStripMouseDown: function(e){
                    var menu = e.getTarget('.x-tab-strip-active a.x-tab-strip-menu', this.strip);
                    if (menu || e.button !== 0){
                        // default onclick behaviour will result
                        return;
                    }
			        e.preventDefault();
			        var t = this.findTargets(e);
			        if(t.close){
			            if (t.item.fireEvent('beforeclose', t.item) !== false) {
			                t.item.fireEvent('close', t.item);
			                this.remove(t.item);
			            }
			            return;
			        }
			        if(t.item && t.item != this.activeTab){
			            this.setActiveTab(t.item);
			        }
                },
                enableTabScroll : true,
                // Ext plugin to change hideMode to ensure tab contents are not reloaded
                plugins : new Ext.ux.plugin.VisibilityMode({
                            hideMode : 'nosize',
                            bubble : false
                }),
                deferredRender : false,
                autoScroll : true,
                items : [{
                            title : "Graphical Editor",
                            tabTip: "View or edit the compound object graphically",
                            id : "drawingarea",
                            xtype : "grapheditor",
                            iconCls: "graph-icon"
                        },{
		                    title : "Resource List",
		                    tabTip: "View or edit the list of resources in the compound object",
		                    xtype : "resourcepanel",
		                    id : "remlistview",
		                    iconCls: "list-icon"
		                },  {
                            title : "Details",
                            id: "remdetailsview",
                            tabTip: "View detailed description of compound object contents including properties and relationships",
                            xtype: "narrativepanel",
                            iconCls: "detail-icon"
                        }, {
                            layout : 'fit',
                            id : "remslideview",
                            title : "Slideshow",
                            iconCls: "slide-icon",
                            tabTip: "View compound object contents as a slideshow",
                            items : [{
                                        id : 'newss',
                                        xtype : "slideshowpanel",
                                        autoScroll : true
                                    }]
                        }, {
                            title : "Explore",
                            tabTip: "Discover related resources from the repository",
                            id : "remexploreview",
                            xtype : "explorepanel",
                            iconCls: "explore-icon"
                    }   , {
                            title : "Using Compound Objects",
                            tabTip: "View LORE documentation",
                            id : "welcome",
                            scale: 0.90,
                            autoWidth : true,
                            autoScroll : true,
                            iconCls : "welcome-icon",
                            html : "<iframe id='about_co' type='content' style='border:none' height='100%' width='100%' src='chrome://lore/content/compound_objects/about_compound_objects.html'></iframe>",
                            menuHandler: "Ext.getCmp('welcome').onTabMenu(event);",
                            onTabMenu : function(e){
                                var el = Ext.get(e.explicitOriginalTarget);
                                var xy = el.getAnchorXY();
                                xy[1] = xy[1] + 22; // adjust for height of tab
                                if (!this.contextmenu) {
                                    this.contextmenu = new Ext.menu.Menu({
                                        id : this.id + "-context-menu",
                                        showSeparator: false
                                    });
                                   this.contextmenu.add({
                                        text: "Zoom out",
                                        icon: "chrome://lore/skin/icons/magnifier-zoom-out.png",
                                        scope: this,
                                        handler: function(b){
                                            if (this.scale >= 0.3) {this.scale = this.scale - 0.2}; 
                                            var body = Ext.get("about_co").dom.contentWindow.document.body
                                            Ext.get(body).applyStyles("font-size:" + (this.scale * 100) + "%");
                                        }
                                    });
                                    this.contextmenu.add({
                                        text: "Zoom in",
                                        icon: "chrome://lore/skin/icons/magnifier-zoom-in.png",
                                        scope: this,
                                        handler: function(b){ 
                                            if (this.scale <  2.0) {this.scale = this.scale + 0.2};
                                            var body = Ext.get("about_co").dom.contentWindow.document.body
                                            Ext.get(body).applyStyles("font-size:" + (this.scale * 100) + "%");
                                        }
                                    });
                                    this.contextmenu.add({
                                        text: "Reset Zoom",
                                        icon: "chrome://lore/skin/icons/magnifier-zoom-actual.png",
                                        scope: this,
                                        handler: function(b){
                                            if (lore.ore.controller.high_contrast){
                                                this.scale = 1.2;
                                            } else {
                                                this.scale = 1.0;
                                            }
                                             var body = Ext.get("about_co").dom.contentWindow.document.body
                                             Ext.get(body).applyStyles("font-size:small");
                                        }
                                    });    
                                }
                                this.contextmenu.showAt(xy);
                            }
                        }]
            }]
        }, {
            region : "south",
            height : 25,
            xtype : "statusbar",
            id : "lorestatus",
            defaultText : "",
            autoClear : 6000,
            items: [
                '-',
                {
                    xtype:'label',
                    id:'currentCOMsg', 
                    text: 'New compound object'
                },
                ' ',
                {
                    xtype: 'label',
                    id:'currentCOSavedMsg',
                    text:'',
                    style: 'color:red'
                },
                ' ',
                {
                    xtype: 'button',
                    hidden: true,
                    id: 'lockButton',
                    icon: 'chrome://lore/skin/icons/lock.png',
                    tooltip: 'Compound Object is locked',
                    scope: lore.ore.controller
                }
            ]
        }, {
            region : "west",
            width : 280,
            split : true,
            animCollapse : false,
            collapseMode : 'mini',
            useSplitTips: true,
            id : "propertytabs",
            xtype : "tabpanel",
            // Override collapse behaviour to improve UI responsiveness
            onCollapseClick: function(e,args,arg2,arg3,arg4){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                activetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onCollapseClick.apply(this,arguments);
                activetab.show();
            },
            onExpandClick : function (e){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                activetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onExpandClick.apply(this,arguments);
                activetab.show();
            },
            onSplitMove : function (split, newSize){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                var propactivetab = Ext.getCmp("propertytabs").getActiveTab();
                activetab.hide();
                // TODO: should hide these but doing this means property grids don't resize
                //propactivetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onSplitMove.apply(this, arguments);
                activetab.show();
                //propactivetab.show();
                return false;
            },
            deferredRender : false,
            enableTabScroll : true,
            defaults : {
                autoScroll : true
            },
            fitToFrame : true,
            items : [{
                        "xtype": "panel",
                        layout: "anchor",
                        "title": "Browse",
                        tabTip: "Browse related compound objects",
                        "id": "browsePanel",
                        tbar: {
                                "xtype": "lore.paging",
                                "store": "browse",
                                "id": "bpager",
                                items: [
                                    '->',
                                    {
                                       xtype:'button',
                                       icon: "chrome://lore/skin/icons/feed.png",
                                       tooltip: "Show feed",
                                       handler: function(){
                                           try{
                                            if (lore.ore.reposAdapter && lore.ore.reposAdapter instanceof lore.ore.repos.RestAdapter){
                                                 var queryURL = lore.ore.reposAdapter.reposURL + "feed?refersTo=" + lore.ore.controller.currentURL;
                                                 lore.global.util.launchTab(queryURL,window);
                                            } else {
                                                 lore.ore.ui.vp.info("Feeds only supported for lorestore: please update your repository preferences.");
                                            }
                                           } catch (ex){
                                            lore.debug.ore("Viewport: Error launching feed",ex);
                                           }
                                       }
                                    }
                                ]
                            },
                        items: [
                            {
                                "xtype": "codataview",
                                "store": "browse",
                                "id": "cobview"
                            }
                        ]
                     },
                     {
                            title: "History",
                            tabTip: "List recently viewed compound objects",
                            id: "historyPanel",
                            xtype: "panel",
                            anchor: "100% 50%",
                            "tbar": {
                                "xtype": "lore.paging",
                                "store": "history",
                                "id": "hpager"
                           
                            },
                        items: [{
                            "xtype": "codataview",
                            "store": "history",
                            "id": "cohview"
                        }]
                    },
                    {
                        xtype: "searchpanel",
                        id : "searchpanel"
                    }, {
                        xtype : "panel",
                        layout : "anchor",
                        title : "Properties",
                        tabTip: "View or edit compound object properties",
                        id : "properties",
                        items : [{
                                    title : 'Compound Object Properties',
                                    id : "remgrid",
                                    propertyType: "property",
                                    xtype : "propertyeditor"
                                }, {
                                    title : "Resource Properties",
                                    id : "nodegrid",
                                    propertyType: "property",
                                    xtype : "propertyeditor"
                                }, {
                                    title: "Relationships",
                                    id: "relsgrid",
                                    propertyType: "relationship",
                                    xtype: "relationshipeditor"
                                }
                                ]
                    }]
        }];
        
        lore.ore.ui.Viewport.superclass.initComponent.call(this);
        
        var loreviews = Ext.getCmp("loreviews");
        loreviews.on("beforeremove", this.closeView, this);
        
        // create a context menu to hide/show optional views
        loreviews.contextmenu = new Ext.menu.Menu({
                    id : "co-context-menu"
        });
        
        /* disable SMIL view for now
         * loreviews.contextmenu.add({
                    text : "Show SMIL View",
                    handler : function() {
                        lore.ore.ui.vp.openView("remsmilview", "SMIL", this.updateSMILView);
                    }
        });*/
        loreviews.contextmenu.add({
            text : "Show RDF/XML",
            handler : function() {
                lore.ore.ui.vp.openView("remrdfview", "RDF/XML",this.updateRDFXMLView);
            },
            scope: this
        });
        loreviews.contextmenu.add({
            text : "Show TriG",
            handler : function() {
                lore.ore.ui.vp.openView("remtrigview", "TriG", this.updateTrigView);
            },
            scope: this
        });
        loreviews.contextmenu.add({
            text : "Show FOXML",
            handler : function() {
                lore.ore.ui.vp.openView("remfoxmlview", "FOXML", this.updateFOXMLView);
            },
            scope: this
        });
    
        loreviews.on("contextmenu", function(tabpanel, tab, e) {
                    Ext.getCmp("loreviews").contextmenu.showAt(e.xy);
        });
        // make sure Using Compound Objects has correct stylesheet
        Ext.getCmp("welcome").on("activate",
            function(comp){
                var aboutco= Ext.get("about_co");
                if (aboutco && typeof lore.ore.controller.high_contrast != "undefined") {
                    lore.global.util.setHighContrast(aboutco.dom.contentWindow, lore.ore.controller.high_contrast);
                } 
             }
        );
    },
    /** @private Create a compound object view displayed in a closeable tab */
    openView : function (/*String*/panelid,/*String*/paneltitle,/*function*/activationhandler){
        var tab = Ext.getCmp(panelid);
        if (!tab) {
           tab = Ext.getCmp("loreviews").add({
                'title' : paneltitle,
                'id' : panelid,
                'autoScroll' : true,
                'closable' : true
            });
            tab.on("activate", activationhandler, this);
        }
        tab.show();
    },
    /**
     * @private Remove listeners and reference to a Compound Object view if it is closed
     * 
     * @param {Object} tabpanel
     * @param {Object} panel
     */
    closeView : function(/*Ext.TabPanel*/tabpanel, /*Ext.panel*/panel) {
        // remove listeners
        var tab = Ext.getCmp(panel.id);
        if (panel.id == 'remrdfview') {
            tab.un("activate", this.updateRDFXMLView);     
        }
        else if (panel.id == 'remsmilview') {
            tab.un("activate", this.updateSMILView);   
        }
        else if (panel.id == 'remfoxmlview') {
            tab.un("activate",this.updateFOXMLView);
        }
        else if (panel.id == 'remtrigview') {
            tab.un("activate",this.updateTriGView);
        }
        return true;
    },
    /** @private Render the current compound object in TriG format in the TriG view*/
    updateTrigView: function(){
        var trig = lore.ore.cache.getLoadedCompoundObject().serialize('trig');
        Ext.getCmp("remtrigview").body.update("<pre style='white-space:pre-wrap;-moz-pre-wrap:true'>" 
            + Ext.util.Format.htmlEncode(trig) + "</pre>");
    },
    /** @private Render the current compound object as Fedora Object XML in the FOXML view */
    updateFOXMLView : function (){
        var foxml = lore.ore.cache.getLoadedCompoundObject().toFOXML(function(foxml){ 
            lore.global.util.transformXML({
                stylesheetURL: "chrome://lore/content/compound_objects/stylesheets/XMLPrettyPrint.xsl", 
                theXML: foxml, 
                window: window,
                serialize: true, 
                callback: function(foxmlString){
                    if (!foxmlString){
                        foxmlString = "Unable to generate FOXML";
                    }
                    Ext.getCmp("remfoxmlview").body.update(foxmlString);    
                }
            });
        });
        
    },
    /** @private Render the current compound object as RDF/XML in the RDF view */
    updateRDFXMLView : function() {
        var rdfXML = lore.ore.cache.getLoadedCompoundObject().serialize('rdf');
        lore.global.util.transformXML({ 
            stylesheetURL: "chrome://lore/content/compound_objects/stylesheets/XMLPrettyPrint.xsl",
            theXML: rdfXML,
            window: window,
            serialize: true,
            callback: function(rdfString){
                if (!rdfString) {
                    rdfString = "Unable to generate RDF/XML";
                }
                Ext.getCmp("remrdfview").body.update(rdfString);
            }
        });
    },
    
    /** Display an error message to the user
     * @param {String} message The message to display */
    error : function(/*String*/message){
        var statusopts = {
                'text': message,
                'iconCls': 'error-icon',
                'clear': {
                    'wait': 3000
                }
        };
        lore.ore.ui.status.setStatus(statusopts);
        lore.global.ui.loreError(message);
    },
    /**
     * Display an information message to the user
     * @param {String} message The message to display
     */
    info : function(/*String*/message) {
        var statusopts = {
                    'text': message,
                    'iconCls': 'info-icon',
                    'clear': {
                        'wait': 3000
                    }
        };
        lore.ore.ui.status.setStatus(statusopts);
        lore.global.ui.loreInfo(message);
    },
    /**
     * Display a warning message to the user
     * @param {String} message The message to display
     */
    warning : function(/*String*/message){
        var statusopts = {
            'text': message,
            'iconCls': 'warning-icon',
            'clear': {
                'wait': 3000
            }
        };
        lore.ore.ui.status.setStatus(statusopts);
        lore.global.ui.loreWarning(message);
    },
    /**
     * Display a progress message (with loading icon) to the user
     * @param {} message The message to display
     */
    progress : function(message){
        var statusopts = {
            'text': message,
            'iconCls': 'loading-icon',
            'clear': false
        };
        lore.ore.ui.status.setStatus(statusopts);
        lore.global.ui.loreInfo(message);
    }
});