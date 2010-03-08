/**
 * Class wrapper for an RDF annotation provides access to values modified from
 * dannotate.js
 * @class lore.anno.Annotation
 * @param {Node} rdf Root element of an RDF annotation returned by Danno
 * @param {boolean} bodyOps Optional parameter specifying RDF was loaded from file
 */
lore.anno.Annotation = Ext.extend(Ext.util.Observable, {
		
		load: function (config ) {
			Ext.apply(this, config);
			this.id  = "#new" + Math.uuid();
		},
		
		constructor: function(rdf, bodyOp){
		
		if (!rdf)
			return; 
		var tmp;
		var node;
		var attr;
		/** @property rdf
         * The wrappered rdf
		 */
		this.rdf = rdf;
		
		try {
			attr = rdf.getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'about');
			if (attr) {
                /** @property id
                 * Annotation URI (identifier)
                 */
				this.id = attr.nodeValue;
			}
			var isReply = false;
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["rdf"], 'type');
			
			for (var i = 0; i < node.length; i++) {
				attr = node[i].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
				if (attr) {
					tmp = attr.nodeValue;
				}
				if (tmp.indexOf(lore.constants.NAMESPACES["annotype"]) == 0) {
                    /** @property type
                     * The annotation type
                     */
					this.type = tmp;
				}
				else 
					if (tmp.indexOf(lore.constants.NAMESPACES["annoreply"]) == 0) {
						this.type = tmp;
					}
					else 
						if (tmp.indexOf(lore.constants.NAMESPACES["vanno"]) == 0) {
							this.type = tmp;
						}
						else 
							if (tmp.indexOf(lore.constants.NAMESPACES["thread"]) == 0) {
								isReply = true;
							}
				
			}
            /** @property isReply
             * @type boolean
             * Indicates whether this is a reply type of Annotation
             */
			this.isReply = isReply;
			
			if (!this.isReply) {
				// resource is a url	
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["annotea"], 'annotates');
				
				attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
				if (attr) {
                    /** @property resource
                     * The URI of the resource annotated (from Annotea annotates)
                     */
					this.resource = attr.nodeValue;
				}
				this.about = null;
			}
			else {
				
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["thread"], 'root');
				if (node[0]) {
					attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
					
					if (attr) {
						this.resource = attr.nodeValue;
					}
				}
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["thread"], 'inReplyTo');
				if (node[0]) {
					attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
					if (attr) {
                        /** @property about
                         *  If the annotation is a reply, about is the URI of the annotation to which is replies (from Annotea inReplyTo)
                         */
						this.about = attr.nodeValue;
					}
				}
			}
			
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["annotea"], 'body');
			
			if (!bodyOp || bodyOp == 3) {
				if (node[0]) {
					attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
					if (attr) {
                        /** @property bodyURL
                         * The URI of the body resource
                         */
						this.bodyURL = attr.nodeValue;
					}
				}
			} else if ( bodyOp == 1 ){
				var node = node[0].getElementsByTagName('body');
				if ( node[0]) {
					lore.debug.anno("node " + node[0], node[0]);
					var serializer = new XMLSerializer();
					var bodyText = serializer.serializeToString(node[0]);
                    /** @property body
                     * The content of the body resource
                     */
					this.body = lore.global.util.sanitizeHTML(bodyText, window) || '';
                    /** @property bodyLoaded
                     * @type boolean
                     * True if the {@link #body} property has been loaded from {@link #bodyURL}
                     */
					this.bodyLoaded = true;
				}
			}

			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["annotea"], 'created');
            /** @property created
             * From Annotea created (the date and time when the annotation was created)
             */
			this.created = lore.global.util.safeGetFirstChildValue(node);
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["annotea"], 'modified');
            /** @property modified
             * From Annotea modified (the date and time when the annotation was last modified)
             */
			this.modified = lore.global.util.safeGetFirstChildValue(node);
			
			this.meta = { context: null, fields: []};
			if (this.isReply) {
				this.context = '';
			}
			else {
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["annotea"], 'context');
                /** @property context
                 * From Annotea context
                 */
				this.context = lore.global.util.normalizeXPointer(lore.global.util.safeGetFirstChildValue(node));
				//TODO: change namespace
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'meta-context' );
				if (node && node.length > 0) {
					this.meta.context = lore.global.util.safeGetFirstChildValue(node);
					lore.debug.anno(this.meta.context, this.meta.context);
					this.meta.context = this.meta.context.split('\n');
					lore.debug.anno(this.meta.context, this.meta.context);

					
				}
				//TODO: enable and fix code, to read in semantic facts added
				/*node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'meta');
				if (node && node.length > 0) {
					lore.debug.anno(node.childNodes, node.childNodes);
					if (node.childNodes) {
						for (var i = 0; i < node.childNodes.length; i++) {
						
							var n = node.childNodes[i];
							lore.debug.anno(n, n);
							var type = n.getAttribute("typeof");
							lore.debug.anno(type, type);
							if (n.childNodes) {
								for (var j = 0; j < n.childNodes.length; j++) {
									var m = n.childNodes[i];
									lore.debug.anno(m, m);
									var prop = m.nodeName;
									var value = lore.global.util.safeGetFirstChildValue(m);
									lore.debug.anno(prop + ": " + value, {
										p: prop,
										v: value
									});
									this.meta.fields.push({
										type: type,
										prop: prop,
										value: value
									});
								}
							}
						}
					}
				}*/
			}
			
						
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["dc10"], 'creator');
            /** @property creator
             * dc:creator of the annotation
             */
			this.creator = lore.global.util.safeGetFirstChildValue(node, 'anon');
			
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["dc10"], 'title');
            /** @property title
             * dc:title of the annotation
             */
			this.title = lore.global.util.safeGetFirstChildValue(node);
			
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["dc10"], 'language');
            /** @property lang
             * dc:lang of the annotation
             */
			this.lang = lore.global.util.safeGetFirstChildValue(node);
			
			// body stores the contents of the html body tag as text
			if (this.bodyURL && !this.body && ( !bodyOp || bodyOp != 3)) {
				this.body = lore.anno.getBodyContent(this,window);
				this.bodyLoaded = true;
			}
			// get tags
			this.tags = "";
			node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'tag');
			for (var j = 0; j < node.length; j++) {
				var tagval = "";
				attr = node[j].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
				if (attr) {
					// a thesaurus tag
					tagval = attr.nodeValue;
				}
				else {
					// a freeform tag - make sure it's added to the list of tags
					tagval = node[j].firstChild.nodeValue;
					Ext.getCmp('tagselector').fireEvent('newitem', Ext.getCmp('tagselector'), tagval);
				}
				if (tagval) {
					if (j > 0) 
						this.tags += ",";
                        /** @property tags
                         * Tags attached to the annotation
                         */
					this.tags += tagval;
				}
			}
			
			// Additional fields for variation annotations only
			if (this.type.match(lore.constants.NAMESPACES["vanno"])) {
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'variant');
				if (node.length == 0) {
					node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'revised');
				}
				if (node[0]) {
					attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
					if (attr) {
                        /** @property variant
                         * For a VariationAnnotation, the URI of the variant resource
                         */
						this.variant = attr.nodeValue;
					}
				}
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'original');
				if (node[0]) {
					attr = node[0].getAttributeNodeNS(lore.constants.NAMESPACES["rdf"], 'resource');
					if (attr) {
                        /** @property original
                         * For a VariationAnnotation, the URI of the original resource
                         */
						this.original = attr.nodeValue;
					}
				}
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'original-context');
                /** @property originalcontext
                 * For a VariationAnnotation, the context associated with the {@link #original} resource
                 */
				this.originalcontext = lore.global.util.safeGetFirstChildValue(node);
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'variant-context');
				if (node.length == 0) {
					node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'revised-context');
				}
                /** @property variantcontext
                 * For a VariationAnnotation, the context associated with the {@link #variant} resource
                 */
				this.variantcontext = lore.global.util.safeGetFirstChildValue(node);
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'variation-agent');
				if (node.length == 0) {
					node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'revision-agent');
				}
				this.variationagent = lore.global.util.safeGetFirstChildValue(node);
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'variation-place');
				if (node.length == 0) {
					node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'revision-place');
				}
				this.variationplace = lore.global.util.safeGetFirstChildValue(node);
				node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'variation-date');
				if (node.length == 0) {
					node = rdf.getElementsByTagNameNS(lore.constants.NAMESPACES["vanno"], 'revision-date');
				}
				this.variationdate = lore.global.util.safeGetFirstChildValue(node);
			}
			if (!this.original) {
				this.original = this.resource;
			}
		} 
		catch (ex) {
			lore.debug.anno("Error parsing RDF" +
			(this.id ? ' for ' + this.id : ''), ex);
		}
		this.toString = function(){
			return "Annotation [" + this.id + "," +
			(this.modified ? this.modified : this.created) +
			"," +
			lore.global.util.splitTerm(this.type).term +
			"]";
		}
	},
	
	/**
	 * Determine whether an annotation is new, and is not in the respository
	 * @param {Object} anno An Annotation object or an Ext Record object 
	 * @return {Boolean} 
	 */
	 isNew : function () {
		return this.id.indexOf("#new") == 0;
	},
	
	/**
	 * Determine whether an annotation has any replies
	 * @param {Object} anno The annotation to test against
	 * @return {Boolean} True if it has any replies/children
	 */
	 hasChildren : function () {
		return this.replies && this.replies.count >0;
	}
	
});

