
/** Class definitions **/

		/**  Tree UI Class Definitions
  
 
		 * @class Ext.ux.tree.ColumnTree
		 * @extends Ext.tree.TreePanel
		 * 
		 * @xtype columntree
		 */
		lore.ui.anno.LOREColumnTree = Ext.extend(Ext.tree.TreePanel, {
		    lines : false,
		    borderWidth : Ext.isBorderBox ? 0 : 2, // the combined left/right border for each cell
		    cls : 'x-column-tree',
		
		    onRender : function(){
		        lore.ui.anno.LOREColumnTree.superclass.onRender.apply(this, arguments);
				this.headers = this.header.createChild({cls:'x-tree-headers'});
				
		        var cols = this.columns, c;
				var totalWidth = 0;
		        var scrollOffset = 19; // similar to Ext.grid.GridView default
		        
				//// prevent floats from wrapping when clipped
		        for(var i = 0, len = cols.length; i < len; i++){
		             c = cols[i];
		             totalWidth += c.width;
		             this.headers.createChild({
		                 cls:'x-tree-hd ' + (c.cls?c.cls+'-hd':''),
		                 cn: {
		                     cls:'x-tree-hd-text',
		                     html: c.header
		                 },
		                 style:'width:'+(c.width-this.borderWidth)+'px;',
		             });
		        }
		        this.headers.createChild({cls:'x-clear'});
				//this.headers.setWidth(totalWidth+scrollOffset);
		        //this.innerCt.setWidth(totalWidth);
		        //TODO: Fix widths
		        this.headers.setWidth(this.width+scrollOffset);
		        this.innerCt.setWidth(this.width);
		        
		    }
		});

		lore.ui.anno.LOREColumnTreeNode = function(attributes){

			this.title = attributes.title || '';
			this.info = attributes.info || '';
			this.links = attributes.links || [];
			this.nodeType = attributes.nodeType;
			lore.ui.anno.LOREColumnTreeNode.superclass.constructor.call(this, attributes);
		}
    
		Ext.extend(lore.ui.anno.LOREColumnTreeNode, Ext.tree.TreeNode, {
			
			setText: function(title,info,text) {
			
				var oldText = this.text;
				var oldTitle = this.title;
				var oldInfo = this.info;
		        this.title = title;
				this.info = info;
				this.text = text;
				this.attributes.title = title;
				this.attributes.info = info;
				this.attributes.text = text;
        		
				if(this.rendered){ // event without subscribing
            		this.ui.onTextChange(this, title, info, text, oldTitle, oldInfo, oldText);
        		}
        		this.fireEvent('textchange', this, title, info, text, oldText);
			}
			

		});
		
		
		lore.ui.anno.LOREColumnTreeNodeUI = Ext.extend(Ext.tree.TreeNodeUI, {
			// private
			
			focus: Ext.emptyFn,
			onTextChange: function(node,title,info,text, oldtitle, oldinfo, oldtext) {
				 if(this.rendered){
           			 this.textNode.innerHTML = text;
					 this.titleNode.innerHTML = title;
					 this.infoNode.innerHTML = info;
       			 }
			},
			
			renderElements: function(n, a, targetNode, bulkRender){
				// add some indent caching, this helps performance when rendering a large tree
				this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';
				
				var t = n.getOwnerTree();
				var cols = t.columns;
				var bw = t.borderWidth;
				var c = cols[0];
				
				var cb = typeof a.checked == 'boolean';
				
				var href = a.href ? a.href : Ext.isGecko ? "" : "#";
				var linksBuf = "";
				for (var i = 0; i < n.links.length; i++) {
						linksBuf += "<a title=\"" + n.links[i].title + "\" href=\"#\" onclick=\"" + n.links[i].jscript + "\"><img  src='" + this.emptyIcon + "' class='x-tree-node-icon x-tree-node-inline-icon anno-view " + n.links[i].iconCls + "' /></a><span class='left-spacer4' />";
				}
				
				var buf = ['<li class="x-tree-node"><div ext:tree-node-id="', n.id, 
				'" class="x-tree-node-el x-tree-node-leaf ', a.cls, '" unselectable="off">',
				 '<div class="x-tree-col" style="width:', c.width-bw,'px;">',
				 '<span style="padding-left:', (n.getDepth()-1)*16,'" class="x-tree-node-indent"></span>', 
				 '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />', 
				 '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon', (a.icon ? " x-tree-node-inline-icon" : ""), (a.iconCls ? " " + a.iconCls : ""), 
				 '" unselectable="on" />', 
				 '<div style="display:inline-block;width:', c.width-bw-(32 + n.getDepth() * 16),'"><div>',  n.title, '</div>', (n.info ? '<div>' + n.info + '</div>':'<span></span>'),
				'<div style="width:100%" class="x-tree-col-text">', n.text, "</div></div></div>"];
				
				 for(var i = 1, len = cols.length; i < len; i++){
             		c = cols[i];

            		 buf.push('<div class="x-tree-col ',(c.cls?c.cls:''),'" style="width:',c.width-bw,'px;">',
                       // '<div class="x-tree-col-text">','blah'(c.renderer ? c.renderer(a[c.dataIndex], n, a) : a[c.dataIndex]),"</div>",
					    '<div class="x-tree-col-text">',linksBuf,"</div>",
                      "</div>");
         			}
				  buf.push(
            	'<div class="x-clear"></div></div>',
            	'<ul class="x-tree-node-ct" style="display:none;"></ul>',
            	"</li>");
			
				var nel;
				 if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
           			 this.wrap = Ext.DomHelper.insertHtml("beforeBegin",
                                n.nextSibling.ui.getEl(), buf.join(''));
        		}else{
          			  this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(""));
       			 }
				
				this.elNode = this.wrap.childNodes[0];
				this.ctNode = this.wrap.childNodes[1];
				var cs = this.elNode.firstChild.childNodes;
				this.indentNode = cs[0];
				this.ecNode = cs[1];
				this.iconNode = cs[2];
				this.titleNode = cs[3].firstChild;
				this.infoNode = this.titleNode.nextSibling;
				this.anchor = this.textNode = this.infoNode.nextSibling;
			},
		});
		

