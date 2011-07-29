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
 * @class lore.ore.repos.RestAdapter Access and store compound objects using a
 *  REST based respository
 * @extends lore.ore.repos.SesameAdapter
 */
lore.ore.repos.RestAdapter = Ext.extend(lore.ore.repos.SesameAdapter,{
	// Override the idPrefix property with a different URL
	constructor : function(baseURL) {
		lore.ore.repos.RestAdapter.superclass.constructor.call(this, baseURL);
        this.reposURL = baseURL + "/ore/";
	    this.idPrefix = this.reposURL;
	    this.unsavedSuffix = "#unsaved";
	},
    getCompoundObjects : function(matchuri, matchpred, matchval, isSearchQuery){
        var ra = this;
	    try {
	       var escapedURL = "";
	       var altURL = "";
	       if (matchuri){
	           escapedURL = encodeURIComponent(matchuri.replace(/}/g,'%257D').replace(/{/g,'%257B'));
	       }
	       var queryURL = "";
	       if (isSearchQuery){
		        queryURL = this.reposURL
		        	+ "?matchval=" + matchval;
		        if (escapedURL && escapedURL != "")
		        	queryURL += "&refersTo=" + escapedURL;
		        if (matchpred && matchpred != "")
		        	queryURL += "&matchpred=" + matchpred;
	       } else {
		       queryURL = this.reposURL
		            + "?refersTo=" + escapedURL;
	       }
	        
	        var xhr = new XMLHttpRequest();
	        lore.debug.ore("RestAdapter.getCompoundObjects", {queryURL:queryURL});
	        xhr.open('GET', queryURL);
	        xhr.onreadystatechange = function(aEvt) {
	            if (xhr.readyState == 4) {
	                if (xhr.responseText && xhr.status != 204 && xhr.status < 400) {
	                    var xmldoc = xhr.responseXML;
	                    var listname = (isSearchQuery? "search" : "browse");  
					    var result = {};
					    if (xmldoc) {
					        result = xmldoc.getElementsByTagNameNS(lore.constants.NAMESPACES["sparql"], "result");
					    }
                        lore.ore.coListManager.clear(listname);
                        
					    if (result.length > 0){
	                        // add the results to the model
					        var coList = [];
                            var processed = {};
					        for (var i = 0; i < result.length; i++) {
					            var theobj = ra.parseCOFromXML(result[i]);
					            var resultIndex = processed[theobj.uri];
                                var existing = theobj; 
                                if (resultIndex >= 0){
                                    existing = coList[resultIndex];
                                    if (existing && !existing.creator.match(theobj.creator)){
                                        existing.creator = existing.creator + " &amp; " + theobj.creator;
                                    }
                                } else {
                                   if (matchval) {theobj.searchval = matchval;}
                                   coList.push(theobj);
                                   processed[theobj.uri] = coList.length - 1; 
                                }    
					        }
					        lore.ore.coListManager.add(coList,listname);
					    } 
	                } else if (xhr.status == 404){
	                    lore.debug.ore("404 accessing compound object repository",xhr);
	                }
	            }
	        };
	        xhr.send(null);
	    } catch (e) {
	        lore.debug.ore("Unable to retrieve compound objects",e);
	        lore.ore.ui.vp.warning("Unable to retrieve compound objects");
	    }
	},
	loadCompoundObject : function(remid, callback, failcallback){
	     Ext.Ajax.request({
	            url: remid,
                headers: {
                    Accept: 'application/rdf+xml'
                },
	            method: "GET",
	            disableCaching: false,
	            success: callback,
	            failure: failcallback
	        }); 
	},
	saveCompoundObject : function (theco,callback){
        var remid = theco.uri;
        var therdf = theco.asRDFXML(false);
        var oThis = this;
		Ext.Msg.show({
	           msg: 'Saving Compound Object to repository...',
	           width:250,
	           defaultTextHeight: 0,
	           closable: false,
	           cls: 'co-load-msg'
	       });
	    try {
          lore.ore.am.runWithAuthorisation(function() {
				var xhr = new XMLHttpRequest();
				if (remid.indexOf(oThis.unsavedSuffix) > 1) { 
                    // New compound object, not in the repo yet
					lore.debug.ore("lorestore: saving new compound object", theco);
					xhr.open("POST", oThis.reposURL);

				} else { // updating an existing compound object
					lore.debug.ore("lorestore: saving existing compound object: " + remid, theco);
					xhr.open("PUT", remid);
				}
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						Ext.Msg.hide();
						if (xhr.status == 200) { // OK
							lore.debug.ore("lorestore: RDF saved", xhr);
							lore.ore.ui.vp.info("Compound object " + remid + " saved");
							callback(remid);
						} else if (xhr.status == 201) { // Created
							lore.debug.ore("lorestore: RDF saved", xhr);
							var location = xhr.getResponseHeader("Location");
							lore.debug.ore("New CO URI is: " + location);
							lore.ore.ui.vp.info("Compound object " + remid + " saved");
							lore.ore.controller.loadCompoundObject(xhr);
							callback(location);
						} else {
							lore.ore.ui.vp.error('Unable to save to repository: ' + xhr.statusText);
							lore.debug.ore("Unable to save compound object", {
										xhr : xhr,
										headers : xhr.getAllResponseHeaders()
							});
                            
                            var msg = '<b>' + xhr.statusText + '</b>'  
                                + '<br><br>If an error has occurred, please save your compound object to a file using the <i>Export to RDF/XML</i> menu option from the toolbar and contact the Aus-e-Lit team with details of the error for further assistance.'
                                + '<br><br><a style="text-decoration:underline;color:blue" href="#" onclick="lore.global.util.launchWindow(\'data:text/html,' + encodeURIComponent(xhr.responseText) + '\',false,window)\">View Details</a>';
                                
							Ext.Msg.show({
								title : 'Unable to save compound object',
								buttons : Ext.MessageBox.OK,
                                defaultTextHeight: 100,
								msg : msg
							});
                            
						}
					}
				};
				xhr.setRequestHeader("Content-Type", "application/rdf+xml");
				xhr.send(therdf);
			});
	    } catch (e) {
	        lore.debug.ore("lorestore: problem saving compound object", e);
	    }
	},
	loadNew : function(oldURI, newURI) {
		// should be an #unsaved URI
		lore.ore.cache.remove(oldURI);
		
		// Except, this function is doing mooooore
		controller.loadCompoundObjectFromURL(newURI);
        lore.ore.reposAdapter.loadCompoundObject(rdfURL, lore.ore.controller.loadCompoundObject, lore.ore.controller.afterLoadCompoundObjectFail);
	},
	deleteCompoundObject : function(remid, callback){
        // TODO: first check that it hasn't been changed on the server
	    lore.debug.ore("deleting from lorestore repository " + remid);
	    try {
          lore.ore.am.runWithAuthorisation(function() {
	        var xhr = new XMLHttpRequest();
	        xhr.open("DELETE", remid);  
	        xhr.onreadystatechange= function(){
	            if (xhr.readyState == 4) {
                    if (xhr.status == 204) { // OK
                        callback(remid);
                    } else {
                        lore.ore.ui.vp.error('Unable to delete compound object' + xhr.statusText);
                         
                        lore.debug.ore("Unable to delete compound object", {
                            xhr : xhr,
                            headers : xhr.getAllResponseHeaders()
                        });
                        var msg = '<b>' + xhr.statusText + '</b>'  
                                + '<br><br>If an error has occurred please contact the Aus-e-Lit team with details of the error for further assistance.'
                                + '<br><br><a style="text-decoration:underline;color:blue" href="#" onclick="lore.global.util.launchWindow(\'data:text/html,' + encodeURIComponent(xhr.responseText) + '\',false,window)\">View Details</a>';  
                        Ext.Msg.show({
                            title : 'Unable to delete compound object',
                            buttons : Ext.MessageBox.OK,
                            msg : msg
                        });
                    }
	            }
	        };
	        xhr.send(null);
          });
	    } catch (e){
	        Ext.MessageBox.hide();
	        lore.debug.ore("RestAdapter: error deleting compound object",e);
	    }        
	},
    /**
     * Performs a SPARQL query to retrieve data for Explore view
     * @param {} uri
     * @param {} title
     * @param {} isCompoundObject
     * @param {} callback
     * @return {}
     */
    getExploreData : function(uri,title,isCompoundObject, callback){
        var eid = uri.replace(/&amp;/g,'&').replace(/&amp;/g,'&');
        var eid2 = escape(eid);
        try {
		    var queryURL = this.reposURL
		            + "?exploreFrom=" 
		            + eid2;
		    
            if (this.exploreStylesheet){
               
                var xsltproc = new XSLTProcessor();
                var xhr = new XMLHttpRequest();                
                xhr.overrideMimeType('text/xml');
		        
            
	           xsltproc.importStylesheet(this.exploreStylesheet);
	           xsltproc.setParameter(null,'subj',eid);
	           if (title){
	               xsltproc.setParameter(null,'title',title);
	           }
               if (isCompoundObject){
                   xsltproc.setParameter(null,'isCompoundObject','y');
               }
	           // get the sparql xml
            
	           xhr.open("GET",queryURL);
               xhr.onreadystatechange= function(){
                    if (xhr.readyState == 4) {
                        var rdfDoc = xhr.responseXML;
                        var serializer = new XMLSerializer();
                        var thefrag = xsltproc.transformToFragment(rdfDoc, document);
                        var jsonobj = Ext.decode(serializer.serializeToString(thefrag));
                        callback(jsonobj);
                    }
               }
	           xhr.send(null);
            } else {
                lore.debug.ore("Explore view stylesheet not ready",this);
                lore.ore.ui.vp.info(" ");
            }
	    } catch (ex){
	        lore.debug.ore("RestAdapter.getExploreData",ex);
	    } 
    },
    
    generateID : function() {
    	return this.reposURL + this.unsavedSuffix;
    }
});


 