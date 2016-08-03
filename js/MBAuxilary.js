
/** @namespace Aux**/
var Aux= {"Shape":{},"Sheet":{},"SheetBook":{}};

Aux.supportedNodes = {"g":true,"rect":true,"circle":true,"ellipse":true,"path":true,"text":true,"symbol":true,"use":true,"polygon":true,"line":true,"polyline":true,"style":true,
    "linearGradient":true,"radialGradient":true};
Aux.createShapeJson1 = function(parent,shapeArray,components,level)
{
 
    if (level === 0)
    {
        Aux.temp = {minX:99999,maxX:0,minY:99999,maxY:0};
        Aux.temp.setX = function(_x){
            if (Aux.temp.symbolActive) return;
            if (_x == undefined) return;
            if (_x < Aux.temp.minX) Aux.temp.minX = _x ; if (_x > Aux.temp.maxX) Aux.temp.maxX = _x;
        }
        Aux.temp.setY = function(_y){
            if (Aux.temp.symbolActive) return;
            if (_y == undefined) return;
            if (_y < Aux.temp.minY) {Aux.temp.minY = _y ;console.log("min y set to "+_y);}; if (_y > Aux.temp.maxY) Aux.temp.maxY = _y;
        }
        var bBox = parent.getBBox();
        var width = bBox.width;
        var height = bBox.height;
        var viewBox = parent.getAttribute("viewBox");

        Aux.temp.minX = bBox.x; Aux.temp.maxX = bBox.x + bBox.width;

        Aux.temp.minY = bBox.y; Aux.temp.maxY= bBox.y + bBox.height;
    }
    
        for (var c = 0, cLen = parent.children.length; c < cLen ; c++)
        {
            var child = parent.children[c];
            var nodeName = child.nodeName;
            if (!Aux.supportedNodes[nodeName]) continue;
            if (nodeName === "g") {
                /* not sure why this was done but commenting it temporarily
                 // may have been used with symbols
                if (components.length > 0)
                {
                    var shapeJson = Aux.createShapeJson2(components);
                    shapeArray.push(shapeJson);
                }

                // handle any transform here (translate could be multi-level)
                components = [];
                
                Aux.temp.minX=99999;Aux.temp.maxX=0;Aux.temp.minY=99999;Aux.temp.maxY=0;
                 */
                Aux.createShapeJson1(child,shapeArray,components,(level+1));//getShapes(child,shapeArray);
            } else if (nodeName === "symbol")
            {
                var sc = {"components":[]};
                var id = child.getAttribute("id");
                Aux.temp.symbolId = id;
                if (!Aux.temp.symbol) Aux.temp.symbol = {};
                Aux.temp.symbol[id] = sc;
                var viewBox = child.getAttribute("viewBox");
                if (viewBox)
                   Aux.temp.symbol[id]["viewDim"] = Aux.parseViewBox(viewBox);
                
                Aux.temp.symbolActive = level;
                Aux.createShapeJson1(child,shapeArray,components,(level+1));//getShapes(child,shapeArray);
                delete Aux.temp["symbolActive"];
                delete Aux.temp["symbolId"];
            }
            else if (nodeName === "use")
            {
                
                var href = child.getAttributeNS("http://www.w3.org/1999/xlink","href");

                if (href.indexOf("#") > -1) {
                    var id = href.substring(1);
                    var symbol = Aux.temp.symbol[id];
                    if (!symbol) continue;
                    var viewDim = {x:0,y:0};
                    
                    var x = child.getAttribute("x"); if (!(x == null)) x = parseFloat(x); else x=0;
                    var y = child.getAttribute("y"); if (!(y == null)) y = parseFloat(y); else y=0;
                    if (symbol.viewDim) {x = x - symbol.viewDim.x;y = y - symbol.viewDim.y;viewDim = symbol.viewDim;}
                    
                    var transformParms = []
                    var transform = child.getAttribute("transform");
                    if (transform) transformParms =  Aux.parseTransform(transform,x,y,viewDim);
                    for (var i = 0,iLen = symbol.components.length;i < iLen;i++)
                    {
                        var comp = Aux.transpose(x,y,JSON.parse(JSON.stringify(symbol.components[i])),viewDim,transformParms);
                        //if (transform) comp.param.transform = transform;
                        components.push(comp);
                    }
                }
            }
            else if (nodeName === "style")
            {
                Aux.temp.style = {};
                var st = child.innerHTML;
                Aux.parseStyle(st);

            } else if (nodeName === "linearGradient")
            {
                components.push({type:"linearGradient",origDim:{},dimension:{},param:{"id":child.getAttribute("id")},lines:[],innerHTML:child.innerHTML});
            } else if (nodeName === "radialGradient")
            {
                components.push({type:"radialGradient",origDim:{},dimension:{},param:{"id":child.getAttribute("id")},lines:[],innerHTML:child.innerHTML});
            }
            else
            {
                var component = Aux.getComponent(child);
                //
                
                var dimension = component.origDim;
                if (component.type === "ellipse")
                {
                    var x = dimension.cx - dimension.rx; x = parseInt(x.toFixed(0));
                    var y = dimension.cy - dimension.ry; y = parseInt(y.toFixed(0));
                    var x1 = dimension.cx + dimension.rx;
                    var y1 = dimension.cy + dimension.ry;
                    Aux.temp.setX(x);Aux.temp.setX(x1);
                    Aux.temp.setY(y);Aux.temp.setY(y1);
                } else if (component.type === "circle")
                {
                    var x = dimension.cx - dimension.r;x = parseInt(x.toFixed(0));
                    var y = dimension.cy - dimension.r;y = parseInt(y.toFixed(0));
                    var x1 = dimension.cx + dimension.r;
                    var y1 = dimension.cy + dimension.r;
                    Aux.temp.setX(x);Aux.temp.setX(x1);
                    Aux.temp.setY(y);Aux.temp.setY(y1);
                } else if (component.type === "rect")
                {
                    var x = dimension.x;
                    var y = dimension.y;
                    var x1 = dimension.x + dimension.width;
                    var y1 = dimension.y + dimension.height;
                    Aux.temp.setX(x);Aux.temp.setX(x1);
                    Aux.temp.setY(y);Aux.temp.setY(y1);
                } else if (component.type === "text" )
                {
                    
                    component.innerHTML = child.textContent;
                    if (dimension.x == undefined) dimension.x = 0;
                    if (dimension.y == undefined) dimension.y = 0;
                    if (component.param["transform"]) {
                        transformParms =  Aux.parseTransform(component.param["transform"],dimension.x,dimension.y,{x:0,y:0});
                        Aux.transpose(0,0,component,{x:0,y:0},transformParms);
                        delete component.param["transform"];
                    }
                } else if (component.type.indexOf("Gradient") > -1)
                {
                    
                    component.innerHTML = child.innerHTML;

                }
                //
                if (Aux.temp.symbolActive == undefined)
                    components.push(component);
                else
                {
                        var id = Aux.temp.symbolId;
                        Aux.temp.symbol[id].components.push(component);
                }
                
            }
        }
    
    if (level === 0)
    {
        if (components.length > 0)
        {
            var shapeJson = Aux.createShapeJson2(components);
            return shapeJson;
        }
    }
}