Ext.reg('loretreepanel', lore.ui.anno.LOREColumnTree);

/**	 Timeline UI Definitions
	 * Replaces default function for generating contents of timeline bubbles
	 * @param {} elmt
	 * @param {} theme
	 * @param {} labeller
	 */
		Timeline.DefaultEventSource.Event.prototype.fillInfoBubble = function(elmt, theme, labeller){
			var doc = elmt.ownerDocument;
			var title = this.getText();
			var link = this.getLink();
			var image = this.getImage();
			
			if (image != null) {
				var img = doc.createElement("img");
				img.src = image;
				
				theme.event.bubble.imageStyler(img);
				elmt.appendChild(img);
			}
			
			var divTitle = doc.createElement("div");
			var textTitle = doc.createTextNode(title);
			if (link != null) {
				var a = doc.createElement("a");
				a.href = link;
				a.appendChild(textTitle);
				divTitle.appendChild(a);
			}
			else {
				divTitle.appendChild(textTitle);
			}
			theme.event.bubble.titleStyler(divTitle);
			elmt.appendChild(divTitle);
			
			var divBody = doc.createElement("div");
			this.fillDescription(divBody);
			theme.event.bubble.bodyStyler(divBody);
			elmt.appendChild(divBody);
			
			var divTime = doc.createElement("div");
			this.fillTime(divTime, labeller);
			divTime.style.fontSize = 'smaller';
			divTime.style.color = '#aaa';
			elmt.appendChild(divTime);
			
			var divOps = doc.createElement("div");
			divOps.style.paddingTop = '5px';
			var divOpsInner = "<a style='color:orange;font-size:smaller' href='#' " +
			"onclick='lore.ui.anno.annotimeline.getBand(0).closeBubble();lore.ui.anno.handleEditAnnotation(\"" +
			this._eventID +
			"\")'>EDIT</a> | " +
			"<a style='color:orange;font-size:smaller' href='#' " +
			"onclick='lore.ui.anno.annotimeline.getBand(0).closeBubble();lore.ui.anno.handleReplyToAnnotation(\"" +
			this._eventID +
			"\")'>REPLY</a>";
			divOps.innerHTML = divOpsInner;
			elmt.appendChild(divOps);
			
			var annoid = this._eventID;
			var node = lore.util.findChildRecursively(lore.ui.annotationstreeroot, 'id', annoid);
			if ( node) {
				node.select();
			} else {
				lore.debug.anno("Could not select node for :" + annoid, annoid); 
			}
									
		};


