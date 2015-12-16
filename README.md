# MagicBoard
Drawing Shapes and create images. Use it for Enterprise SDLC Diagramming need

## Synopsis

MagicBoard is a Javascript framework that allows editing and linking variety of shapes on a sheet that resides on MagicBoard SheetBook. 
The MagicBoard SheetBook can contain many sheets.

You could do any of the following (plus more, please look at detailed documentation)
- Programmatically Add Shape to a Sheet
- Place, Move or Resize Shape, connect two shapes by a connector line (with variety of arrows)
- Get area of the shapes
- Change property of the shape
- Download image of the sheet(s) in png or svg format


## Code Example

MagicBoard.html (http://www.binarycodon.com/MagicBoard.html) contains a good example of Diagram editor.
A sample code is listed below

    // Assign any element in your HTML to be anchor to MagicBoard SheetBook.
    var paper = document.getElementById("paper");
    var paperDimension = paper.getBoundingClientRect();
    // Create MagicBoard SheetBook
    MagicBoard.sheetBook = new SheetBook(paper,paperDimension.width,paperDimension.height);
       
    //Create a new Sheet                
    var sheet = new Sheet({"name":"UML"});
    MagicBoard.sheetBook.addSheet(sheet); // add the sheet to sheetbook, you can add multiple sheets to a sheetbook
    MagicBoard.sheetBook.setCurrentSheet(sheet); // (Optional) Set this sheet to be active current sheet. 

    // Create a Shape -- See sample JSON for a shape
    var shape = new Shape(sampleShapeJson);
    shape.draw(); // Draw the shape on the sheet
    shape.addHover(); // add Hover property for editing
    shape.setPosition({"x":10,"y":400}); // (optional) set position of the shape
    
    //---------------------------------- This JSON below has to be defined before Shape is instantiated ---------------
    // sample Shape JSON, Shape consists of many components
    
    //components of a database symbol (note the dimension contains x,y coordinate in percentage, please use MagicBoard's utility page to convert real coordinate to %)
      var DBComponent1 = {"type":"path","origDim":{},"dimension":{"d":[{"op":"M","x":0,"y":83.33333333333333},{"op":"L","x":0,"y":16.666666666666668},{"op":"C","x1":0,"y1":6.666666666666667,"x2":21.666666666666668,"y2":0,"x":50,"y":0},{"op":"C","x1":76.66666666666667,"y1":0,"x2":100,"y2":6.666666666666667,"x":100,"y":16.666666666666668},{"op":"L","x":100,"y":83.33333333333333},{"op":"C","x1":100,"y1":91.66666666666667,"x2":76.66666666666667,"y2":100,"x":50,"y":100},{"op":"C","x1":21.666666666666668,"y1":100,"x2":0,"y2":91.66666666666667,"x":0,"y":83.33333333333333},{"op":"Z"}]},"param":{"fill":"rgb(27,141,17)","stroke":"#FFFFFF","stroke-width":"2","stroke-miterlimit":"10","pointer-events":"all"},"lines":[{"op":"M","x":0,"y":50},{"op":"L","x":0,"y":10},{"op":"C","x1":0,"y1":4,"x2":13,"y2":0,"x":30,"y":0},{"op":"C","x1":46,"y1":0,"x2":60,"y2":4,"x":60,"y":10},{"op":"L","x":60,"y":50},{"op":"C","x1":60,"y1":55,"x2":46,"y2":60,"x":30,"y":60},{"op":"C","x1":13,"y1":60,"x2":0,"y2":55,"x":0,"y":50},{"op":"Z"}]}
      var DBComponent2 = {"type":"path","origDim":{},"dimension":{"d":[{"op":"M","x":0,"y":16.666666666666668},{"op":"C","x1":0,"y1":25,"x2":21.666666666666668,"y2":33.333333333333336,"x":50,"y":33.333333333333336},{"op":"C","x1":76.66666666666667,"y1":33.333333333333336,"x2":100,"y2":25,"x":100,"y":16.666666666666668}]},"param":{"fill":"none","stroke":"#FFFFFF","stroke-width":"2","stroke-miterlimit":"10"},"lines":[{"op":"M","x":0,"y":10},{"op":"C","x1":0,"y1":15,"x2":13,"y2":20,"x":30,"y":20},{"op":"C","x1":46,"y1":20,"x2":60,"y2":15,"x":60,"y":10}]};

   sampleShapeJson = {"frame":{"width":60,"height":60,"unit":"px"},"param":{"alignmentRails":true},"componentParms":[DBComponent1,DBComponent2],properties:["background-color"]},

## Motivation

Rajeev and Venkat were working image handling for a flooring application and needed a good framework to handle variety of shapes. In addition,
Most SDLC diagrams becomes stale once the underlying components change. Rajeev and Venkat decided to create framework for managing shapes
that are always current during SDLC Lifecycle as well as for various image handling need. This project is far from complete. More comprehensive
features are on its way.

## Installation

Just download the entire Javascript/css and html package, change the sample MagicBoard.html page to point to right CDN for JQuery and Bootstrap.
And off you go..

## API Reference

Refer to http://www.binarycodon.com/MagicBoard/API/index.html for comprehensive API Documentation


## Contributors

This project is created by BinaryCodon, Inc. The framework coding is completed by Rajeev Shrivastava and Venkat Pillay

## License

Project is available under Affero GNU GPL License. Separate Commercial licensing is also available for commercial use. 
=======

>>>>>>> 
Please contact support@bianrycodon.com for contribution and Contributor's license.
