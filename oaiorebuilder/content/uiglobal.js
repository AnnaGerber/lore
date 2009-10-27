/*
 * Copyright (C) 2008 - 2009 School of Information Technology and Electrical
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

	var EXPORTED_SYMBOLS = ['ui'];	
	/**
     * @namespace
     * @name lore.global.ui 
	 */
	ui = {};
	
	Components.utils.import("resource://lore/debug.js");
	Components.utils.import("resource://lore/util.js");
	
	// TODO: global logging ( in addition to the logging for each view)
	// log to a log4j file 
	// log4j built-in xpc thing in firefox
	// handy if users experience problems they can send log file in an email
	
	/**
	 * Display an informational message to the user
	 * @param {String} message The message to display
	 */
	ui.loreInfo = function(message){
	};
	
	/**
	 * Display an warning message to the user
	 * @param {String} message The message to display
	 */
	ui.loreWarning = function(message){
	};
	/**
	 * Display an error message to the user
	 * @param {String} message The message to display
	 */
	ui.loreError = function(message){
	};
	/**
     * @param {} win
     * @param {} instId
	 */
	ui.reset = function (win, instId ) {
		ui.compoundObjectView.unregisterView();
		ui.annotationView.unregisterView();
        
		
		ui.load(win, instId, true);
		//win.annographiframe.location.reload(true);
		//win.graphiframe.location.reload(true);
	}
	/**
     * @param {} win
     * @param {} instId
     * @param {} reload
	 */
	ui.load = function (win, instId, reload) {
		var iframe1 = win.document.getElementById("annographiframe");
		
		iframe1.addEventListener("load", function onLoadTrigger(event){
			iframe1.removeEventListener("load", onLoadTrigger, true);
			iframe1.contentWindow.instanceId = instId; 
		}, true);
		if (reload) {
			win.annographiframe.location.reload(true);
		}
		else {
			iframe1.setAttribute("src", "chrome://lore/content/annotations/loreui_anno.html");
		}

		var iframe2 = win.document.getElementById("graphiframe");
		iframe2.addEventListener("load", function onLoadTrigger(event){
			iframe2.removeEventListener("load", onLoadTrigger, true);
			iframe2.contentWindow.instanceId = instId;
		}, true);
		if (reload) {
			win.graphiframe.location.reload(true);
		}
		else {
			iframe2.setAttribute("src", "chrome://lore/content/compound_objects/loreui_ore.html");
		}
	}
	
	/**
	 * Clear nodes all children from a tree node recursively
	 * @param {Ext.tree.TreeNode} treeRoot The tree node to clear
	 */
	ui.clearTree = function(treeRoot){
		while (treeRoot.firstChild) {
			treeRoot.removeChild(treeRoot.firstChild);
		}
	}
	
	ui.setCurrentURL = function (instance,url) {
		if ( !ui.currentURLs )
			ui.currentURLs = {};
		ui.currentURLs[instance] = url;
	}
	
	ui.getCurrentURL = function (instance) {
		return ui.currentURLs ? ui.currentURLs[instance]: null;
	}
	/**
     * @return {}
	 */
	ui.genInstanceID = function () {
		if ( !ui.genInstanceID.counter) {
			ui.genInstanceID.counter = 1;
		} else {
			ui.genInstanceID.counter++;
		}
		return ui.genInstanceID.counter;
	}
	
	/**
	 * UI View 
	 * The intention is that the views are never directly accesses via their iframes
	 * by other view/overlay code
     * @param {} args
	 */
		function Views(args){

			this.name = args.name;
			this.views = {};
			this.events = {};
		
			this.loaded = function(instId){
				return this.views[instId] != null;
			};
			
			this.onload = function(instId, callback) {
				
				if ( !this.events[instId] )
					this.events[instId] = [callback];
				else
					this.events[instId].push(callback);
			}			
			
			this.registerView = function(view, instId){
				this.views[instId] = util.createWrapper(view, this.name);
				var e = this.events[instId];
				if ( e && e.length > 0) {
					for ( var i =0; i < e.length; i++) {
						e[i](instId);
					}
				}
				this.events[instId] = null;
			};
			
			this.unregisterView = function(view){
				if (!view) {
					for (x in this.views) {
						if (this.views[x].uninit) {
							this.views[x].uninit();
						}
					}
					this.views = {};
				}
				else {
				//TODO:		
				}
			};
			
			this.get = function(instId){
				return this.views[instId];
			};
		}
		
		
		ui.compoundObjectView = new Views({
			name: 'coView'
		});
		ui.annotationView = new Views({
			name: 'annoView'
		});
		ui.topWindowView = new Views({
			name: 'topView'
		});
        
	
	
	
	