loreuiannoabout = function () { 
	return {
				title: "Using Annotations",
				id: "about",
				autoWidth: true,
				autoScroll: true,
				iconCls: "welcome-icon"};
}

loreuieditor = function (model ) {
	
	return {
			 	region: "south",
			 	split: true,
				height: 300,
			 	xtype: "form",
			 	
				id: "annotationslistform",
				trackResetOnLoad: true,
			 	title: "Editor",
			 	layout: 'border',
				items: [{
			 		region: "center",
		 			xtype: 'fieldset',
		 			layout: 'form',
		 			autoScroll: true,
		 			id: 'annotationsform',
		 			labelWidth: 100,
		 			
						defaultType: 'textfield',
						labelAlign: 'right',
						buttonAlign: 'right',
						style: 'border:none; margin-left:10px;margin-top:10px;',
						defaults: {
							hideMode: 'display',
							anchor: '-30'
						},
						
						items: [{
							xtype: "combo",
							id: "typecombo",
							fieldLabel: 'Type',
							name: 'type',
							hiddenName: 'type',
							store: new Ext.data.SimpleStore({
								fields: ['typename', 'qtype'],
								data: [['Comment', "http://www.w3.org/2000/10/annotationType#Comment"], ['Explanation', "http://www.w3.org/2000/10/annotationType#Explanation"], ['Variation', "http://austlit.edu.au/ontologies/2009/03/lit-annotation-ns#VariationAnnotation"]]
							}),
							valueField: 'qtype',
							displayField: 'typename',
							typeAhead: true,
							triggerAction: 'all',
							forceSelection: true,
							mode: 'local',
							selectOnFocus: true
						}, {
							fieldLabel: 'Title',
							name: 'title',
							
						}, {
							fieldLabel: 'Creator',
							name: 'creator',
							
						}, {
							fieldLabel: 'Variation Agent',
							name: 'variationagent',
							
							hideParent: true
						}, {
							fieldLabel: 'Variation Place',
							name: 'variationplace',
							
							hideParent: true
						}, {
							fieldLabel: 'Variation Date',
							name: 'variationdate',
							
							hideParent: true
						}, {
							fieldLabel: 'ID',
							name: 'id',
							hidden: true,
							hideLabel: true,
							style: {
								padding: 0,
								margin: 0,
								display: 'none'
							}
						}, {
							fieldLabel: 'Annotates',
							name: 'res',
							readOnly: true,
							hideParent: true,
							style: {
								background: 'none',
								border: 'none',
								'font-size': '90%'
							},
							labelStyle: 'font-size:90%;'
						
						}, {
							fieldLabel: 'Context',
							name: 'context',
							readOnly: true,
							hidden: true,
							hideLabel: true,
							style: {
								background: 'none',
								border: 'none',
								padding: 0,
								margin: 0
							}
						}, 
						
						 {
							fieldLabel: 'Original resource',
							name: 'original',
							id: 'originalfield',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								'font-size': '90%'
							},
							labelStyle: 'font-size:90%'
						}, {
							fieldLabel: 'Original Context Xpointer',
							name: 'originalcontext',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								padding: 0,
								margin: 0
							},
							hidden: true,
							hideLabel: true
						}, {
							fieldLabel: 'Selection',
							name: 'contextdisp',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								'font-size': '90%'
							},
							labelStyle: 'font-size:90%;'
						}, {
							xtype:"button",
							text: 'Update Selection',
							fieldLabel: '',
							id: 'updctxtbtn',
							tooltip: 'Set the context of the annotation to be the current selection from the main browser window'
						},
						{
							fieldLabel: 'Variant resource',
							name: 'variant',
							id: 'variantfield',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								'font-size': '90%'
							},
							labelStyle: 'font-size:90%'
						}, {
							fieldLabel: 'Variant Context Xpointer',
							name: 'variantcontext',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								padding: 0,
								margin: 0
							},
							hidden: true,
							hideLabel: true
						}, {
							fieldLabel: 'Variant Selection',
							name: 'rcontextdisp',
							readOnly: true,
							style: {
								background: 'none',
								border: 'none',
								'font-size': '90%'
							},
							labelStyle: 'font-size:90%'
						},{
							xtype:"button",
							text: 'Update Selection',
							fieldLabel: '',
							id: 'updrctxtbtn',
							hidden: true,
							
							tooltip: 'For Variation Annotations: set the context in the variant resource to be the current selection from the main browser window'
						}, 
						{
							id: 'tagselector',
							xtype: 'superboxselect',
							allowBlank: true,
							msgTarget: 'under',
							allowAddNewData: true,
							fieldLabel: 'Tags',
							emptyText: 'Type or select tags',
							resizable: true,
							name: 'tags',
							store: new Ext.data.SimpleStore({
								fields: ['id', 'name'],
								data: lore.anno.thesaurus
							}),
							mode: 'local',
							displayField: 'name',
							valueField: 'id',
							extraItemCls: 'x-tag',
							listeners: {
								newitem: function(bs, v){
									v = v.slice(0, 1).toUpperCase() + v.slice(1).toLowerCase();
									var newObj = {
										id: v,
										name: v
									};
									bs.addItem(newObj);
								}
							}
						}, {
							fieldLabel: 'Body',
							xtype: 'htmleditor',
							plugins: [new Ext.ux.form.HtmlEditor.Img()],
							name: 'body',
							enableFont: false,
							enableColors: false,
							enableSourceEdit: false,
							anchor: '-30 100%'
						}],
						buttons: [{
							text: 'Save Annotation',
							id: 'updannobtn',
							tooltip: 'Save the annotation to the repository'
						},{
							text: 'Delete Annotation',
							id: 'delannobtn',
							tooltip: 'Delete the annotation - CANNOT BE UNDONE'
						},  {
							text: 'Reset',
							id: 'resetannobtn',
							tooltip: 'Reset - changes will be discarded'
						}]
					}]
					
				};
}