Aux.parseViewBox = function(_vString)
{
    var vArray = _vString.split(" ");
    return {x:parseFloat(vArray[0]),y:parseFloat(vArray[1]),width:parseFloat(vArray[2]),height:parseFloat(vArray[3])}
}

Aux.getComponent = function(_child)
{
    var nodeName = _child.nodeName;
    var component = {type:null,origDim:{},dimension:{},param:{},lines:[]}; //{type:"rect",dimension:{width:100,height:100,x:0,y:0},param:{"fill":"none","stroke-width":1,"stroke":"black","border-radius":8}};
    component.type = nodeName;
    
    for (var att, i = 0, atts = _child.attributes, n = atts.length; i < n; i++){
        att = atts[i];
        switch (att.nodeName)
        {
            case "x": {var x = parseInt(att.nodeValue);component.origDim["x"] = x ;
                Aux.temp.setX(x);
                break;}
            case "y": {var y = parseInt(att.nodeValue);component.origDim["y"] = y ;
                Aux.temp.setY(y);
                break;}
            case "x1": {var x = parseInt(att.nodeValue);component.origDim["x1"] = x ;
                Aux.temp.setX(x);
                break;}
            case "y1": {var y = parseInt(att.nodeValue);component.origDim["y1"] = y ;
                Aux.temp.setY(y);
                break;}
            case "x2": {var x = parseInt(att.nodeValue);component.origDim["x2"] = x ;
                Aux.temp.setX(x);
                break;}
            case "y2": {var y = parseInt(att.nodeValue);component.origDim["y2"] = y ;
                Aux.temp.setY(y);
                break;}
            case "r": component.origDim["r"] = parseFloat(att.nodeValue);break;
            case "cx": component.origDim["cx"] = parseFloat(att.nodeValue);break;
            case "cy": component.origDim["cy"] = parseFloat(att.nodeValue);break;
            case "rx": component.origDim["rx"] = parseFloat(att.nodeValue);break;
            case "ry": component.origDim["ry"] = parseFloat(att.nodeValue);break;
            case "width": component.origDim["width"] = parseInt(att.nodeValue);break;
            case "height": component.origDim["height"] = parseInt(att.nodeValue);break;
            case "font-size":
                var size = att.nodeValue; if (size.indexOf("px") > -1) size = size.substring(0,size.length - 2);
                size = parseInt(size);
                component.param["font-size"] = size;
                break;
            case "d": {
                component.lines = Aux.parseD(att.nodeValue);
                break;
            }
            case "points": {
                var pointArray = Aux.parsePointString(att.nodeValue);
                component.lines = [];
                for (var p = 0, pLen = pointArray.length;p < pLen;p++)
                {
                    var pxy = pointArray[p].split(",");
                    if (pxy.length === 1) pxy.push(pointArray[++p]);
                    var line = {"op":"",x:0,y:0};
                    line.x = parseFloat(pxy[0]); if (isNaN(line.x)) continue;
                    line.y = parseFloat(pxy[1]); if (isNaN(line.y)) continue;
                    Aux.temp.setX(line.x);
                    Aux.temp.setY(line.y);
                    component.lines.push(line);
                }
                break;
            }
            case "class":
                var styleObject = Aux.temp.style[att.nodeValue];
                for (var k in styleObject)
                {
                    component.param[k] = styleObject[k];
                }
                break;
            default: component.param[att.nodeName] = att.nodeValue;break;
        }
        
    }
    
    return component;
}

