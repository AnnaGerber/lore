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
	/*
		 * General functions
		 */
		
		
		
/**
 * Disable or enable the annotations view
 * @param {Object} opts Object containing disable/enable options. Valid fields includes opts.disable_annotations
 */	
lore.anno.ui.disableUIFeatures = function(opts) {
    lore.debug.ui("LORE Annotations: disable ui features?", opts);
    lore.anno.ui.disabled = opts;

	// don't set visibility on start up 
	if (!lore.anno.ui.disableUIFeatures.initialCall) {
		lore.anno.ui.disableUIFeatures.initialCall = 1;
	}
	else {
	
		if (opts.disable_annotations) {
			lore.anno.ui.topView.setAnnotationsVisibility(false);
		}
		else {
			lore.anno.ui.topView.setAnnotationsVisibility(true);
		}
	}
}


/** Helper function to create a view displayed in a closeable tab */
lore.anno.ui.openView = function(/*String*/panelid,/*String*/ paneltitle,/*function*/ activationhandler){
	var tab = Ext.getCmp(panelid);
	if (!tab) {
		tab = lore.anno.ui.views.add({
			'title': paneltitle,
			'id': panelid,
			'autoScroll': true,
			'closable': true
		});
		tab.on("activate", activationhandler);
	}
	tab.show();
}
		
		/**
		 * Output a message to notification window
		 * @param {String} message Notification message
		 * @param {Object} iconCls CSS Class for notification icon
		 */
		lore.anno.ui.loreMsg = function(message, iconCls){
			if (!lore.anno.ui.loreMsgStack) {
				lore.anno.ui.loreMsgStack = [];
			}
			iconCls = iconCls || '';
			message = '<div class="status-bubble-icon ' + iconCls + '"></div><div class="status-bubble-msg">' + message + "</div>";
			
			lore.anno.ui.loreMsgStack.push(message);
			Ext.Msg.show({
				msg: '',
				modal: false,
				closable: true,
				width: window.innerWidth
			});
			Ext.Msg.updateText(lore.anno.ui.loreMsgStack.join('<br/>'));
			var w = Ext.Msg.getDialog();
			w.setPosition(0, window.innerHeight - w.getBox().height);
			
			window.setTimeout(function(){
				try {
					if (lore.anno.ui.loreMsgStack.length == 1) {
						lore.anno.ui.loreMsgStack.pop();
						Ext.Msg.hide();
					}
					else {
						lore.anno.ui.loreMsgStack.splice(0, 1);
						Ext.Msg.updateText(lore.anno.ui.loreMsgStack.join('<br/>'));
						var w = Ext.Msg.getDialog();
						w.setPosition(0, window.innerHeight - w.getBox().height);
					}
				} 
				catch (e) {
					lore.debug.ui(e, e);
				}
			}, 3000);
			
		}
		
		/**
		 * Output a notification to notification window
		 * @param {String} message Notification message
		 */
		lore.anno.ui.loreInfo = function(message){
			lore.anno.ui.loreMsg(message, 'info-icon');
			lore.global.ui.loreInfo(message);
		}
		
		/**
		 * Output a error message to notification window
		 * @param {String} message Erro message
		 */
		lore.anno.ui.loreError = function(message){
			lore.anno.ui.loreMsg(message, 'error-icon');
			lore.global.ui.loreError(message);
			
		}
		
		/**
		 * Output a warning to notification window
		 * @param {String} message Warning message
		 */
		lore.anno.ui.loreWarning = function(message){
			lore.anno.ui.loreMsg(message, 'warning-icon');
			lore.global.ui.loreWarning(message);
		}
		
		
			/**
		 * Generate annotation caption for the given annotation using the formatting
		 * string
		 * @param {Object} anno The annotation to retrieve the information from
		 * @param {String} formatStr Formatting string. The following
		 */
		lore.anno.ui.genAnnotationCaption = function(anno, formatStr){
			var buf = '';
			
			
			for (var i = 0; i < formatStr.length; i++) {
				switch (formatStr[i]) {
					case 't':
						buf += lore.global.util.splitTerm(anno.type).term;
						break;
					case 'c':
						buf += anno.creator
						break;
					case 'd':
						buf += lore.global.util.shortDate(anno.created, Date);
						break;
					case 'D':
						buf += lore.global.util.longDate(anno.created, Date);
						break;
					case 'r':
						var replies = "";
						if (anno.replies) {
							var n = anno.replies.count;
							if (n > 0) {
								replies = " (" + n + (n == 1 ? " reply" : " replies") + ")";
							}
						}
						buf += replies;
						break;
					case '\\':
						if (i < formatStr.length - 1) {
							i++;
							buf += formatStr[i];
						}
						break;
					default:
						buf += formatStr[i];
				}
			}
			
			return buf;
		}
		
		/**
		 * Generate HTML formatted tag list
		 * @param {Object} annodata The annotation to retrieve the tag information from
		 * @return {String} HTML formatted tag list
		 */
		lore.anno.ui.genTagList = function(annodata){
			var bodyText = "";
			if (annodata.tags) {
				bodyText += '<span style="font-size:smaller;color:#51666b">Tags: ';
				var tagarray = annodata.tags.split(',');
				for (var ti = 0; ti < tagarray.length; ti++) {
					var thetag = tagarray[ti];
					if (thetag.indexOf('http://') == 0) {
						try {
							var tagname = thetag;
							Ext.getCmp('tagselector').store.findBy(function(rec){
								if (rec.data.id == thetag) {
									tagname = rec.data.name;
								}
							});
							bodyText += '<a target="_blank" style="color:orange" href="' + thetag + '">' + tagname + '</a>, ';
						} 
						catch (e) {
							lore.debug.anno("unable to find tag name for " + thetag, e);
						}
					}
					else {
						bodyText += thetag + ", ";
					}
				}
				bodyText += "</span>";
			}
			return bodyText;
		}
		
		/**
		 * Retrieve the annotation title
		 * @param {Object} anno The annotation
		 * @return {String} The annotation titile. The default value is 'Untitled'
		 */
		lore.anno.ui.getAnnoTitle = function(anno){
			var title = anno.title;
			if (!title || title == '') {
				title = "Untitled";
			}
			return title;
		}
		
		lore.anno.ui.getAnnoTypeIcon = function(anno){
			var aType = lore.global.util.splitTerm(anno.type).term;
			var icons = {
				'Comment': 'anno-icon',
				'Explanation': 'anno-icon-explanation',
				'VariationAnnotation': 'anno-icon-variation',
				'Question': 'anno-icon-question'
			};
			
			return icons[aType] || 'anno-icon';
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
		 * Show/hide a field on a form
		 * @param {String} fieldName The field name to set the visibility of
		 * @param {Boolean} hide (Optional)Specify whether to hide the field or not. Defaults to false
		 */
		lore.anno.ui.setVisibilityFormField = function(form, fieldName, hide){
			
			var thefield = form.findField(fieldName);
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
				lore.anno.ui.setVisibilityFormField(lore.anno.ui.form, fieldNameArr[i], true);
			}
		}
		
		/**
		 * Show list of form fields
		 * @param {Array} fieldNameArr List of fields to show
		 */
		lore.anno.ui.showFormFields = function(fieldNameArr){
			for (var i = 0; i < fieldNameArr.length; i++) {
				lore.anno.ui.setVisibilityFormField(lore.anno.ui.form,fieldNameArr[i], false);
			}
		}
		
		lore.anno.ui.isFormDirty = function(form ) {
			 var dirtyList = [];
			 var isDirty = false;
			 form.items.each( function (item, index, length) {
			 if ( item.isDirty()) {
			 	isDirty = true;
			 dirtyList.push(item.getName());
			 }
			 });
			 
			 lore.debug.anno("The dirty items are: " + dirtyList.join());
			 return isDirty;
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
		
/**
 * Launch field value in a new window
 * @param {Field} field Form field to launch in a new window
 */
lore.anno.ui.launchFieldWindow = function(field){
	lore.global.util.launchWindow(field.value, true, window);
}

lore.anno.ui.isHumanReadableTriple = function( triple) {
			var valid = ["isRecordFor", "birthName", "alternateName", "usesPseudoAgent", "birthOf", "deathOf", "gender", "biography",
			"influenceOnWork", "type"];
			
			//work record
			valid = valid.concat( ["title", "form", "producedOutput" ]);
			
			//manifestation
			valid = valid.concat( ['hasReprint']);
			
			if ( triple.source && triple.subject.type != 'bnode') {
			 	var rel = triple.property.toString();
				
				for (var i = 0; i < valid.length; i++) {
				
					if ( rel.lastIndexOf("#" + valid[i]) != -1 || rel.lastIndexOf("/" + valid[i]) != -1)
						return true;
				}
			} 
			return false;
		//	return true;
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
lore.anno.ui.setCurAnnoStyle = function(type, domObj){
	
	if (type == 0) {
		domObj.style.textDecoration = "underline";
	}
	else if (type == 1) { 
		domObj.style.borderStyle = 'solid';
	}
	return domObj;
}

		/**
 * Update the image scale information if necessary
 * @param {Object} img
 * @param {Object} doc
 */ 
lore.anno.ui.updateImageData = function (img, doc) {
	var _img = $(img);
	var scale = _img.data("scale");
					
	if ( !scale || scale.imgWidth != _img.width() ||
					scale.imgHeight != _img.height()) {
						// either no scale information stored, or is out of date
						scale = lore.global.util.getImageScaleFactor(_img.get(0), doc );
						_img.data("scale", scale);
					}
	return scale;
}

/**
 * Scale the image co-ordinates
 * @param {Element} img DOM element for the image i.e <img>
 * @param {Object} coords Object containing the co-ordinates and scale factor {x1,y1,x2,y2,sx,sy}
 * @param {Object} doc The target document 
 */
lore.anno.ui.scaleImageCoords = function (img, coords, doc) {
	var scale = lore.anno.ui.updateImageData(img, doc); 
	// scale coords ( getting their unscale state if they are already scaled)
	var sx = coords.sx || 1;
	var sy = coords.sy || 1;
	return {
		x1: coords.x1 * sx / scale.x,
		y1: coords.y1 * sy / scale.y,
		x2: coords.x2 * sx / scale.x,
		y2: coords.y2 * sy / scale.y,
		sx: scale.x,
		sy: scale.y
	};
}

/**
 * Calculate the image's absolute position on the page
 * @param {Object} img DOM element for image i.e <img>
 * @param {Object} doc The target document
 */
lore.anno.ui.calcImageOffsets = function(img, doc){
	var _img = $(img);
	var _parent = $('body', doc);
	
	// image page offset and parent scroll offset 
	var imgOfs = {
		left: Math.round(_img.offset().left),
		top: Math.round(_img.offset().top)
	};
	var parOfs = $.inArray(_parent.css('position'), ['absolute', 'relative']) + 1 ? {
		left: Math.round(_parent.offset().left) - _parent.scrollLeft(),
		top: Math.round(_parent.offset().top) - _parent.scrollTop()
	} : {
		left: 0,
		top: 0
	};
	
	return {
		left: (imgOfs.left - parOfs.left),
		top: (imgOfs.top - parOfs.top)
	};
}