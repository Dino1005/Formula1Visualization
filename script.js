const width = window.innerWidth
const height = window.innerHeight

let zoomTransform = d3.zoomIdentity,
  coordinatesArray,
  markers,
  tooltip

const circuitName = d3.select("#name")
const circuitCountry = d3.select("#country")
const circuitFirst = d3.select("#first")
const circuitLength = d3.select("#length")
const circuitLaps = d3.select("#laps")

const circuitSvg = d3.select("#circuit-layout")

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
  .style("background", "#fafae6")

const zoomContainer = svg.append("g")

const zoom = d3.zoom().on("zoom", function (event) {
  zoomTransform = event.transform
  zoomContainer.attr("transform", zoomTransform)
  updateMarkerSize()
  updateTooltip(event)
})

svg.call(zoom)

getSvg("marker")

d3.json("world_map.json").then(function (world) {
  const data = topojson.feature(world, world.objects.collection)

  projection.fitSize([width, height], data)

  zoomContainer
    .selectAll("path.country")
    .data(data.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .style("fill", "#950101")

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
      .on("mouseover", function (event, d) {
        updateTooltip(event, d)
      })
      .on("mouseout", function () {
        tooltip.transition().duration(200).style("display", "none")
      })

    updateMarkerSize()

    tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("display", "none")

    svg
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity.scale(0.9))
  })
})

function updateTooltip(event, d) {
  const index = coordinatesArray.findIndex((coord) => coord === d)

  const [x, y] = [event.pageX, event.pageY]
  d3.json("circuits.json").then(function (circuits) {
    const circuit = circuits[index]

    if (circuit && circuit.location) {
      tooltip.html(circuit.location + ", " + circuit.country)
      tooltip.transition().duration(200).style("display", "block")
      tooltip.style("left", x + 20 + "px").style("top", y + 20 + "px")
    } else {
      tooltip.style("display", "none")
    }
  })
}

function getSvg(name) {
  var request = new XMLHttpRequest()
  if (name === "marker") request.open("GET", "./symbol.svg", true)
  else request.open("GET", `./circuits/${name}.svg`, true)
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      var data = request.responseText
      if (name === "marker")
        svg
          .append("defs")
          .append("symbol")
          .attr("id", "markerSymbol")
          .html(data)
      else circuitSvg.html(data)
    }
  }
  request.send()
}

function getSymbolSize() {
  const scaleFactor = 0.03 / zoomTransform.k
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

  tooltip.style("display", "none")

  svg
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.scale(0.5))

  if (zoomTransform.k >= 0.9) showStats(index)
}

function showStats(index) {
  var circuit

  d3.json("circuits.json").then(function (circuits) {
    circuit = circuits[index]

    getSvg(circuit.circuitRef)
    circuitName.text(circuit.name)
    circuitCountry.text(`Location: ${circuit.location}, ${circuit.country}`)
    circuitFirst.text(`First held: ${circuit.first}.`)
    circuitLength.text(`Circuit length: ${circuit.length}km`)
    circuitLaps.text(`Laps: ${circuit.laps}`)

    d3.select(".circuit-container")
      .transition()
      .delay(400)
      .style("display", "flex")
  })
}

svg.on("click", function () {
  const currentScale = zoomTransform.k

  if (currentScale < 0.9) {
    svg
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.scale(0.9))

    d3.select(".circuit-container").style("display", "none")
  }
})
