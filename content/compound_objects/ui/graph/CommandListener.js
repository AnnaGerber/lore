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
 * Listens for commands such as delete, undo, redo and updates the graph lookup object that is used
 * to map resource URLs to figure IDs
 * @class lore.ore.ui.graph.CommandListener
 **/
lore.ore.ui.graph.CommandListener = Ext.extend(draw2d.CommandStackEventListener, {
    type : "lore.ore.ui.graph.CommandListener",
    /**
     * Respond to move, delete, undo and redo commands in the graphical editor
     * @param {} event
     */
    stackChanged : function(event) {
	    var details = event.getDetails();
	    var comm = event.getCommand();
	    var comm_fig = comm.figure;
	    lore.ore.ui.graph.modified = true;
        // reset dummy graph layout position to prevent new nodes being added too far from content
	    if (comm instanceof draw2d.CommandMove  && comm.oldX == lore.ore.ui.graph.dummylayoutprevx 
	        && comm.oldY == lore.ore.ui.graph.dummylayoutprevy) {   
	            lore.ore.ui.graph.nextXY(comm.newX, comm.newY);
	    }
        // don't allow figures to be moved outside bounds of canvas
	    if (comm instanceof draw2d.CommandMove && (comm.newX < 0 || comm.newY < 0)) {
	        comm.undo();
	    }
        // remove the url from lookup if node is deleted, add it back if it is undone
        // update address bar add icon to reflect whether current URL is in compound object
	    if (0!=(details&(draw2d.CommandStack.POST_EXECUTE))) {
            lore.debug.ore("post execute",comm);
	        if (comm instanceof draw2d.CommandDelete) {
	            delete lore.ore.ui.graph.lookup[comm_fig.url];
                if (lore.ore.ui.topView && lore.ore.ui.currentURL == comm_fig.url){
                       lore.ore.ui.topView.hideAddIcon(false);
                }
	        } else if (comm instanceof draw2d.CommandAdd) {
                if (lore.ore.ui.topView && lore.ore.ui.currentURL == comm_fig.url){
                       lore.ore.ui.topView.hideAddIcon(true);
                }
            }
	    }
	    else if ((0!=(details&(draw2d.CommandStack.POST_UNDO)) && comm instanceof draw2d.CommandDelete)
            || (0!=(details&(draw2d.CommandStack.POST_REDO)) && comm instanceof draw2d.CommandAdd)) {
            //  check that URI isn't in resource map (eg another node's resource may have been changed)
            if (lore.ore.ui.graph.lookup[comm_fig.url]){
                if (comm instanceof draw2d.CommandDelete) {
                    lore.ore.ui.loreWarning("Cannot undo deletion: resource is aleady in Compound Object");
                    comm.redo();
                } else {
                    lore.ore.ui.loreWarning("Cannot redo addition: resource is aleady in Compound Object");
                    comm.undo();
                }
            }
            lore.ore.ui.graph.lookup[comm_fig.url] = comm_fig.getId();
            if (lore.ore.ui.topView && lore.ore.ui.currentURL == comm_fig.url){
               lore.ore.ui.topView.hideAddIcon(true);
            }       
       } 
         
	    else if ((0!=(details&(draw2d.CommandStack.POST_REDO)) && comm instanceof draw2d.CommandDelete)
         || (0!=(details&(draw2d.CommandStack.POST_UNDO)) && comm instanceof draw2d.CommandAdd)) {
            lore.debug.ore("redo delete or undo add",comm);
            delete lore.ore.ui.graph.lookup[comm_fig.url];
            if (lore.ore.ui.topView && lore.ore.ui.currentURL == comm_fig.url){
                   lore.ore.ui.topView.hideAddIcon(false);
            }
	        
        }
    }
});
