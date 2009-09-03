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
 
 /*
  * General utility functions for I/O, manipulating the DOM, selections etc
  */
 
 /**
 * Display all keys, values for an object
 * @param {} obj to dump
 */
lore.util.dumpValues = function(obj){
	var res="";
	for(var k in obj){
		res += k + ": " + obj[k] + ";\n";
	}
	alert(res);
}

/**
 * Removes DOM node, but preserves its children by attaching them to the node's 
 * parent instead.
 * 
 * Taken from code snippet on http://stackoverflow.com/questions/170004/how-to-remove-only-the-parent-element-and-not-its-child-elements-in-javascript .
 * 
 * @param DOMNode nodeToRemove
 */
lore.util.removeNodePreserveChildren = function(nodeToRemove) {
  var fragment = document.createDocumentFragment();
  while(nodeToRemove.firstChild) {
    fragment.appendChild(nodeToRemove.firstChild);
  }
  nodeToRemove.parentNode.insertBefore(fragment, nodeToRemove);
  nodeToRemove.parentNode.removeChild(nodeToRemove);
}

/**
 * Returns value of first child of first node, or default value if provided.
 * Unchanged from dannotate.js
 */
lore.util.safeGetFirstChildValue = function(node, defaultValue)
{
  return ((node.length > 0) && (node[0] != null) && node[0].firstChild) ?
           node[0].firstChild.nodeValue : defaultValue ? defaultValue : '';
}

/**
 * Scroll to an element within a window
 * @param {} theElement
 * @param {} theWindow
 */
lore.util.scrollToElement = function(theElement, theWindow){

  var selectedPosX = 0;
  var selectedPosY = 0;
              
  while(theElement){
    selectedPosX += theElement.offsetLeft;
    selectedPosY += theElement.offsetTop;
    theElement = theElement.offsetParent;
  }
                                  
 theWindow.scrollTo(selectedPosX,selectedPosY);
}

/**
 * Launch a small window containing a URL
 * @param {} url The URL to launch
 * @param {} locbar Boolean: whether to show location bar
 */
lore.util.launchWindow = function(url, locbar) {
	var winOpts = 'height=650,width=800,top=200,left=250,resizable,scrollbars=yes';
	if (locbar) {
		winOpts += ',location=1';
	}
	var newwindow=window.open(url,'name',winOpts);
	newwindow.focus();
} 

/**
 * Launch a URL in a new tab in the main browser (or focus existing tab if already open in browser)
 * Code from MDC code snippets page https://developer.mozilla.org/en/Code_snippets/Tabbed_browser
 * @param {Object} url
 */
lore.util.launchTab = function(url) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
  var browserEnumerator = wm.getEnumerator("navigator:browser");
  var found = false;
  while (!found && browserEnumerator.hasMoreElements()) {
    var browserWin = browserEnumerator.getNext();
    var tabbrowser = browserWin.getBrowser();
    // Check each tab of this browser instance
    var numTabs = tabbrowser.browsers.length;
    for(var index=0; index<numTabs; index++) {
      var currentBrowser = tabbrowser.getBrowserAtIndex(index);
      if (url == currentBrowser.currentURI.spec) {
        // The URL is already opened. Select this tab.
        tabbrowser.selectedTab = tabbrowser.mTabs[index];
        // Focus *this* browser-window
        browserWin.focus();
        found = true;
        break;
      }
    }
  }
  // Our URL isn't open. Open it now.
  if (!found) {
    var recentWindow = wm.getMostRecentWindow("navigator:browser");
    if (recentWindow) {
      // Use an existing browser window
      recentWindow.delayedOpenTab(url, null, null, null, null);
    }
    else {
      // No browser windows are open, so open a new one.
      window.open(url);
    }
  }
}

lore.util.longDate = function ( adate ) {
	return Date.parseDate(adate, 'c').format("D, d M Y H:i:s \\G\\M\\T O");
}

lore.util.shortDate = function (adate ) {
	return Date.parseDate(adate, 'c').format("d M Y H:i:s");
}
/**
 * Returns a boolean value for determing if the platform is linux
 */
lore.util.isLinux = function() {
	return (navigator.platform.toLowerCase().indexOf('linux') > -1);
}

/**
 * Returns a boolean value for determing if the platform is mac
 */