loreuiannotreeandeditor = function (model) {
	return {
			title: "Tree",
			xtype: "panel",
			id: "treeview",
			layout: "border",
			items: [{
				region: "center",
				layout: "border",
				items: [{
					region: "center",
					xtype: "loretreepanel",
					id: "annosourcestree",
					animate: true,
					autoScroll: true,
					columns: [{
						header: "Annotations",
						
						width: 280
					}, {
						header: "Views",
						width: 66
					}],
					header: true,
					rootVisible: false,
					containerScroll: true,
					split: true,
					border: false,
					pathSeparator: " ",
					root: new Ext.tree.TreeNode({}),
					dropConfig: {
						appendOnly: true
					}
				}]
			}, 
				loreuieditor(model)]
			};
}
			
loreuiannotimeline = function (model)
{
	return {
		title: "Annotation Timeline",
		xtype: "panel",
		id: "annotimeline"
	}
}
	
lore.ui.anno.initGUI = function(model){
	lore.debug.ui("initGUI: model " + model, model);
	if (!model) {
		lore.debug.ui("No model found for view");
		return;
	}
	
	try {
		lore.ui.anno.gui_spec = {
			layout: "border",
			items: [{
				region: "center",
				layout: "fit",
				border: false,
				items: [{
					layout: "border",
					border: false,
					items: [{
						region: "center",
						border: false,
						layout: "fit",
						items: [{
							xtype: "tabpanel",
							title: "Annotations",
							id: "annotationstab",
							deferredRender: false,
							activeTab: "treeview",
							items: [loreuiannotreeandeditor(model), loreuiannotimeline(model)		
							, loreuiannoabout() ],
						},
						{xtype: "panel",
						id : "dispanel",
						visible: false,
						items: [ { fieldLabel:"This feature is disabled"}]
						}
						]
					}, {
						region: "south",
						xtype: "statusbar",
						id: "lorestatus",
						defaultText: "",
						autoClear: 6000,
					}]
				}]
			}]
		};
		
		lore.ui.anno.main_window = new Ext.Viewport(lore.ui.anno.gui_spec);
		lore.ui.anno.main_window.show();
		lore.ui.anno.initExtComponents();
	} 
	catch (ex) {
		lore.debug.ui("Exception creating anno UI", ex);
	}
}