lore.anno.RDFAnnotationSerializer  = function () {
	
}

lore.anno.RDFAnnotationSerializer.prototype = {
	/**
	 * Generate the RDF for an array of annotations  
	 * @param {Array} annos An array of records or Annotation objects 
	 * @param {Object} storeDates (Optional) Specify whethere dates are to be stored in the RDF. Defaults to false
	 * @return {String} The RDF that was generated
	 */

	serialize : function ( annos, storeDates ) {
		if (!annos.length )
			annos = [annos];
		
		var rdfxml = "<?xml version=\"1.0\" ?>";
		rdfxml += '<rdf:RDF xmlns:rdf="' + lore.constants.NAMESPACES["rdf"] + '">';
		
		for (var i = 0; i < annos.length; i++) {
			var annoOrig =  annos[i].data || annos[i]; // an array of records or anno objects
			var anno = {};
			
			for (var e in annoOrig) {
				var val = annoOrig[e];
				if (e!= 'body' && e!='tags' && typeof(val) == 'string') {
					anno[e] = val.replace(/&/g, '&amp;');
				}
				else 
					anno[e] =val;
				
			}
			
			rdfxml += '<rdf:Description';
			if (annoOrig.id && !annoOrig.isNew() ) {
				rdfxml += ' rdf:about="' + anno.id + '"';
			}
			rdfxml += ">";
			if (annoOrig.isReply) {
				rdfxml += '<rdf:type rdf:resource="http://www.w3.org/2001/03/thread#Reply"/>';
			}
			else {
				rdfxml += '<rdf:type rdf:resource="' + lore.constants.NAMESPACES["annotea"] +
				'Annotation"/>';
			}
			if (annoOrig.type) {
				rdfxml += '<rdf:type rdf:resource="' + anno.type + '"/>';
			}
			
			if (annoOrig.isReply) {
				rdfxml += '<inReplyTo xmlns="' + lore.constants.NAMESPACES["thread"] + '" rdf:resource="' + anno.about + '"/>';
				
				var rootannonode = lore.global.util.findRecordById(lore.anno.annods, annoOrig.about);
				if (rootannonode) {
					while (rootannonode.data.isReply) {
						rootannonode = lore.global.util.findRecordById(lore.anno.annods, rootannonode.data.about);
					}
					rdfxml += '<root xmlns="' + lore.constants.NAMESPACES["thread"] + '" rdf:resource="' + rootannonode.data.id.replace(/&/g,'&amp;') + '"/>';
				}
				else {
					rdfxml += '<root xmlns="' + lore.constants.NAMESPACES["thread"] + '" rdf:resource="' + anno.about + '"/>';
				}
				
			}
			else {
				
				if (annoOrig.variant) {
					rdfxml += '<annotates xmlns="' + lore.constants.NAMESPACES["annotea"] +
					'" rdf:resource="' +
					anno.original +	'"/>';
					rdfxml += '<annotates xmlns="' + lore.constants.NAMESPACES["annotea"] +
					'" rdf:resource="' +
					anno.variant +
					'"/>';
				}
				else {
					rdfxml += '<annotates xmlns="' + lore.constants.NAMESPACES["annotea"] +
					'" rdf:resource="' +
					anno.resource +
					'"/>';
				}
				// also send variant as annotates for backwards compatability with older
				// clients
				
			}
			
			if (annoOrig.lang) {
				rdfxml += '<language xmlns="' + lore.constants.NAMESPACES["dc10"] + '">' +
				anno.lang +
				'</language>';
			}
			if (annoOrig.title) {
				rdfxml += '<title xmlns="' + lore.constants.NAMESPACES["dc10"] + '">' + anno.title +
				'</title>';
			}
			if (annoOrig.creator) {
				rdfxml += '<creator xmlns="' + lore.constants.NAMESPACES["dc10"] + '">' +
				lore.global.util.trim(anno.creator) +
				'</creator>';
			}
			if (!annoOrig.created) {
				anno.created = new Date();
			}
			if (storeDates) {
				// TODO: format date strings
				rdfxml += '<created xmlns="' + lore.constants.NAMESPACES["annotea"] + '">'
						+ anno.created.toString() + '</created>';
				anno.modified = new Date();
				rdfxml += '<modified xmlns="' + lore.constants.NAMESPACES["annotea"] + '">'
						+ anno.modified.toString() + '</modified>';
			}
			if (annoOrig.context) {
				rdfxml += '<context xmlns="' + lore.constants.NAMESPACES["annotea"] + '">' +
				//TODO: need to have url passed in as opposed to checking the window object directly
				lore.global.util.getContentWindow(window).location.href.replace(/&/g, '&amp;') + "#" + anno.context +
				'</context>';
			}
			
			if ( annoOrig.meta.context) {
				// TODO: merge with the current context, as a multi-part xpointer or perhaps have another
				// line in the context with the meta-context, depending on whether that breaks dannotate
				rdfxml += '<meta-context xmlns="' + lore.constants.NAMESPACES["vanno"] + '">';
				for ( var i =0; i < anno.meta.context.length; i++ ) {
					rdfxml += lore.global.util.getContentWindow(window).location.href.replace(/&/g, '&amp;') + "#" + anno.meta.context[i] + "\n";
				}
				rdfxml += '</meta-context>';
			}
			if (annoOrig.type ==
			lore.constants.NAMESPACES["vanno"] +
			"VariationAnnotation") {
				if (annoOrig.originalcontext) {
					rdfxml += '<original-context xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'">' +
					anno.originalcontext +
					'</original-context>';
				}
				if (annoOrig.variantcontext) {
					rdfxml += '<variant-context xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'">' +
					anno.variantcontext +
					'</variant-context>';
				}
				if (annoOrig.variationagent) {
					rdfxml += '<variation-agent xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'">' +
					anno.variationagent +
					'</variation-agent>';
				}
				if (annoOrig.variationplace) {
					rdfxml += '<variation-place xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'">' +
					anno.variationplace +
					'</variation-place>';
				}
				if (annoOrig.variationdate) {
					rdfxml += '<variation-date xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'">' +
					anno.variationdate +
					'</variation-date>';
				}
				if (annoOrig.original) {
					rdfxml += '<original xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'" rdf:resource="' +
					anno.original +
					'"/>';
				}
				if (annoOrig.variant) {
					rdfxml += '<variant xmlns="' +
					lore.constants.NAMESPACES["vanno"] +
					'" rdf:resource="' +
					anno.variant +
					'"/>';
				}
			}
			if (annoOrig.body) {
				anno.body = lore.global.util.sanitizeHTML(anno.body, window);
				rdfxml += '<body xmlns="' + lore.constants.NAMESPACES["annotea"] +
				'">' + this.getBodyRDF(anno.title, anno.body) + '</body>';
			}
			if (annoOrig.tags) {
				var tagsarray = anno.tags.split(',');
				lore.debug.anno("tags are", tagsarray);
				for (var ti = 0; ti < tagsarray.length; ti++) {
					var thetag = lore.global.util.escapeHTML(tagsarray[ti]);
					rdfxml += '<tag xmlns="' + lore.constants.NAMESPACES["vanno"] + '"';
					if (thetag.indexOf("http://") == 0) {
						rdfxml += ' resource="' + thetag + '"/>';
					}
					else {
						rdfxml += '>' + thetag + '</tag>';
					}
				}
			}
			
			if ( annoOrig.scholarly) {
				if ( annoOrig.scholarly.references) {
					rdfxml += '<references xmlns="' + lore.constants.NAMESPACES["vanno"] + '">';
					rdfxml += anno.scholarly.references;
					rdfxml += '</references>'; 
				}
				
				if ( annoOrig.scholarly.importance) {
					rdfxml += '<importance xmlns="' + lore.constants.NAMESPACES["vanno"] + '">';
					rdfxml += anno.scholarly.importance;
					rdfxml += '</importance>';
				}
				
				if (annoOrig.scholarly.altbody) {
					anno.scholarly.altbody = lore.global.util.sanitizeHTML(anno.scholarly.altbody, window);
					rdfxml += '<altbody xmlns="' + lore.constants.NAMESPACES["vanno"] + 
					'">' + this.getBodyRDF(anno.title, anno.scholarly.altbody) + '</altbody>';
				}
			}

			//TODO: save user meta data information 
			/*if (annoOrig.meta.fields.length > 0) {
				rdfxml += '<meta xmlns="' + lore.constants.NAMESPACES["vanno"] + '">';
				
				//var cw = lore.global.util.getContentWindow(window);
				//var url = '&lt;' + ('http://www.austlit.edu.au' + cw.location.pathname +	cw.location.search + '#me').replace(/&/g, '&amp;') + '&gt;';
						
				Ext.each(anno.meta.fields, function (item, index, all) {
					var prop = "&lt;" + this.prop + "&gt;";
					var type = "&lt;" + this.type + "&gt;";
					rdfxml += type + " " + prop + " " +  this.value + " .\n";
				});
				rdfxml += '</meta>';
			}*/

			rdfxml += '</rdf:Description>';
		}
		rdfxml += '</rdf:RDF>';
		
		return rdfxml;
	},
	
	/**
	 * Generate RDF for annotation body 
	 * @param {String} title Annotation Title
	 * @param {String} body Annotation Body
	 */
	getBodyRDF : function (title, body) {
		return '<rdf:Description>' +
				'<ContentType xmlns="' +
				lore.constants.NAMESPACES["http"] +
				'">text/html</ContentType>' +
				'<Body xmlns="' +
				lore.constants.NAMESPACES["http"] +
				'" rdf:parseType="Literal">' +
				'<html xmlns="http://www.w3.org/TR/REC-html40"><head><title>' +
				(title ? title : 'Annotation') +
				'</title></head>' +
				'<body>' +
				body +
				'</body></html>' +
				'</Body></rdf:Description>';
	}
	
}