lore.util.isMac = function() { 
	return (navigator.platform.toLowerCase().indexOf('mac') > -1);
}

/**
 * Returns a boolean value for determing if the platform is windows
 */

lore.util.isWindows = function () {
	return (navigator.platform.toLowerCase().indexOf('win32') > -1);
}	

/**
 * Return the file separator used by the OS
 */
lore.util.fSeparator = function () {
	if ( lore.util.isWindows() ) {
		return "\\";
	} else if ( lore.util.isMac() || lore.util.isLinux() ) {
		return "/";
	} else {
		// default to forward slash
		lore.debug.ui("fSeparator: Could not determine platform, defaulting to '/'", navigator.platform);
		return "/";
	}
}
	
/**
 * Write file content to fileName in the extensions content folder
 * @param {} content
 * @param {} fileName
 * @return {}
 */
lore.util.writeFile = function(content, fileName){
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
			var fileBase = lore.ui.extension.path + "\\content\\";
			var filePath =  fileBase + fileName;
			var file = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(filePath);
			if(!file.exists()) 
			{
				file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
			}
			var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
				.createInstance(Components.interfaces.nsIFileOutputStream);
			stream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
			stream.write(content, content.length);
			stream.close();
			return filePath;
		} catch (e) {
			lore.debug.ui("Unable to write to file: " + fileName, e);
			throw new Error("Unable to write to file" + e.toString());
		}
}

/**
 * Remove any artifacts from the XPath
 * @param {} xp
 */
lore.util.normalizeXPointer = function(xp) {
	var idx = xp.indexOf('#');
	return xp.substring(idx + 1);
}

/**
 * Read a file that exists in the LORE extension
 * Path supplied is relative to <profile>/lore/
 * @param {} path
 */
lore.util.readChromeFile = function(path) {
	  try {
        var url = "chrome://lore/" + path;
	
	    var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/javascript');
  	
	    xhr.open("GET", url, false);
        xhr.send(null);
		return xhr.responseText;
    } catch (e) {
        lore.debug.ui("Unable to read resource file: " + e.toString());
    }
}
/** 
 * Inject contents of local script into a document
 * @param {} chromefile Path to chrome file
 */
lore.util.injectScript = function (chromefile,doc) {
    var buffer = lore.util.readChromeFile(chromefile);
    var script = doc.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = buffer;
    doc.getElementsByTagName("head")[0].appendChild(script);   
}
/**
 * Generate random colour and return as hex string
 * If one or more arguments aren't supplied min fields wil default to 0
 * and max fields will default to 255
 * @param {Object} mr min red
 * @param {Object} mg min green
 * @param {Object} mb min blue
 * @param {Object} mxr max red
 * @param {Object} mxg max green
 * @param {Object} mxb max blue
 */
lore.util.generateColour = function(mr,mg,mb,mxr, mxg, mxb) {
	var min = new Array( (mr ? mr: 0), (mg ? mg: 0), (mb ? mb: 0) );
	var max = new Array( (mxr ? mxr: 255), (mxg ? mxg: 255), (mxb ? mxb: 255) );
	
	var rgb = new Array(3);
	for (var i = 0; i < rgb.length; i++) {
		rgb[i] = Math.round(Math.random() * (max[i] - min[i])) + min[i];
	}
	var colour = rgb[0] + ( rgb[1] << 8) + (rgb[2] << 16);
	return "#" + colour.toString(16);
}
/**
 * Highlight part of a document
 * @param {} xpointer Context to highlight (as xpointer)
 * @param {} targetDocument The document in which to highlight
 * @param {} scrollToHighlight Boolean indicating whether to scroll
 */
lore.util.highlightXPointer = function(xpointer, targetDocument, scrollToHighlight, colour) {
 	try {
		var sel = lore.m_xps.parseXPointerToRange(xpointer, targetDocument);
		
		var highlightNode = targetDocument.createElementNS(lore.constants.XHTML_NS, "span");
		// lore.m_xps.markElement(highlightNode);
		// lore.m_xps.markElementHide(highlightNode);
		if (colour) {
			highlightNode.style.backgroundColor = colour;
		}
		else {
			highlightNode.style.backgroundColor = "yellow";
		}
		sel.surroundContents(highlightNode);
		if (scrollToHighlight) {
			lore.util.scrollToElement(highlightNode, targetDocument.defaultView);
		}
		
		return highlightNode;
	} catch (e) {
		lore.debug.ui(e,e);
		return null;
	}
}
/**
 * Return the window object of the content window
 */
