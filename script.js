const width = window.innerWidth
const height = window.innerHeight - 100

let coordinatesArray
let zoomTransform = d3.zoomIdentity
let markers, isPressed
const circuitSvg = d3.select("#circuit-layout")

var xhr = new XMLHttpRequest()
xhr.open("GET", "./symbol.svg", true)
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    var data = xhr.responseText
    svg.append("defs").append("symbol").attr("id", "markerSymbol").html(data)
  }
}
xhr.send()

const projection = d3
  .geoMercator()
  .center([10, 50])
  .rotate([-10, 0])
  .translate([width / 2, height / 2])

const path = d3.geoPath(projection)

const svg = d3
  .select("#map")
  .attr("width", width)
  .attr("height", height)
  .style("background", "#6c7474")

const zoomContainer = svg.append("g")

const zoom = d3.zoom().on("zoom", function (event) {
  zoomTransform = event.transform
  zoomContainer.attr("transform", zoomTransform)
  updateMarkerSize()
})

svg.call(zoom)

d3.json("world_map.json").then(function (world) {
  const data = topojson.feature(world, world.objects.collection)

  projection.fitSize([width, height], data)

  const countries = zoomContainer
    .selectAll("path.country")
    .data(data.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .style("fill", "#090909")

  d3.json("circuits.json").then(function (circuits) {
    coordinatesArray = circuits.map((circuit) => [circuit.lng, circuit.lat])

    markers = zoomContainer
      .selectAll(".marker")
      .data(coordinatesArray)
      .enter()
      .append("use")
      .attr("class", "marker")
      .attr("xlink:href", "#markerSymbol")
      .style("cursor", "pointer")
      .attr("x", "-200")
      .attr("y", "-700")
      .on("click", function (event, d) {
        handleMarkerClick(event, d)
      })

    updateMarkerSize()
  })
})

function getSymbolSize() {
  const scaleFactor = 0.02 / zoomTransform.k
  return Math.max(scaleFactor, 0.01)
}

function updateMarkerSize() {
  markers.attr("transform", function (d) {
    const symbolSize = getSymbolSize()
    const [x, y] = projection(d)
    const translateX = x - symbolSize / 2
    const translateY = y - symbolSize / 2
    return `translate(${translateX}, ${translateY}) scale(${symbolSize})`
  })
}

function handleMarkerClick(event, d) {
  const index = coordinatesArray.findIndex((coord) => coord === d)
  console.log(index)

  svg
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.scale(0.5))

  d3.json("circuits.json").then(function (circuits) {
    const circuit = circuits[index]

    var xhr = new XMLHttpRequest()
    xhr.open("GET", `./circuits/${circuit.circuitRef}.svg`, true)
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = xhr.responseText
        circuitSvg.html(data)
      }
    }
    xhr.send()
  })

  circuitSvg.transition().delay(400).style("display", "block")
}

svg.on("click", function () {
  const currentScale = zoomTransform.k

  if (currentScale < 1) {
    svg
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.scale(1))

    d3.select("#circuit-layout").style("display", "none")
  }
})
