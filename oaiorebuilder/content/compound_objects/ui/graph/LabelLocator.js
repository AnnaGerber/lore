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
 * Centers labels on connections
 * @class lore.ore.ui.graph.LabelLocator
 */
lore.ore.ui.graph.LabelLocator=function(/*:draw2d.Connection*/ connection)
{
  draw2d.ConnectionLocator.call(this,connection);
}
Ext.extend(lore.ore.ui.graph.LabelLocator, draw2d.ConnectionLocator, {
    type : "lore.ore.ui.graph.LabelLocator",
    relocate : function (label){
           var conn = this.getConnection();
		   var p = new draw2d.Point();
		   var points = conn.getPoints();
		   var index = Math.floor((points.getSize() -2) / 2);
		   var p1 = points.get(index);
		   var p2 = points.get(index + 1);
		
		   p.x = (p2.x - p1.x) / 2 + p1.x +5;
		   p.y = (p2.y - p1.y) / 2 + p1.y +5;
		   var offsetx = label.getWidth();
           if (offsetx != 0){
            offsetx = offsetx / 2;
           }
           var offsety = label.getHeight();
           if (offsety != 0){
            offsety = offsety/2;
           }
		   label.setPosition(p.x - offsetx,p.y - offsety);

    }
});