lore.util.getContentWindow = function() {
	return window.top.getBrowser().selectedBrowser.contentWindow;
}
/**
 * Get the Range defined by an XPath/Xpointer (restricted to subset of
 * expressions understood by Anozilla).
 * modified from dannotate.js
 */
lore.util.getSelectionForXPath = function(xp)
{
	var mainwindow = lore.util.getContentWindow();
    return lore.m_xps.xptrResolver.resolveXPointerToRange(xp, mainwindow.document);
}

lore.util.getNodeForXPath = function(xp) {
	var mainwindow = lore.util.getContentWindow();
	return lore.m_xps.parseXPointerToNode(xp, mainwindow);
}
/**
 * This fn depends on a hacked version of nsXpointerService being loaded by the browser
 * before this script is loaded from tags in the page being annotated.
 * modified from dannotate.js
 * @return XPath/XPointer statement for selected text, or '' if no selection.
 */

lore.util.getXPathForSelection = function()
{
  var mainwindow = lore.util.getContentWindow();
  var xp = '';
  try {
    var seln = mainwindow.getSelection();
	
    if (seln && seln!='') {
      var select = seln.getRangeAt(0);
      xp = lore.m_xps.xptrCreator.createXPointerFromSelection(seln, mainwindow.document);
    }
  }
  catch (ex) {
    throw new Error('XPath create failed\n' + ex.toString());
  }
  return xp;
}
/**
 * Return the text contents of a selection
 * @param {} currentCtxt
 * @return {} The selection contents
 */
lore.util.getSelectionText = function(currentCtxt){
	var selText = "";
	if (currentCtxt){
		var idx = currentCtxt.indexOf('#');
		var sel = lore.util.getSelectionForXPath(currentCtxt.substring(idx + 1));
		selText = sel.toString();
		if (selText){
			if (selText.length > 100){
				selText = selText.substring(0,100) + "...";
			}
		}
	}
	return selText;
}
/**
 * Split a URL identifier into namespace and term
 * 
 * @param {String} theurl The URL identifier to split
 * @return {Object} A JSON object with properties ns (the namespace) and term
 *         (the unqualified term)
 */
lore.util.splitTerm = function(theurl) {
	var result = {};
	// try splitting on #
	var termsplit = theurl.split("#");
	if (termsplit.length > 1) {
		result.ns = (termsplit[0] + "#");
		result.term = termsplit[1];
	} else {
		// split after last slash
		var lastSlash = theurl.lastIndexOf('/');
		result.ns = theurl.substring(0, lastSlash + 1);
		result.term = theurl.substring(lastSlash + 1);
	}
	return result;
}
lore.util.findChildRecursively=function(tree,attribute, value) {
    var cs = tree.childNodes;
	
    for(var i = 0, len = cs.length; i < len; i++) {
        if(cs[i].attributes[attribute] == value){
            return cs[i];
        }
        else {
            // Find it in this tree
            if(found = lore.util.findChildRecursively(cs[i], attribute, value)) {
                return found;
            }
        }
    }
    return null;
} 

lore.util.findRecordById = function(store, xid) {
	var ind = store.findBy(function(rec, id){
			if ( !xid ) {
				return !rec.json.id;
			} else 	if (rec.json.id == xid) {
				return true;
			}
		})
	if (ind != -1) {
		return store.getAt(ind);
	} else {
		return null;
	}
}

/**
 * Escape characters for HTML display
 * @return {}
 */