Aux.createShapeJson2 = function(_components)
{
    var swidth = Aux.temp.maxX - Aux.temp.minX; var sheight = Aux.temp.maxY - Aux.temp.minY;
    
    var sh =  {
    frame:{width:swidth,height:sheight,unit:"px"},
    param:{alignmentRails:true},
    componentParms:[]
    }
    
    for (var c = 0,cLen = _components.length; c < cLen;c++)
    {
        var _component = _components[c];
        var _dimension = _component.origDim;
        var perDim = _component.dimension;
        for (var k in _dimension)
        {
            switch (k)
            {
                case "x2":_dimension.x2 = _dimension.x2 - Aux.temp.minX; perDim.x2 = _dimension.x2*100/swidth; break;
                case "x1":_dimension.x1 = _dimension.x1 - Aux.temp.minX; perDim.x1 = _dimension.x1*100/swidth; break;
                case "x": _dimension.x = _dimension.x - Aux.temp.minX; perDim.x = _dimension.x*100/swidth; break;
                case "y1":_dimension.y1 = _dimension.y1 - Aux.temp.minY; perDim.y1 = _dimension.y1*100/sheight;break;
                case "y2":_dimension.y2 = _dimension.y2 - Aux.temp.minY; perDim.y2 = _dimension.y2*100/sheight;break;
                case "y": _dimension.y = _dimension.y - Aux.temp.minY; perDim.y = _dimension.y*100/sheight;break;
                case "cx": _dimension.cx = _dimension.cx - Aux.temp.minX;perDim.cx = _dimension.cx*100/swidth; break;
                case "cy": _dimension.cy = _dimension.cy - Aux.temp.minY; perDim.cy = _dimension.cy*100/sheight;break;
                case "r": perDim.r = _dimension.r*100/swidth; break;
                case "rx":  perDim.rx = _dimension.rx*100/swidth; break;
                case "ry":  perDim.ry = _dimension.ry*100/sheight;break;
                case "width": perDim.width = _dimension.width*100/swidth; break;
                case "height":  perDim.height = _dimension.height*100/sheight;break;
            }
        }
        
        var _lines = _component.lines;lLen = _lines.length;
        
        for (var l = 0;l < lLen;l++)
        {
            
            var line = _lines[l];
            if (!line.op)
            {
                if (!perDim.points) perDim.points = [];
                var perLine = {op:""};
                
                perDim.points.push(perLine);
                
            } else
            {
                if (!perDim.d) perDim.d = [];
                var perLine = {op:line.op};
                
                perDim.d.push(perLine);
                
                if (line.op === "Z") continue;
            }
            for (k in line)
            {
                if (k.indexOf("x") > -1)
                {
                    line[k] = line[k] - Aux.temp.minX;
                    perLine[k] = line[k]*100/swidth;
                } else if (k.indexOf("y") > -1)
                {
                    line[k] = line[k] - Aux.temp.minY;
                    perLine[k] = line[k]*100/sheight;
                }
            }

        }
        sh.componentParms.push(_component);
    }
    
    return sh;
}

