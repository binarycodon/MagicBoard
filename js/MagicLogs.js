var logSeq = -1;var deltaInterval = 5000;var replayInterval = 1000;var currentLogSeq = 0; var lockedLogSeq = null;
var logIdTracker = {};
var logOfEvents = [];
function getLogSeq()
{
    if (lockedLogSeq) { currentLogSeq = lockedLogSeq; lockedLogSeq = null;}
    else {currentLogSeq = logSeq + 1;}
    return currentLogSeq;
}

function setLogSeq(_seq)
{
    lockedLogSeq = _seq;
}

var clickActiveTracker = false;
function logEvents(evName,a,b,c,d,e,f,g)
{
    var shapeId = "";
    logSeq = getLogSeq();
    var logData = {"id":logSeq,"evName":evName,"sheet":currentSheetName};

    if (this instanceof Shape) {shapeId = this.id;logData.type = "Shape";logData.name = shapeId;logData.typeId = this.typeId;}
    else if (this instanceof Sheet) {logData.type = "Sheet";logData.name = this.name;}
    else if (this instanceof HTMLElement) logData.name = this.getAttribute("id");
    
    switch (evName)
    {
        case "create":
            //pos,cnter,_parent
            if (a) logData.pos = a;
            if (b) logData.cnter = b;
            if (c) logData.parentId = c;
            logData.tip =  "create "+logData.typeId;
            break;
        case "applyProperty":
            var target = null;
            if (a) target = a;
            if (target instanceof HTMLElement)
            {
                logData.targetId = target.getAttribute("id");
                logData.pKey = target.getAttribute("data-key");
                logData.dataName = target.getAttribute("data-name");
                logData.dataType = target.getAttribute("data-type");
                logData.dataValue = target.value;
                logData.dataLabel = target.getAttribute("data-label");
                logData.dataGroup = target.getAttribute("data-group");
            } else
            {
                logData.pKey = a;
                logData.dataName = b;
                logData.dataType = c;
                logData.dataValue = d;
                logData.dataLabel = e;
                logData.dataGroup = f;
            }
            logData.tip = "apply Property ";
            break;
        case "applyConnector":
        case "changeLineType":
            //beginShape.id,endShape.id,connectProp);
            if (a) logData.beginShapeId = a;
            if (b) logData.endShapeId = b;
            var cInfo = null;
            if (c) {
                cInfo = c;
                logData.pos = cInfo.pos;
                logData.turningPoints = cInfo.turningPoints;
                logData.connProp = cInfo.connProp;
            }
            logData.path = JSON.parse(JSON.stringify(MagicBoard.scratch.path));
            
            break;
        case "deleteConnector":
            if (a) logData.beginShapeId = a;
            if (b) logData.endShapeId = b;
            break;
        case "click":
        case "deSelect":
            break;
        case "doubleClick":
            // remove the click from the previous logEvents
            var prevSeq = logOfEvents.length - 1;
            var prevLogEv = logOfEvents[prevSeq];
            if (prevLogEv.evName === "click" && prevLogEv.name == logData.name) logOfEvents.splice(prevSeq,1); // remove two clicks and replace with doubleclick
            else break;
            prevSeq = logOfEvents.length - 1;
            prevLogEv = logOfEvents[prevSeq];
            if (prevLogEv.evName === "click" && prevLogEv.name == logData.name) logOfEvents.splice(prevSeq,1); // remove two clicks and replace with doubleclick
            break;
        case "resizeStop":
            var resize = MagicBoard.indicators.resize;
            logData.resize = resize;
            logData.resizeStarted = MagicBoard.indicators.resizeStarted;
            logData.click = MagicBoard.indicators.click;
            break;
        case "moveStop":
            var pos = MagicBoard.indicators.moveStarted; var clickPos = MagicBoard.indicators.click;
            var diffX = pos.x - clickPos.x;var diffY = pos.y - clickPos.y;
            logData.pos = pos;
            logData.clickPos = clickPos;
            logData.diff = {x:diffX,y:diffY};
            break;
            break;
        case "align":
            if (a) logData.sheetName = a;
            break;
        case "renameSheet":
            if (a) logData.oldName = a;
            if (b) logData.newName = b;
            break;
        case "downloadSheet":
            if (a) logData.type = a;
            break;
        case "zoom":
            if (a) logData.prevZoom = a;
            if (b) logData.currentZoom = b;
            break;
        case "populateCategoryJson":
            if (a) logData.categoryId = a;
            break;
    }
    
    add2LogEvents(logData);
    if (openSecret) postLog([logData]);
    //
    //
}

