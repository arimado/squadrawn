// GLOBAL VARIABLES

var mouseMovement;
var shiftDown = false;
var canvas;
var pixels = [];
var lines = [];
var lastline;
var cursorMode = {};
var mouseDownPos;
var mouseUpPos;
var mouseDelta;
var selectionBox;
var boxSelected;



// CANVAS FUNCTIONS

function createSelectionBox(selection) {
  b = selection.bounds;
  selectionBox = new Path.Rectangle(b);
  selectionBox.insert(2, new Point(b.center.x, b.top));
  selectionBox.insert(2, new Point(b.center.x, b.top-25));
  selectionBox.insert(2, new Point(b.center.x, b.top));
  selectionBox.position = selection.bounds.center;
  selectionBox.rotation = selection.rotation;
  selectionBox.scaling = selection.scaling;
  selectionBox.strokeWidth = 5;
  selectionBox.strokeColor = 'blue';
  selectionBox.name = "selection rectangle";
  selectionBox.selected = true;
  selectionBox.ppath = selection;
  paper.view.draw();
}

function saveCanvas() {
  // console.log("attempting to save");
  var canvasIsThere = $('#myCanvas')[0];
  if (canvasIsThere) return project.exportJSON();
}


// Checks radio buttons and defines an object based on them
function getCursorMode() {
  cursorMode = {
    brush: $('#brushRadio').is(':checked'),
    select: $('#selectRadio').is(':checked'),
  };
}

function switchCursor() {
    getCursorMode();
    // Deselect items when changing from select mode
    if (!cursorMode.select) {
      _.each(project.selectedItems, function (s) {
        s.selected = false;
      });
      paper.view.draw();
    }
}

function deselectAll() {
  _.each(project.selectedItems, function(l){
    l.selected = false;
  });
  _.each(project.getItems({name: "selection rectangle"}), function(r){
    r.remove();
  });

}

function saveDesign() {
  canvas = document.getElementById("myCanvas");
  var imageUrl = canvas.toDataURL("image/png");
  var designID = app.designs.get(app.currentDesignID);
  var designJSON = saveCanvas();
  designID.set("canvas_data", designJSON);
  designID.set("url", imageUrl);
  designID.save(null, {
    success: function (model, response) {
      console.log("design saved");
    }});
}

function loadCanvas() {
  project.importJSON(app.designs.get(app.currentDesignID).get("canvas_data"));
  paper.view.draw();
}

// Removes the last line drawn from the canvas, and removes it from the lines array.
function undo(){
    _.last(lines).remove();
    lines.pop();
}

function deleteProject(){
  app.designs.get(app.currentDesignID).destroy();
  window.location = "/designs";

}

function exportCanvas() {
    canvas = document.getElementById("myCanvas");
    var imgUrl = canvas.toDataURL("image/png");
    console.log("export attempted");
    download(imgUrl);
      // var $img = $("<img>");
      // $img.attr("src", imgUrl);
      // $("#imageGallery").append($img);

}

function downloadCanvas(link) {
  link.href = document.getElementById("myCanvas").toDataURL("image/png");
  link.download = "dope-photo.png";
}

function insertImage(url){
    var raster = new Raster(url);
    raster.name = "r" + Math.random().toFixed(5) + Date.now() +"";
    var leftPosition = view.center._x = 0;
    raster.position = leftPosition;
    rasterJSON = raster.exportJSON();
    rasterJSON = [rasterJSON, app.currentUser];
    sendCanvasData(rasterJSON);
    return raster;
}


function deleteSelectedElements() {
  var deleteJSON = ["Delete", app.currentUser];
  var itemsToDelete = [];
  _.each(project.selectedItems, function(p) {
    itemsToDelete.push(p.name);
    p.remove();
    paper.view.draw();
  });
  deleteJSON.push(itemsToDelete);
  sendCanvasData(deleteJSON);
}

function insertDrawing (data) {

    var meme = project.importJSON(data);
    _.each(meme.children, function(p){
        p.name = "p" + p.id + Math.random().toFixed(5) + Date.now() +"";
        pathJSON = p.exportJSON();
        pathJSON = [pathJSON, app.currentUser];
        sendCanvasData(pathJSON);
    });
    paper.view.draw();
}

function insertElement (data) {
    var content = JSON.parse(data.element_data);

    if (data.element_type === 'image') {
        return insertImage(content.value.url);
    }
    if (data.element_type === 'shape') {
        return insertDrawing(content.value);
    }
}