String.prototype.escapeHTML = function () {                                       
        return(                                                                 
            this.replace(/&/g,'&amp;').                                         
                replace(/>/g,'&gt;').                                           
                replace(/</g,'&lt;').                                           
                replace(/"/g,'&quot;').
				replace(/'/g,'&apos;')                                         
        );                                                                     
};
/**
 * Unescape HTML entities to characters
 * @return {}
 */
String.prototype.unescapeHTML = function (){
	return(                                                                 
            this.replace(/&amp;/g,'&').                                         
                replace(/&gt;/g,'>').                                           
                replace(/&lt;/g,'<').                                           
                replace(/&quot;/g,'"')                                         
        );    
};

/**
 * Creates a XUL iframe that has javascript and embedded objects disabled. 
 * @param iframe DOM element 
 * @param theurl URL to load
 * @param exOnLoad callback function
 
 */

lore.util.createXULIFrame = function(win) {
	var iframe = win.top.document.createElement("iframe"); // create a XUL iframe 
	
	iframe.setAttribute("type", "content");
	iframe.setAttribute("collapsed", true);
	iframe.style.visibility = "visible";
	iframe.setAttribute("src", "about:config");
	return iframe;
}

lore.util.setSecureXULIFrameContent = function(iframe, theurl) {

	// once the document had loaded the iframe
	// the docshell object will be created.
	// dochsell must be set before loading the page
	// so reload the page
	iframe.docShell.allowAuth = false;
	//iframe.docShell.allowImages = false;
	iframe.docShell.allowJavascript = false;
	iframe.docShell.allowMetaRedirects = false;
	iframe.docShell.allowPlugins = false;
	// subframes inherit the permissons of the parents
	//iframe.docShell.allowSubframes = false;
	
	iframe.setAttribute("src",theurl);
}
 
lore.util.createSecureIFrame = function(win, theurl, extraFunc) {
	var iframe = lore.util.createXULIFrame(win);
	
	iframe.addEventListener("load", function onLoadTrigger (event) {
							try {
								iframe.removeEventListener("load", onLoadTrigger, true);
								lore.util.setSecureXULIFrameContent(iframe, theurl);
								if ( extraFunc) {
									extraFunc();
								}
							} catch (e ) {
								lore.debug.ore("iframe(onload): " + e, e);
							}
		}, true);
		
	iframe.setAttribute("src", "about:blank"); // trigger onload
	return iframe;
}

/**
 * Basic HTML Sanitizer using Firefox's parseFragment
 * @param {Object} html
 */
lore.util.sanitizeHTML = function(html) {
    var serializer = new XMLSerializer();
	
    var fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]  
        .getService(Components.interfaces.nsIScriptableUnescapeHTML)  
        .parseFragment(html, false, null, document.body);
	if (fragment) {
		//TODO: remove dodgey characters inserted by nsiScriptableUnescapeHTML
		// it'd be interesting to see whether these characters are generated from the
		// nsiScriptableUnescapeHTML function or whether they appear due to the way
		// XMLserializers is accessing (i.e what properties used) the fragment's DOM 
		
		var buf = serializer.serializeToString(fragment);
		// remove garbage
		return buf.replace(/[\x80-\xff|\u0080-\uFFFF]*/g, '');
	} else {
		return "";
	}
	
	
}
/**
 * Add target="_blank" to all links in an html string
 * @param {Object} html
 */
lore.util.externalizeLinks = function(html){
	return html.replace(/<A /g,'<A target="_blank" '); 
}
lore.util.externalizeDomLinks = function(node){
	var links = node.getElementsByTagName('a');
	var attr;
	for (var i=0; i < links.length; i++){
		attr = node.ownerDocument.createAttribute('target');
		attr.nodeValue = "_blank";
		links[i].setAttributeNode(attr);
	}
}
/**
 * Quick and nasty function to tidy up html string so that it is valid XML
 * @return {}
 */
String.prototype.tidyHTML = function (){
	var res = this;
	if (res.match("<title>") && res.match("</title>")){
		var res1 = res.substring(0,(res.indexOf('<title>')));
		var res2 = res.substring((res.indexOf('</title>')+8), res.length);
		res = res1 + res2;
	}
	while (res.match('<br xmlns"'+ lore.constants.XHTML_NS + '">')){
		res = res.replace('<br xmlns="' + lore.constants.XHTML_NS + '">', '<br />');
	}
	while (res.match('<br>')){
		res = res.replace('<br>','<br />');
	}
	while (res.match('</br>')){
		res = res.replace('</br>',' ');
	}
	if (res.match('nbsp')){
		res = res.replace('&nbsp;',' ');
	}
	return res;
};
/**
 * normalize spaces in a string
 * @return {}
 */
String.prototype.normalize = function() {
	return this.replace(/^\s*|\s(?=\s)|\s*$/g, "");
}
