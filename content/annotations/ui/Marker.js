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
 * Class that abstracts a highlighted area of text or of an image based off an xpointer or semantic pointer. This
 * highlighted area can have tooltip based off of annotation data.
 * @param {Object} args Valid arguments are 
 * {
 * 	xpointer: The xpointer pointing to the image region or area of text to be highlighted
 *  borderWidth: The width of the border used for highlighting 
 *  target: The target document the xpointer applies to. Defaults to the current content window (tab).
 */
	
	lore.anno.ui.Marker = function(args){
	
		this.xpointer = lore.global.util.normalizeXPointer(args.xpointer);
		this.target = args.target || lore.global.util.getContentWindow(window).document;
		this.type = lore.global.util.isXPointerImageRange(this.xpointer) ? 1 : 0;
		this.visible = false;
		this.bw = args.borderWidth || 1;
		this.page = args.page;
	}
	
	lore.anno.ui.Marker.prototype = {
		/**
					 * Highlight the marker and 
					 * @param {Colour} colour Colour of the highlighting border
					 * @param {Function} styleCallback Callback function to override how the highlighting is performed
					 * @param {Boolean} scroll Specify whether to scroll to the highlighted DOM element defaults to false
					 */
					show : function (colour, styleCallback, scroll) {
						this.colour = colour;
						this.styleCallback = styleCallback;
						
						if ( this.type == 1) {
							if (!this.data) {
								this.data = lore.global.util.parseImageRangeXPointer(this.xpointer, this.target);
							} 
							
							var doc = this.target;
							var _div = $(lore.global.util.domCreate('span', doc));
							var _parent = $('body',doc)
							_parent.append(_div);
							this.data.nodes = [_div.get(0)];
							this.update(); 
							
							if ( scroll )
								lore.global.util.scrollToElement(this.data.nodes[0], this.target.defaultView);
							
						} else {
							var type = this.type;
							var stylin = function(domNode){
									domNode.style.backgroundColor = colour || "yellow";
									if ( styleCallback) styleCallback(type, domNode);
								}
								
							if (!this.data || !this.data.nodes) {
								if (typeof(this.xpointer) != 'string' ) {
									this.data = {};
									if ( this.page.rdfa) {
										
										this.data.range = lore.global.util.getSelectionForHash(this.xpointer[0], this.page.rdfa.rdf.databank.triples());
										lore.debug.anno("Resolved from hashed triple string to range: " + this.data.range, this.data.range);
									}
									else {
										this.data.range = lore.global.util.getSelectionForXPath(this.xpointer[1], this.target);
									}
								}
								else {
									this.data = {
										range: lore.global.util.getSelectionForXPath(this.xpointer, this.target)
									};
								}
								
								this.data.nodes = lore.global.util.highlightRange(this.data.range, this.target, scroll, stylin);
							} else {
								for (var i=0; i < this.data.nodes.length; i++ ) {
									stylin(this.data.nodes[i]);
								}
							}
						}	
						
						this.visible = true;		
					},

					/**
					 * Updates the position and size of the marker based off any changes made
					 * to the window size and parameters passed in.
					 * @param {Object} colour The colour the border should be changed to
					 * @param {Object} styleCallback The callback function that overrides how the highlighting is displayed
					 */
					update : function(colour, styleCallback){
						try {
							if (this.data.nodes && this.type == 1) {
							
								this.colour = colour || this.colour;
								this.styleCallback = styleCallback || this.styleCallback;
								
								var c = lore.anno.ui.scaleImageCoords(this.data.image, this.data.coords, this.target);
								var o = lore.anno.ui.calcImageOffsets(this.data.image, this.target);
								
									var _n = $(this.data.nodes[0]);
									_n.css({
										position: 'absolute',
										left: c.x1 + o.left + this.bw,
										top: c.y1 + o.top + this.bw,
										border: this.bw + 'px solid ' + this.colour,
										zIndex: _n.parent().css('zIndex')
									}).width(c.x2 - c.x1 - this.bw * 2).height(c.y2 - c.y1 - this.bw * 2);
									if (this.styleCallback) 
										this.styleCallback(this.type, this.data.nodes[0]);
							}
						}catch (e ) {
							lore.debug.anno(e,e);
						}
					},
							
					/**
					 * Hide the highlighted area of text or image and remove the marker
					 * DOM entry from the document.
					 */			
					hide : function(){
						try {
							if (this.data && (this.data.image || this.data.nodes)) {
								var w = lore.global.util.getContentWindow(window);
								if (this.type == 0) {
									for (var i = 0; i < this.data.nodes.length; i++) {
										var n = this.data.nodes[i];
										if (n) {
											n.style.display = 'none'; // in the event removal fails, the marker
																// will at least be hidden
											lore.global.util.removeNodePreserveChildren(n, w);
										}
									}
									this.data = null;
								}
								else {
									this.data.nodes[0].style.display = 'none';
									lore.global.util.removeNodePreserveChildren(this.data.nodes[0], w);
								}
							}
							this.visible = false;
						}catch (e){
							lore.debug.anno(e,e);
						}
					},
					
				/**
				 * Generated a pop up for the given annotation and place the HTML into the
				 * supplied dom container
				 * @param {Object} annodata	The annotation to create the tip for
				 * @param {Object} domContainer An object or an array containing the dom container/s
				 * to insert the pop up HTML into
				 */
		 		tip : function(annodata){
				try {
					var doc = this.target || lore.global.util.getContentWindow(window).document;
					var cw = doc.defaultView;
					var uid = annodata.id;
					var desc = "<div style='color:white;background-color:darkred;width:100%;min-height:18'><strong>" + annodata.title + "</strong></div><span style='font-size:smaller;color:#51666b;'>" + lore.global.util.splitTerm(annodata.type).term +
					" by " +
					annodata.creator +
					"<br />";
					desc += "<div style='max-width:" + (cw.innerWidth * 0.75 - 30) + ";max-height: " + (cw.innerHeight * 0.75 - 30) + ";overflow:auto' >"; 			
					desc += lore.anno.ui.genDescription(annodata, true);
					desc += '</div>';
					//desc += lore.anno.ui.genDescription(annodata, true);
					var d = lore.global.util.longDate(annodata.created, Date);
					desc += "<br /><span style=\"font-size:smaller;color:#aaa\">" + d + "</span></span><br />";
					var descDom = doc.createElement("span");
					descDom.setAttribute("style", "font-family:sans-serif");
					descDom.setAttribute("display", "none");
					
					// innerHTML does not work for pages that are image/... content type, so parse html
					// by temporarily adding to local document head. html has been sanitized.
					var	h =	document.getElementsByTagName("head")[0];
					h.appendChild(descDom); 
					descDom.innerHTML = desc;
					h.removeChild(descDom);
					descDom.removeAttribute("display");

				$(this.data.nodes[0], doc).simpletip({
					content: descDom,
					focus: true,
					boundryCheck: false,
					position: 'cursor',
					showEffect: 'custom',
					onetip: true,
					closeIcon: closeIcon,
					showCustom: function(){
						try {
								Ext.apply(this.context.style, 
								{
									position : 'absolute',
									opacity  : "1",
									backgroundColor : "#fcfcfc",
									fontSize : "9pt",
									fontWeight : "normal",
									color : "#51666b",
									border : '1.5px solid darkgrey',
									zIndex : "3",
									fontFamily : 'sans-serif',
									maxWidth : cw.innerWidth * 0.75,
									maxHeight : cw.innerHeight * 0.75
									//overflow : 'auto'
								});
								
							jQuery(this).animate({
								width: 'auto',
								display: 'block'
							}, 400);
						} 
						catch (e) {
							lore.debug.anno("error showing tip: " + e, e);
						}
					}
				});
		}
		catch (ex) {
			lore.debug.anno("Tip creation failure: " + ex, ex);
		}
	}
		
}