function add2LogEvents(_logData)
{
    logOfEvents.push(_logData);logIdTracker[_logData.id] = true;
}

function setLogEvents(_logOfEvents)
{
    if (!_logOfEvents) return;
    logSeq = -1;
    for (var i =0,iLen = _logOfEvents.length;i < iLen;i++ )
    {
        add2LogEvents(_logOfEvents[i]);
        logSeq = _logOfEvents[i].id;
    }
}

function emptyLogEvents()
{
    logOfEvents = [];logIdTracker = {};logSeq = -1;
}

var playCount = 0; var playEvents = []; var playLogTracker = {};
function play()
{
    playCount = 0;
    playEvents = logOfEvents;
    emptyLogEvents();
    var sh = MagicBoard.sheetBook.currentSheet;
    for (var sp = sh.shapes.length - 1;sp > -1;sp--)
    {
        sh.shapes[sp].deleteShape();
    }
    MagicBoard.counter = 0;
    setTimeout(redoLog,200);
}

hold = null;
function redoLog()
{
    hold = openSecret;openSecret = null;
        var logData = playEvents[playCount++];
    setLogSeq(logData.id);

    var tip = logData.evName;
        switch (logData.evName)
        {
            case "create":
                var parent = null;
                if (logData.parentId) parent = Utility.Sheet.findShapeById(logData.parentId);
                addObject(logData.typeId,false,logData.pos,logData.cnter,parent,logData.name);
                tip = "create "+logData.typeId;
                break;
            case "applyProperty":
                var shape = Utility.Sheet.findShapeById(logData.name);
                shape.applyProperty(logData.pKey,logData.dataName,logData.dataType,logData.dataValue,logData.dataLabel,logData.dataGroup);
                
                window["logEvents"].call(shape,"applyProperty",logData.pKey,logData.dataName,logData.dataType,logData.dataValue ,logData.dataLabel,logData.dataGroup);
                tip = "apply Property ";
                break;
            case "changeLineType":
                //
                beginShape = Utility.Sheet.findShapeById(logData.beginShapeId);
                endShape = Utility.Sheet.findShapeById(logData.endShapeId);
                var cInfo = MagicBoard.sheetBook.currentSheet.getConnection(beginShape,endShape);
                cLine = cInfo.shape;
                MagicBoard.sheetBook.star.cLine = cLine;
                window["changeLineType"].call(cLine);
                $("#lineTypePrompt").hide();
                tip = "change Connector";
                break;
            case "applyConnector":

                var beginShape = Utility.Sheet.findShapeById(logData.beginShapeId);
                var endShape = Utility.Sheet.findShapeById(logData.endShapeId);
                var pos = logData.pos;
                MagicBoard.scratch.path = logData.path;
                var cInfo = Utility.Shape.connectTo(beginShape,endShape,logData.connProp);
                // since we are not calling index.html functions, we need to log it ourselves
                window["logEvents"].call(beginShape,"applyConnector",beginShape.id,endShape.id,cInfo);
                tip = "create/change Connection";
                break;
            case "deleteConnector":
               // var beginShape = Utility.Sheet.findShapeById(logData.beginShapeId);
               // var endShape = Utility.Sheet.findShapeById(logData.endShapeId);
               // var cInfo = MagicBoard.sheetBook.currentSheet.getConnection(beginShape,endShape);
               // cLine = cInfo.shape; // this variable cLine is in index.html
                deleteLine();
                tip = "delete Connection";
                break;
                
            case "deleteShape":
                var shape = Utility.Sheet.findShapeById(logData.name);
                ObjectFunctions.delete();
                tip = "deleted "+logData.name;
                break;
            case "click":
                var shape = Utility.Sheet.findShapeById(logData.name);
                shape.click();
                tip = "click on "+logData.name;
                break;
            case "deSelect":
                ObjectFunctions.deSelect();
                tip ="";
                break;
            case "doubleClick":
                var shape = Utility.Sheet.findShapeById(logData.name);
                MagicBoard.indicators.hilight = shape;
                addEditText(true); // no auto click
                //shape.doubleClick();
                setTimeout(function() {MagicBoard.indicators.hilight = false;},5);
                tip = "doubleClick on "+logData.name;
                break;
            case "resizeStop":
                var shape = Utility.Sheet.findShapeById(logData.name);
                shape.dimension.resizeX = shape.dimension.left;shape.dimension.resizeY = shape.dimension.top;
                // find out what changed
                var dim = shape.dimension;
                shape.dimension.resizeHeight = dim.height;shape.dimension.resizeWidth = dim.width;
                MagicBoard.indicators.resize = logData.resize;
                MagicBoard.indicators.resizeStarted = logData.resizeStarted;
                MagicBoard.indicators.click = logData.click;
                
                shape.resizeContinue(logData.resizeStarted,logData.click);
                shape.resizeStop();
                tip = "resize "+logData.name;
                break;
            case "moveStop":
                var shape = Utility.Sheet.findShapeById(logData.name);
                MagicBoard.indicators.hilight = shape;
                MagicBoard.indicators.moveStarted = logData.pos;
                MagicBoard.indicators.click = logData.clickPos;
                MagicBoard.indicators.mouseDown = true;
                MagicBoard.eventStop();
                tip = "move "+logData.name;
                break;
            case "align":
                alignShapes();
                tip = "align Sheet Objects ";
                break;
            case "renameSheet":
                $("#newSheetName").val(logData.newName);
                renameCurrentSheet();
                tip = "rename Sheet "+logData.name;
                break;
            case "downloadSheet":
                downloadSheetImage(logData.type)
                tip = "download Sheet Image "+logData.type;
                break;
            case "zoom":
                var _type = "+";
                if (currentZoom > prevZoom) _type = "-";
                zoom(_type);
                tip = "zoom ";
                if (_type === "+") tip += " In"; else tip += " Out";
                break;
            case "populateCategoryJson":
                var target = document.getElementById(logData.categoryId);
                target.click();
                tip = "";
                //window["populateCategoryJson"].call(target,logData.categoryId);
                break;
            default:
                break;
        }
    if (logData.tip) tip = logData.tip;
    if (tip) showTip(tip);
    if (playCount < playEvents.length) {
        setTimeout(redoLog,replayInterval);
    }
    else {
        playEvents = [];playCount = 0;playLogTracker = {};
    }
    
    openSecret = hold;hold = null;
}

