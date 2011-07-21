lore.anno.ui.AnnotationsDataView = Ext.extend(Ext.DataView, {
    initComponent : function() {
        Ext.apply(this, {
            tpl: new Ext.XTemplate(
                '<tpl for=".">',
                '<div class="annoListing" qtip="{title}">',
                    '<div class="annoListingTitle">{title}</div>',
                    '<div class="annoURL">{resource}</div>',
                    '<div class="annoListingMeta">{creator}',
                        ', created {created:date("M j, Y")}',
                        '<tpl if="typeof modified != \'undefined\' && modified != null && modified != \'\'">, last modified {modified:date("M j, Y")}</tpl>',
                    '</div>',
                '</div>',
                '</tpl>'
            ),
            loadingText: "Loading annotations...",
            multiSelect: true,
            autoScroll: true,
            itemSelector: "div.annoListing",
            overClass:'x-view-over',
            emptyText: 'No annotations / annotations loading'
        });
        lore.anno.ui.AnnotationsDataView.superclass.initComponent.apply(this,arguments);
        
        
        this.getSelectedRecords();
        
        var contextmenu = new Ext.menu.Menu({
            items: [{
                text: "Add as node/s in compound object editor",
                handler: function () {
                	var recs = this.getSelectedRecords();
                	lore.anno.ui.handleAddResultsToCO(recs);
                },
                scope: this
            }, {
                text: "View annotation/s in browser",
                handler: function () {
                	var recs = this.getSelectedRecords();
                	lore.anno.ui.handleViewAnnotationInBrowser(recs);
                },
                scope: this
            }
        ]});
        this.on('contextmenu', function(scope, rowIndex, node, e) {
            e.preventDefault();
            this.select(node, true);
            contextmenu.showAt(e.xy);
        }, this);
        
        this.on('click', function searchLaunchTab(dv, rowIndex, node, event) {
            if (!event.ctrlKey && !event.shiftKey) {
                    var record = this.getRecord(node);
                    var ruri = record.data.resource;
                    if (ruri && ruri.match(lore.anno.prefs.url)){
                            ruri += "?danno_useStylesheet=";
                    }
                    lore.anno.annoMan.justUpdated = record.id;
                    lore.global.util.launchTab(ruri);
            }
        }, this);
    }
});
Ext.reg('annodataview', lore.anno.ui.AnnotationsDataView);
