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
/**
 * Connection figure that provides a context menu to set the connection type
 * The types are sourced from ontrelationships, which is populated from an ontology (see uifunctions.js)
 * @class lore.ore.ui.graph.ContextmenuConnection
 * @extends draw2d.Connection
 */
lore.ore.ui.graph.ContextmenuConnection = Ext.extend(draw2d.Connection, {
    constructor: function() {
    	draw2d.Connection.call(this);
    	this.lineColor = new draw2d.Color(174,174,174); // light grey
    	this.labelColor = new draw2d.Color(51,51,51); // dark grey
        this.label = new draw2d.Label();
        this.label.setColor(this.labelColor);
        this.addFigure(this.label, new lore.ore.ui.graph.LabelLocator(this));
    	this.setRouter(new draw2d.BezierConnectionRouter());
        this.setRelationshipType("http://purl.org/dc/elements/1.1/","relation",false);
    	this.sourcePort=null;
        this.targetPort=null;
    	this.lineSegments=[];
    	this.setColor(this.lineColor);
    	this.setLineWidth(1);
        var tgtArrow = new lore.ore.ui.graph.ArrowConnectionDecorator();
        tgtArrow.setColor(this.lineColor);
        this.setTargetDecorator(tgtArrow); 
    	this.setSourceAnchor(new draw2d.ChopboxConnectionAnchor());
    	this.setTargetAnchor(new draw2d.ChopboxConnectionAnchor());
        this.label.html.className="ctxtConnLabel";
    },
    /**
     * Return the id
     * @return {}
     */
    getId : function(){
        return this.id;
    },
    /** Set relationship with undo support */
    setRelationship : function(enamespace, etype, symmetric) {
        this.workflow.getCommandStack().execute(new lore.ore.ui.graph.CommandSetRelationship(this, enamespace, etype, symmetric));
    },
    /**
     * Update the type of relationship that the connection represents
     * @param {} enamespace
     * @param {} etype
     * @param {} symmetric
     */
    setRelationshipType : function(enamespace, etype, symmetric) {
    	this.edgetype=etype;
    	this.edgens=enamespace;
        this.symmetric = symmetric;
    	this.label.setText(etype);
        try {
    	    if (symmetric) {
    	        var theArrow = new draw2d.ArrowConnectionDecorator();
    	        theArrow.setColor(this.lineColor);
    	        this.setSourceDecorator(theArrow);
    	    } else {
    	        this.setSourceDecorator(null);
    	    }
        } catch(ex) {
            lore.debug.ore("Exception setting connection rel type",ex);
        }
    },
    createHTMLElement : function() {
        var item = draw2d.Connection.prototype.createHTMLElement.call(this);
        item.className = "ctxtConn";
        return item;
    },
    /**
     * Construct the context menu for selecting the connection type
     * @return {}
     */
    onContextMenu : function(x,y) {
        try {
        	if (!(lore.ore.ui.graph.ContextmenuConnection.contextMenu && (
    	            lore.ore.ui.graph.ContextmenuConnection.loadedOntology == lore.ore.onturl))) {
    	        
    	    	lore.debug.ore("generating context menu for connection",this);
        		lore.ore.ui.graph.ContextmenuConnection.contextmenu = new Ext.menu.Menu({
                    showSeparator: false
                });
                var cm = lore.ore.ui.graph.ContextmenuConnection.contextmenu;
    		    
    			// sort the menu entries alphabetically
                var om = lore.ore.ontologyManager;
    			var keys = [];
    		 	for (var rel in om.ontrelationships) {
    				keys.push(rel);
    		 	}
    		 	keys.sort();
                
    		 	for (var i =0; i< keys.length; i++) {
    		 		rel = keys[i];
    				var relnamespace=om.ontrelationships[rel]; 
    	            var symmquery = om.ontology.prefix('rdf',lore.constants.NAMESPACES["rdf"])
    	                .where('<' + relnamespace + rel +'> rdf:type <' + lore.constants.OWL_SPROP + '>');
    		        var symm = symmquery.length > 0;		
    		 		cm.add({
                        text: rel,          
                        scope: {ns: relnamespace, rel:rel, symm: symm},
                        handler: function(evt){
                        	lore.ore.ui.graphicalEditor.getSelectedFigure().setRelationship(this.ns, this.rel, this.symm);
                        }
                     });
    		 	}
    	        lore.ore.ui.graph.ContextmenuConnection.loadedOntology = om.ontologyURL;
    			
    	    }
        	var w = this.workflow;
        	var absx = w.getAbsoluteX() +  x - w.getScrollLeft();
    		var absy = w.getAbsoluteY() +  y - w.getScrollTop();
    		lore.ore.ui.graph.ContextmenuConnection.contextmenu.showAt([absx, absy]);
    		
        } catch (ex){ 
            lore.debug.ore("problem generating context menu for connection",ex);
            return null;
        }
    },
    /** Override to make decorator look better on very short lines */
    getEndAngle : function() {
        var angle = 180;
        try {
    	  var p1 = this.lineSegments.get(this.lineSegments.getSize()-1).end;
    	  var p2 = this.lineSegments.get(this.lineSegments.getSize()-1).start;
    	  if(this.router instanceof draw2d.BezierConnectionRouter) {
    	   p2 = this.lineSegments.get(this.lineSegments.getSize()-5).end;
    	  }
    	  var length = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
    	  // adjustment for short lines
    	  if (length < 8) {
    	    p2 = this.lineSegments.get(this.lineSegments.getSize()-20).end;
    	    length = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
    	  }
    	  angle = -(180/Math.PI) *Math.asin((p1.y-p2.y)/length);
    	  
    	  if (angle<0) {
    	     if(p2.x<p1.x) {
    	       angle = Math.abs(angle) + 180;
             } else {
    	       angle = 360- Math.abs(angle);
             }
    	  }
    	  else {
    	     if (p2.x < p1.x) {
    	       angle = 180-angle;
             }
    	  }
        } catch (e) {
    	    lore.debug.ore("ContextMenuConnection.getEndAngle: error", e);
    	}
      return angle;
    }
});
