var canvas = document.getElementById('canvas')
var context = canvas.getContext('2d')
var strokeStyleSelect = document.getElementById('strokeStyleSelect') 
var eraseAllButton = document.getElementById('eraseAllButton') 
var guidewireCheckbox = document.getElementById('guidewireCheckbox') 
var fillCheckbox = document.getElementById('fillCheckbox') 
var drawingSurfaceImageData
var mousedown = {}
var rubberbandRect = {}
var dragging = false
var draggingOffsetX
var draggingOffsetY
var editing = false
var polygons = []
var guidewires = guidewireCheckbox.checked
var sides = 8
var startAngle = 0

var Point = function(x,y) {
  this.x = x
  this.y = y
}
var Polygon = function(centerX, centerY, radius, sides, startAngle, strokeStyle, fillStyle, filled) {
  this.x = centerX
  this.y = centerY
  this.radius = radius
  this.sides = sides
  this.startAngle = startAngle || 0
  this.fillStyle = fillStyle
  this.filled = filled
  this.strokeStyle = strokeStyle
}
Polygon.prototype = {
  getPoints: function() {
    var points = []
    var angle = this.startAngle
    for(var i = 0; i < this.sides; i++) {
      debugger
      points.push(new Point(this.x + this.radius * Math.sin(angle), this.y - this.radius * Math.cos(angle)));
      angle += 2 * Math.PI / this.sides
    }
    return points
  },
  createPath: function(context) {
    debugger
    var points = this.getPoints()
    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    for(var i = 1; i < this.sides; ++i) {
      context.lineTo(points[i].x, points[i].y)
    }
    context.closePath()
  },
  stroke: function(context) {
    context.save()
    this.createPath(context)
    context.strokeStyle = this.strokeStyle
    context.stroke()
    context.restore()
  },
  fill: function(context) {
    context.save()
    this.createPath(context)
    context.fillStyle = this.fillStyle
    context.fill()
    context.restore()
  },
  move: function(x, y) {
    this.x = x
    this.y = y
  }
}
function drawPolygon(polygon) {
  context.beginPath()
  polygon.createPath(context)
  polygon.stroke(context)
  if(fillCheckbox.checked) {
    polygon.fill(context)
  } else {
    polygons.push(polygon)
  }
}
function drawPolygons() {
  polygons.forEach(function(polygon){
    drawPolygon(polygon)
  })
}
function drawGrid(color, stepx, stepy) {}
function drawHorizontalLine(y) {
  context.beginPath()
  context.moveTo(0, y + 0.5)
  context.lineTo(context.canvas.width, y + 0.5)
  context.stroke()
}
function drawVerticalLine(x) {
  context.beginPath()
  context.moveTo(x + 0.5, 0)
  context.lineTo(x + 0.5, context.canvas.height)
  context.stroke()
}
function drawGuidewires(x, y) {
  context.save()
  context.strokeStyle = 'rgba(0,0,230,0.4)'
  context.lineWidth = 0.5
  drawHorizontalLine(y)
  drawVerticalLine(x)
  context.restore()
}
function drawRubberbandShape(loc) {
  context.beginPath()
  context.moveTo(mousedown.x, mousedown.y)
  context.lineTo(loc.x, loc.y)
  context.stroke()
}
function updateRubberband(loc) {
  updateRubberbandRectangel(loc)
  drawRubberbandShape(loc)
}
function updateRubberbandRectangel(loc) {
  rubberbandRect.width = Math.abs(loc.x - mousedown.x)
  rubberbandRect.height = Math.abs(loc.y - mousedown.y)
  if(loc.x > mousedown.x) {
    rubberbandRect.left = mousedown.x
  } else {
    rubberbandRect.left = loc.x
  }
   if(loc.y > mousedown.y) {
    rubberbandRect.top = mousedown.x
  } else {
    rubberbandRect.top = loc.y
  }
}
function windowTocanvas(x, y) {
  var bbox = canvas.getBoundingClientRect()
  return {
    x: x - bbox.left * (canvas.width / bbox.width),
    y: y - bbox.top * (canvas.height / bbox.height)
  }
}
function saveDrawingSurface() {
  drawingSurfaceImageData = context.getImageData(0, 0, canvas.width, canvas.height)
}
function restoreDrawingSuface() {
  context.putImageData(drawingSurfaceImageData, 0, 0)
}
// Dragging ------------------------------
function startDragging(loc) {
  saveDrawingSurface()
  mousedown.x = loc.x
  mousedown.y = loc.y
}
function startEditing() {
  canvas.style.cursor = 'pointer';
  editing = true
}
function stopEditing() {
  canvas.style.cursor = 'crosshair';
  editing = false
}
canvas.onmousedown = function(e) {
  var loc = windowTocanvas(e.clientX, e.clientY)
  e.preventDefault()
  if(editing) {
    polygons.forEach(function(polygon){
      polygon.createPath(context)
      if(context.isPointInPath(loc.x, loc.y)) {
        startDragging(loc)
        dragging = polygon
        draggingOffsetX = loc.x - polygon.x
        draggingOffsetY = loc.y - polygon.y
        return
      }
    })
  } else {
    startDragging(loc)
    dragging = true
  }
}
canvas.onmousemove = function(e) {
  var loc = windowTocanvas(e.clientX, e.clientY)
  e.preventDefault()
  if(dragging) {
    console.log(dragging)
    dragging.x = loc.x - draggingOffsetX
    dragging.y = loc.y - draggingOffsetY
    restoreDrawingSuface()
    updateRubberband(loc)
    if(guidewires) {
      drawGuidewires(loc.x, loc.y)
    }
  }
}
canvas.onmouseup = function(e) {
  var loc = windowTocanvas(e.clientX, e.clientY)
  restoreDrawingSuface()
  updateRubberband(loc)
  dragging = false
}
eraseAllButton.onclick = function(e) {
  context.clearRect(0, 0, canvas.width, canvas.height)
  drawGrid('lightgray', 10, 10)
  saveDrawingSurface()
}

strokeStyleSelect.onchange = function(e) {
  context.strokeStyle = strokeStyleSelect.value
}
guidewireCheckbox.onchange = function(e) {
  guidewires = guidewireCheckbox.checked
}

context.strokeStyle = strokeStyleSelect.value
drawGrid('lightgray', 10, 10)