// INITIALIZE CANVAS
function initializePaper() {
  // console.log("paperScript initialized");
  paper.setup('myCanvas');
  paper.install(window);

  loadCanvas();
  getCursorMode();
  $("#undoButton").click(undo);
  $(".cursorRadio").click(switchCursor);
  $("#saveButton").click(saveDesign);
  $("#downloadLink").click(function(){
    downloadCanvas(this);
  });
  $("#deleteButton").click(deleteProject);

  $("#myCanvas").click(function(){
    $("input").blur();
  });


    // Checks if shift is being held down
    $(window).keydown(event, function(e) {
      if (event.keyCode == 16) {
      shiftDown = true;
      }
    });
    $(window).keyup(event, function(e) {
      if (event.keyCode == 16) {
        shiftDown = false;
      }
    });

    // Checks if delete is pressed, and no input field is being focused
    $(window).keydown(event, function(){
      if(event.keyCode === 46 || event.keyCode === 8) {
        if (!$("input").is(":focus") && project.selectedItems.length !== 0) {
              event.preventDefault();
              deleteSelectedElements();
          }
      }
    });

		// Create a drawing tool:
		var tool = new Tool();
		var path;

		// Define a mousedown and mousedrag handler
    		tool.onMouseDown = function(event) {
          mouseDownPos = event.point;
            if (cursorMode.brush === true) {
              			path = new Path();
              			path.strokeColor = '#' + $("#colorPicker").val();
                    path.strokeWidth = $(".brushSizeInput").val();
                    path.strokeCap = 'round';
              			path.add(event.point);
              }



            if (cursorMode.select === true) {
              selected = project.hitTest(event.point);
                if (project.hitTest(event.point).item.name == "selection rectangle") {
                  boxSelected = true;
                  console.log("click on transform box");
                } else {
                  // createSelectionBox(selected.item);
                }
                  console.log(selected);


                  if (selected !== null) {
                        if (!shiftDown) {
                          if(selected.item.selected !== true) {
                            deselectAll();

                          }
                        }
                  }

                  if (!shiftDown && project.selectedItems.length === 0 && selected) {
                    selected.item.selected = true;
                    selectionBox.selected = true;
                  }

              }
    		}

    		tool.onMouseDrag = function(event) {
            mouseMovement = event.delta;

            if (cursorMode.brush === true) {
                    pixels.push(path);
              			path.add(event.point);
            }

            if (cursorMode.select === true) {


            if (!boxSelected) {
              if (selected !== null) {
                  _.each(project.selectedItems, function(i) {
                      i.position = {x: i.position._x + event.delta.x, y: i.position._y + event.delta.y};

                  });
                } else {
                  // console.log("firing select drag");
                  var selectBox = new Path.Rectangle(new Point(50, 50), new Point(150, 100));
                  selectBox.add(event.point);
                }
            } else {
              _.each(project.selectedItems, function(i){
                i.scaling = {x: i.scaling._x - (event.delta.x / 200), y: i.scaling._y + (event.delta.y / 100)};
              });
            }
              }
    		};

        tool.onMouseUp = function(event) {
          boxSelected = false;
          mouseUpPos = event.point;

            if (cursorMode.brush === true) {
                lines.push(path);
                path.name = "p" + Math.random().toFixed(5) + Date.now() +"";
                lastline = path;
                lastlineJSON = lastline.exportJSON();
                lastlineJSON = [lastlineJSON, app.currentUser];
                sendCanvasData(lastlineJSON);
            }
            if (cursorMode.select === true) {
              if (selected !== null) {
                if (mouseUpPos.x === mouseDownPos.x && mouseUpPos.y === mouseDownPos.y){
                  if (shiftDown) { // if shift is being held down, and the mouse ahs not moved
                    if (selected.item.selected === true) {
                      selected.item.selected = false;
                    } else {
                      selected.item.selected = true;
                    }
                  }

                  if (!shiftDown && project.selectedItems.length > 0) {
                    deselectAll();

                    selected.item.selected = true;
                    // createSelectionBox(selected.item);
                  }

                  if (!shiftDown && project.selectedItems.length === 0) {
                    if (selected.item.selected === true) {
                      selected.item.selected = false;
                    } else {
                      selected.item.selected = true;
                    }
                  }
                } else {// (if mouse has moved)
                  selectedItems = project.selectedItems;
                  var movementJSON = ["Movement", app.currentUser];
                  var movementData = [];
                    _.each(selectedItems, function(i){
                      var itemData = [i.name, i.position._x, i.position._y];
                      movementData.push(itemData);
                    });
                  movementJSON.push(movementData);
                  sendCanvasData(movementJSON);
                }
              } else {  // if selected == null
                if(!shiftDown) {
                deselectAll();
                }
              }
          }
        };  // onMouseUp

        function onMouseMove(event) {
          	project.activeLayer.selected = false;
          	if (event.item)
          	{
          		event.item.selected = true;
          	}
              if(selectionRectangle)
                  selectionRectangle.selected = true;
          }


} // closes Initialize Paper