Aux.parsePointString = function(_pString)
{
    var pArray = [];
    var token = "";
    for (var i =0, iLen= _pString.length;i < iLen;i++)
    {
        var ch = _pString.charAt(i);
        switch (ch)
        {
                case "\t":
                case "\n":
                case "\r":
                case " ":
                case "-":
                case ",":
                
                if (token.trim()) {
                    pArray[pArray.length] = token;token = "";
                }
                
                if (ch === "-") token = "-";
                // separator
                break;
            default:
                if ((ch > 0 && ch < 9) || ch === "0" || ch === "9" || ch === ".")
                            token += ch;
                else {
                    if (token.trim()) pArray[pArray.length] = token;
                    pArray[pArray.length] = ch;token = "";
                }
                break;
        }
    }
    if (token.trim()) pArray[pArray.length] = token;
    
    return pArray;
}
Aux.parseD = function(_dString)
{
    var seq = [];var seqPrev = [];
    
    var dArray = Aux.parsePointString(_dString);

    var line=null; var lines = [];
    var prevCoord = {x:0,y:0}; var lastCoord = {x:0,y:0};
    var relative = false;
    for (var d = 0,dLen = dArray.length;d< dLen;d++)
    {
        var data = dArray[d];var op = data.substring(0,1); var coord = false;
        if (!data) continue;

        var opU = op.toUpperCase();
        switch (opU)
        {
            case "A":
                if (op === "a") relative = true; else relative = false;
                
                //rx ry x-axis-rotation large-arc-flag sweep-flag x y
                seq = ["rx", "ry", "a1", "lf", "sf","x", "y"];
                seqPrev = ["rx", "ry", "a1", "lf", "sf","x", "y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "C":
                if (op === "c") relative = true; else relative = false;
                seq = ["x1", "y1", "x2", "y2", "x", "y"];
                seqPrev = ["x1", "y1", "x2", "y2", "x", "y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "H":
                if (op === "h") relative = true; else relative = false;
                seq = ["x"];
                seqPrev = ["x"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "M":
                if (op === "m") relative = true; else relative = false;
                seq = ["x","y"];
                seqPrev = ["x","y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "L":
                if (op === "l") relative = true; else relative = false;
                seq = ["x","y"];
                seqPrev = ["x","y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "Q":
                if (op === "q") relative = true; else relative = false;
                seq = ["x1", "y1","x","y"];
                seqPrev = ["x1", "y1","x","y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "S":
                if (op === "s") relative = true; else relative = false;
                seq = ["x2", "y2", "x", "y"];
                seqPrev = ["x2", "y2", "x", "y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "T":
                if (op === "t") relative = true; else relative = false;
                seq = ["x","y"];
                seqPrev = ["x","y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "V":
                if (op === "v") relative = true; else relative = false;
                seq = ["y"];
                seqPrev = ["y"];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
            case "Z":
                seq =[];
                seqPrev =[];
                prevCoord.x = lastCoord.x; prevCoord.y = lastCoord.y;
                break;
                
            default:
                coord = true;
                data = parseFloat(data);
                break;
        }
        
        if (!coord) {
            line = {"op":opU};
            lines.push(line);
            if (data.length > 1) {data = parseInt(data.substring(1));coord = true;}
        }
        
        if (coord)
        {
            if (seq.length === 0)
            {
                var sLen = seqPrev.length;
                for (var s=0;s< sLen;s++)
                {
                    seq[s] = seqPrev[s];
                }
            }
            var key = seq[0];

            seq.splice(0,1);
            if (key === "x" || key === "x1" || key === "x2")
            {
                if (relative) {
                    data = data + prevCoord.x;
                } else  prevCoord.x = data;
                Aux.temp.setX(data);
                lastCoord.x = data;
                //if (data < Aux.temp.minX) Aux.temp.minX = data;
                //if (data > Aux.temp.maxX) Aux.temp.maxX = data;
            } else if (key == "y" || key == "y1" || key == "y2")
            {
                if (relative) {
                    data = data + prevCoord.y;
                } else prevCoord.y = data;
                Aux.temp.setY(data);
                lastCoord.y = data;
                //if (data < Aux.temp.minY) Aux.temp.minY = data;
                //if (data > Aux.temp.maxY) Aux.temp.maxY = data;
            }
            line[key] = data;
        }
        
    }
    return lines;
}

Aux.parseTransform = function(_transformString,_x,_y,_viewBoxDim)
{
    var newTransform = [];
    var tArray = _transformString.split(")");
    for (var t =0,tLen = tArray.length; t < tLen;t++)
    {
        var tPhrase = tArray[t];
        if (!tPhrase) continue;
        var tKey = "";var tComponent ="";var p =0;var pLen = tPhrase.length;var curr = "";
        // parse key
        for (;p < pLen;) {curr = tPhrase.charAt(p++);if (curr === "(") break;tKey += curr;}
        // parse phrase
        for (;p < pLen;) {curr = tPhrase.charAt(p++);if (curr === ")") break;tComponent += curr;}
        
        var tSeparator = " "; if (tComponent.indexOf(",") > -1) tSeparator = ",";
        var tCoordinates = tComponent.split(tSeparator);
        for (var c = tCoordinates.length - 1;c > -1;c--) tCoordinates[c] = parseFloat(tCoordinates[c]);
        
        /*
        switch (tKey)
        {
            case "matrix":
                tCoordinates[4] = tCoordinates[4] - _viewBoxDim.x
                tCoordinates[5] = tCoordinates[5] - _viewBoxDim.y ;
                break;
            case "translate":
                tCoordinates[0] = tCoordinates[0] - _viewBoxDim.x ;
                tCoordinates[1] = tCoordinates[1] - _viewBoxDim.y;
                break;
            default:
                ;
                
        }
        */
        
        newTransform.push({"key":tKey,"coodinates":tCoordinates});
    }

    return newTransform;
}

Aux.transpose = function(_x,_y,_component,_viewDim,_transformParms)
{
    // just handle the matrix for now
    var matrix = null;
    if (_transformParms.length > 0)
    {
        if (_transformParms[0].key === "matrix")
        {
            var coodinates = _transformParms[0].coodinates;
            matrix = {"a":coodinates[0],"b":coodinates[1],"c":coodinates[2],"d":coodinates[3],"e":coodinates[4],"f":coodinates[5]};
        }
    }
        var origDim = _component.origDim;
        if (origDim)
        {
            for (var k in origDim)
            {
                switch (k)
                {
                        case "x":
                        case "x1":
                        case "x2":
                        origDim[k] = origDim[k] - _x;
                        break;
                    case "y":
                    case "y1":
                    case "y2":
                        origDim[k] = origDim[k] - _y;
                        break;
                }
            }
            
            if (matrix)
            {
                var oldx =0;var oldy = 0;var newx = 0;var newy = 0;
                if (!(origDim.x == undefined)) oldx = origDim.x;if (!(origDim.y == undefined)) oldy = origDim.y;
                newx = matrix.a * oldx + matrix.c * oldy + matrix.e;
                newy = matrix.b * oldx + matrix.d * oldy + matrix.f;
                if (!(origDim.x == undefined)) origDim.x = newx;if (!(origDim.y == undefined)) origDim.y = newy;
                
                oldx =0;oldy = 0;newx = 0;newy = 0;
                if (!(origDim.x1 == undefined)) oldx = origDim.x1;if (!(origDim.y1 == undefined)) oldy = origDim.y1;
                newx = matrix.a * oldx + matrix.c * oldy + matrix.e;
                newy = matrix.b * oldx + matrix.d * oldy + matrix.f;
                if (!(origDim.x1 == undefined)) origDim.x1 = newx;if (!(origDim.y1 == undefined)) origDim.y1 = newy;
                
                oldx =0;oldy = 0;newx = 0;newy = 0;
                if (!(origDim.x2 == undefined)) oldx = origDim.x2;if (!(origDim.y2 == undefined)) oldy = origDim.y2;
                newx = matrix.a * oldx + matrix.c * oldy + matrix.e;
                newy = matrix.b * oldx + matrix.d * oldy + matrix.f;
                if (!(origDim.x2 == undefined)) origDim.x2 = newx;if (!(origDim.y2 == undefined)) origDim.y2 = newy;
            }
            
            for (var k in origDim)
            {
                switch (k)
                {
                    case "x":
                    case "x1":
                    case "x2":
                        Aux.temp.setX(origDim[k]);
                        break;
                    case "y":
                    case "y1":
                    case "y2":
                        Aux.temp.setY(origDim[k]);
                        break;
                }
            }
            
        }
    var param = _component.param;
    if (param)
    {
        for (var k in param)
        {
            switch (k)
            {
                case "x":
                case "x1":
                case "x2":
                    param[k] = param[k] - _x;
                    break;
                case "y":
                case "y1":
                case "y2":
                    param[k] = param[k] - _y;
                    break;
            }
        }
    }
     var fixLineMatrix = function(_line,_x,_y)
    {
        var oldx =_line[_x];var oldy = _line[_y]; if (isNaN(oldx)) oldx = 0; if (isNaN(oldy)) oldy = 0;

        var newx = matrix.a * oldx + matrix.c * oldy + matrix.e;
        var newy = matrix.b * oldx + matrix.d * oldy + matrix.f;
        if (!(_line[_x] == undefined)) _line[_x] = newx;
        if (!(_line[_y] == undefined)) _line[_y] = newy;
        Aux.temp.setX(newx); Aux.temp.setY(newy);
    }
        var lines = _component.lines;
        if (lines)
        {
            for (var l = 0, lLen = lines.length;l < lLen;l++ )
            {
                var line = lines[l];
                if (!(line.x == undefined)) line.x = line.x - _x;
                if (!(line.y == undefined)) line.y = line.y - _y;
                
                if (!(line.x1 == undefined)) line.x1 = line.x1 - _x;
                if (!(line.y1 == undefined)) line.y1 = line.y1 - _y;
                
                if (!(line.x2 == undefined)) line.x2 = line.x2 - _x;
                if (!(line.y2 == undefined)) line.y2 = line.y2 - _y;
                //line.x = line.x - (_x - _viewDim.x); // special rule applies for the lines, we decompensate for viewDim
                //line.y = line.y - (_y - _viewDim.y);
                
                if (matrix)
                {

                    if ((line.x == undefined) && (line.y == undefined)) ; else fixLineMatrix(line,"x","y");
                    
                    if ((line.x1 == undefined) && (line.y1 == undefined)) ; else fixLineMatrix(line,"x1","y1");
                    if ((line.x2 == undefined) && (line.y2 == undefined)) ; else fixLineMatrix(line,"x2","y2");

                }
            }
        }
    
    return _component;
}

Aux.parseStyle = function(_styleString)
{
    var sLen = _styleString.length; var s = 0;
    
    var findDot = function()
    {
        for (;s < sLen;s++) if (_styleString.charAt(s) === ".") {s++;return;}
    }
    
    
    while (s < sLen)
    {
        findDot();
        var className = "";var styleText = "";var stStart = false;
        for (;s < sLen;s++)
        {
            var ch = _styleString.charAt(s);
            
            if (ch === "{") {stStart = true;continue;}
            if (ch === "}") {s++;break;}
            if (stStart) styleText += ch;
            else className += ch;
        }
        
        if (s < sLen) {
            var styleObject = {};
            var stArray = styleText.split(";"); var stLen = stArray.length;
            for (var st = 0; st < stLen;st++)
            {
                var stLine = stArray[st];
                var args = stLine.split(":");
                if (args.length == 2) styleObject[args[0]] = args[1];
            }
            
            Aux.temp.style[className] = styleObject;
        }
    }
    return;

}