function undoLog()
{
    
}

var openSecret = null;
function generateToken()
{
    var oneChar = ["@","@","#","$","*","#","@","#","$","*"];
    var A = Math.floor((Math.random() * 1000) + 1);
        var rand = Math.floor((Math.random() * 10) );
        var cha = oneChar[rand];
    var B = Math.floor((Math.random() * 1000) + 1);
    openSecret = cha+A+"-"+B;
    postLog(logOfEvents);
    setTimeout(deltaLog,deltaInterval);
    return openSecret;
}


function deltaLog()
{
    if (!openSecret) return;
    var myUrl = "php/dm.php?method=get&index="+logSeq+"&token="+encodeURIComponent(openSecret);
    
    $.ajax({
           url: myUrl,
           type: "GET",
           dataType: "json",
           contentType: "application/json"
           })
    .done(function (data) {
            var changed = false;
            // Add data to logOfEvents
            for (var i = 0,iLen = data.length; i < iLen;i++)
            {
                if (playLogTracker[data[i].id] ) continue; // already in the log, skip it
                changed = true;
                playEvents.push(data[i]);
                playLogTracker[data[i].id] = true; // set it so if deltalog is called before play logs are drained, we can skip them
            };
            if (changed) setTimeout(redoLog,10); // screen sharing
            setTimeout(deltaLog,deltaInterval);
          });
}

function postLog(data)
{
    var myUrl = "php/dm.php?method=put&token="+encodeURIComponent(openSecret);
    
    $.ajax({
           url: myUrl,
           'data': JSON.stringify(data), //{action:'x',params:['a','b','c']}
           'type': 'POST',
           'processData': false,
           contentType: "application/json"
           })
    .done(function (data) {
          console.log("Response " + JSON.stringify(data));
          })
}