lore.ui.anno.initExtComponents = function(){
	try {
		
		lore.ui.abouttab = Ext.getCmp("about");
		lore.ui.anno.views = Ext.getCmp("annotationstab");
		var annosourcestreeroot = Ext.getCmp("annosourcestree").getRootNode();
		lore.ui.clearTree(annosourcestreeroot);
		lore.ui.annotationstreeroot = annosourcestreeroot; 

		lore.ui.annotationstreeroot.expand();
		
		Ext.getCmp("annosourcestree").on("click", lore.ui.anno.handleAnnotationSelection);
		Ext.getCmp("annosourcestree").on("dblclick", lore.ui.anno.handleEditAnnotation);
			
		
		lore.ui.lorestatus = Ext.getCmp('lorestatus');
		lore.ui.annotationsformpanel = Ext.getCmp("annotationslistform")
		lore.ui.annotationsform = lore.ui.annotationsformpanel.getForm();
		lore.ui.annotationsformpanel.hide();
		
		// set up the sources tree
		
		Ext.getCmp("resetannobtn")
				.on('click', function () { lore.ui.anno.rejectChanges()});
		Ext.getCmp("updannobtn").on('click', lore.ui.anno.handleSaveAnnotationChanges);
		Ext.getCmp("delannobtn").on('click', lore.ui.anno.deleteMsgBoxShow);
		Ext.getCmp("updctxtbtn").on('click',
				lore.ui.anno.handleUpdateAnnotationContext);
		Ext.getCmp("updrctxtbtn").on('click',
				lore.ui.anno.handleUpdateAnnotationVariantContext);
		Ext.getCmp("variantfield").on('specialkey', lore.ui.anno.launchFieldWindow);
		Ext.getCmp("originalfield").on('specialkey', lore.ui.anno.launchFieldWindow);
		Ext.getCmp("typecombo").on('valid', lore.ui.anno.handleAnnotationTypeChange);
		lore.ui.annotationsform.findField("body").on("push", function(field, html) {
			// this is hack to stop this field being flagged as dirty because
			// originalValue is XML and the value field is converted to HTML
			field.originalValue = field.getValue();
			
		});
		
		lore.ui.anno.setAnnotationFormUI(false);
		
		lore.ui.abouttab.body.update("<iframe height='100%' width='100%' "
			+ "src='chrome://lore/content/about_annotations.html'></iframe>");
			
	    Ext.QuickTips.interceptTitles = true;
	    Ext.QuickTips.init();
		
	} catch (e ) {
		lore.debug.ui("Errors during initExtComponents: " + e, e);
	}
}

/**
 * Create a Timeline visualisation
 */
lore.ui.anno.initTimeline = function() {
	var tl = Ext.getCmp("annotimeline");
	if (typeof Timeline !== "undefined") {
		lore.ui.anno.annoEventSource = new Timeline.DefaultEventSource();
        var theme = Timeline.ClassicTheme.create();
        theme.event.bubble.width = 350;
		var bandConfig = [Timeline.createBandInfo({
							eventSource : lore.ui.anno.annoEventSource,
                            theme: theme,
							width : "90%",
							intervalUnit : Timeline.DateTime.WEEK,
							intervalPixels : 100,
							timeZone : 10,
                            layout: "original"
						}), Timeline.createBandInfo({
							eventSource : lore.ui.anno.annoEventSource,
                            theme: theme,
                            //showEventText:  false,
							width : "10%",
							intervalUnit : Timeline.DateTime.MONTH,
							intervalPixels : 430,
							timeZone : 10,
                            layout: "overview"
						})];
        
		bandConfig[1].syncWith = 0;
		bandConfig[1].highlight = true;
		lore.ui.anno.annotimeline = Timeline.create(document
						.getElementById("annotimeline"), bandConfig, Timeline.HORIZONTAL);
		tl.on("resize", function() {
			lore.ui.anno.scheduleTimelineLayout();
		});
        lore.ui.anno.annotimeline.getBand(0).getEventPainter().setFilterMatcher(function(evt){
            return !(evt._eventID == "flagdelete");
        });
	}
}

	
	lore.ui.anno.disableUIFeatures = function(opts) {
    // TODO: should add UI elements back manually when re-enabling, but easier to reset via reload for now
    lore.debug.ui("LORE Annotations: disable ui features?", opts);
    lore.ui.disabled = opts;
    
	var annotab = Ext.getCmp("annotationstab");
   	
    if (opts.disable_annotations){
        if (annotab){
			lore.ui.anno.views.hide();
        }
    } else if (!annotab){
        window.location.reload(true);
    } else {
		if ( !annotab.isVisible() ) {
			annotab.show();
			annotab.doLayout();
		}
	}
}