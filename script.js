const width = window.innerWidth
const height = window.innerHeight

let zoomTransform = d3.zoomIdentity,
  coordinatesArray,
  markers,
  tooltip,
  selectedCircuit

const circuitSvg = d3.select("#circuit-layout")
const graphSvg = d3.select("#graph")

const circuitName = d3.select("#name")
const circuitCountry = d3.select("#country")
const circuitFirst = d3.select("#firstHeld")
const circuitLength = d3.select("#length")
const circuitLaps = d3.select("#laps")
const firstPlace = d3.select("#first")
const secondPlace = d3.select("#second")
const thirdPlace = d3.select("#third")
const firstName = d3.select("#firstName")
const secondName = d3.select("#secondName")
const thirdName = d3.select("#thirdName")
const yearSelect = document.querySelector("#year")
const fastestLap = d3.select("#flap")

const projection = d3
  .geoMercator()
  .center([10, 50])
  .rotate([-10, 0])
  .translate([width / 2, height / 2])

const path = d3.geoPath(projection)

const map = d3
  .select("#map")
  .attr("width", width)
  .attr("height", height)
  .style("background", "#fafae6")

const zoomContainer = map.append("g")

const zoom = d3.zoom().on("zoom", function (event) {
  zoomTransform = event.transform
  zoomContainer.attr("transform", zoomTransform)
  updateMarkerSize()
  updateTooltip(event)
})

map.call(zoom)

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

    map
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
        map
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

  map
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.scale(0.5))

  if (zoomTransform.k >= 0.9) showStats(index)
}

function showStats(index) {
  d3.json("circuits.json").then(function (circuits) {
    selectedCircuit = circuits[index]

    updateSelectionYears()

    getSvg(selectedCircuit.circuitRef)
    circuitName.text(selectedCircuit.name)
    circuitCountry.text(
      `Location: ${selectedCircuit.location}, ${selectedCircuit.country}`
    )
    circuitFirst.text(`First held: ${selectedCircuit.first}.`)
    circuitLength.text(`Circuit length: ${selectedCircuit.length} km`)
    circuitLaps.text(`Laps: ${selectedCircuit.laps}`)

    d3.select(".circuit-container")
      .transition()
      .delay(400)
      .style("display", "flex")

    const selectedYear = yearSelect.value
    const race = selectedCircuit.stats[`year${selectedYear}`]

    firstPlace.attr("src", function (d) {
      return "./images/" + race.first + ".png"
    })
    secondPlace.attr("src", function (d) {
      return "./images/" + race.second + ".png"
    })
    thirdPlace.attr("src", function (d) {
      return "./images/" + race.third + ".png"
    })

    d3.json("drivers.json").then(function (drivers) {
      firstName.text(
        drivers.find((driver) => driver.driverRef === race.first).driverName
      )
      secondName.text(
        drivers.find((driver) => driver.driverRef === race.second).driverName
      )
      thirdName.text(
        drivers.find((driver) => driver.driverRef === race.third).driverName
      )
      fastestLap.text(
        drivers.find((driver) => driver.driverRef === race.fastest).driverName +
          ", " +
          race.lap +
          "s"
      )
    })

    d3.select(".graph-container")
      .transition()
      .delay(400)
      .style("display", "flex")

    d3.select(".selection-container")
      .transition()
      .delay(400)
      .style("display", "flex")
  })
}

function updateSelectionYears() {
  const years = Object.keys(selectedCircuit.stats)
  console.log(years)
  yearSelect.innerHTML = ""
  years.forEach((year) => {
    const option = document.createElement("option")
    option.value = year.substring(4)
    option.innerHTML = year.substring(4)
    yearSelect.appendChild(option)
  })
}

map.on("click", function () {
  const currentScale = zoomTransform.k

  if (currentScale < 0.9) {
    map
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.scale(0.9))

    d3.select(".circuit-container").style("display", "none")
    d3.select(".graph-container").style("display", "none")
    d3.select(".selection-container").style("display", "none")
  }
})

yearSelect.addEventListener("change", function () {
  updateStats()
})

function updateStats() {
  const selectedYear = yearSelect.value
  const race = selectedCircuit.stats[`year${selectedYear}`]

  firstPlace.attr("src", function (d) {
    return "./images/" + race.first + ".png"
  })
  secondPlace.attr("src", function (d) {
    return "./images/" + race.second + ".png"
  })
  thirdPlace.attr("src", function (d) {
    return "./images/" + race.third + ".png"
  })

  d3.json("drivers.json").then(function (drivers) {
    firstName.text(
      drivers.find((driver) => driver.driverRef === race.first).driverName
    )
    secondName.text(
      drivers.find((driver) => driver.driverRef === race.second).driverName
    )
    thirdName.text(
      drivers.find((driver) => driver.driverRef === race.third).driverName
    )
    fastestLap.text(
      drivers.find((driver) => driver.driverRef === race.fastest).driverName +
        ", " +
        race.lap +
        "s"
    )
  })
}
