//this code runs when the page loads -----------------------------------------------------------------
const width = window.innerWidth
const height = window.innerHeight

let zoomTransform = d3.zoomIdentity,
  coordinatesArray,
  markers,
  tooltip,
  selectedCircuit,
  buttonClicked = general

const circuitSvg = d3.select("#circuit-layout")
const graphSvg = d3.select(".general-info")
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
const dataSelect = document.querySelector("#data")
const fastestLap = d3.select("#flap")
const generalButton = d3.select("#general")
const resultsButton = d3.select("#results")
const modal = document.querySelector(".modal")
const modalX = document.querySelector(".close")
const modalClose = document.querySelector(".close-modal")
const infoButton = document.querySelector("#info-button")

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

//onclick events -------------------------------------------------------------------------------------
generalButton.on("click", function () {
  buttonClicked = general
  generalButton.classed("selected", true)
  resultsButton.classed("selected", false)
  updateDisplay()
})

resultsButton.on("click", function () {
  buttonClicked = results
  generalButton.classed("selected", false)
  resultsButton.classed("selected", true)
  updateDisplay()
})

map.on("click", function () {
  const currentScale = zoomTransform.k

  if (currentScale < 0.9) {
    map
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.scale(0.9))

    d3.select(".circuit-container").style("display", "none")
    d3.select(".select-main").style("display", "none")
    d3.select(".select-data").style("display", "none")
    d3.select(".graph-container").style("display", "none")
    d3.select(".results-container").style("display", "none")
  }
})

dataSelect.addEventListener("change", function () {
  updateStats()
})

infoButton.addEventListener("click", toggleModal)
modalX.addEventListener("click", toggleModal)
modalClose.addEventListener("click", toggleModal)

//loading the map -------------------------------------------------------------------------------------
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

//functions ------------------------------------------------------------------------------------------
function toggleModal() {
  modal.classList.toggle("show-modal")
}

//loads the marker svg and loads the circuit svg when the marker is clicked
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

//updates the marker size when the map is zoomed
function updateMarkerSize() {
  markers.attr("transform", function (d) {
    const symbolSize = Math.max(0.03 / zoomTransform.k, 0.01)
    const [x, y] = projection(d)
    const translateX = x - symbolSize / 2
    const translateY = y - symbolSize / 2
    return `translate(${translateX}, ${translateY}) scale(${symbolSize})`
  })
}

//updates the tooltip position and text when marker is hovered
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

//zoom out the map and show the circuit info when marker is clicked
function handleMarkerClick(event, d) {
  const index = coordinatesArray.findIndex((coord) => coord === d)

  tooltip.style("display", "none")

  map
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.scale(0.5))

  if (zoomTransform.k >= 0.9) showStats(index)
}

//updates the display when the general or results button is clicked
function updateDisplay() {
  if (buttonClicked === general) {
    d3.select(".results-container")
      .transition()
      .delay(200)
      .style("display", "none")
    d3.select(".graph-container")
      .transition()
      .delay(200)
      .style("display", "flex")
    d3.select(".select-data").transition().delay(200).style("display", "flex")
  } else if (buttonClicked === results) {
    d3.select(".graph-container")
      .transition()
      .delay(200)
      .style("display", "none")
    d3.select(".select-data").transition().delay(200).style("display", "flex")
    d3.select(".results-container")
      .transition()
      .delay(200)
      .style("display", "flex")
  }
  updateSelectionData()
}

//shows the circuit info
function showStats(index) {
  d3.json("circuits.json").then(function (circuits) {
    selectedCircuit = circuits[index]

    updateDisplay()

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
      .delay(200)
      .style("display", "flex")

    const selectedData = dataSelect.value
    if (buttonClicked === results)
      showPodium(selectedCircuit.races[`year${selectedData}`])
    else if (buttonClicked === general)
      showGraph(selectedCircuit.stats[selectedData])

    d3.select(".select-main").transition().delay(200).style("display", "flex")
  })
}

//function for loading the graph depending on the statistic selected
function showGraph(stat) {
  const margin = { top: 80, right: 30, bottom: 40, left: 120 },
    graphWidth = 600 - margin.left - margin.right,
    graphHeight = 450 - margin.top - margin.bottom

  d3.select(".general-info").selectAll("svg").remove()

  const svg = d3
    .select(".general-info")
    .append("svg")
    .attr("width", graphWidth + margin.left + margin.right)
    .attr("height", graphHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  const data = Object.entries(stat).map(([key, value]) => ({
    name: key,
    value: value,
  }))

  const highestXValue = d3.max(data, (d) => d.value) + 2
  const numTicks = Math.min(highestXValue, 10)
  const x = d3.scaleLinear().domain([0, highestXValue]).range([0, graphWidth])
  svg
    .append("g")
    .attr("transform", `translate(0, ${graphHeight})`)
    .call(d3.axisBottom(x).ticks(numTicks).tickFormat(d3.format(".0f")))
    .selectAll("text")
    .attr("transform", "translate(3,0)")
    .attr("font-size", "11px")
    .style("text-anchor", "end")

  const y = d3
    .scaleBand()
    .range([0, graphHeight])
    .domain(data.map((d) => d.name))
    .padding(0.4)
  svg.append("g").call(d3.axisLeft(y)).attr("font-size", "12px")

  svg
    .selectAll("myRect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", (d) => x(d.value))
    .attr("height", y.bandwidth())
    .attr("fill", "#950101")

  svg
    .selectAll(".bar-label")
    .data(data)
    .join("text")
    .attr("class", "bar-label")
    .attr("x", (d) => x(d.value) + 5)
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .text((d) => d.value)
    .attr("dy", "0.35em")
    .attr("font-size", "12px")
    .attr("fill", "black")

  svg
    .append("text")
    .attr("x", graphWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text("Most wins on this circuit")
    .attr("font-size", "20px")
    .attr("id", "graph-title")

  svg
    .append("text")
    .attr("x", graphWidth / 2)
    .attr("y", graphHeight + margin.bottom)
    .attr("text-anchor", "middle")
    .text("Wins")
    .attr("font-size", "18px")
    .attr("id", "graph-xlabel")

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -graphHeight / 2)
    .attr("y", -margin.left + 25)
    .attr("text-anchor", "middle")
    .text("Driver")
    .attr("font-size", "18px")
}

//function for loading the podium depending on the year selected
function showPodium(race) {
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

//updates the data selection options depending on the button clicked
function updateSelectionData() {
  if (buttonClicked === results) {
    const years = Object.keys(selectedCircuit.races)
    dataSelect.innerHTML = ""
    d3.select("#dataLabel").text("Select a race year:")
    years.forEach((year) => {
      const option = document.createElement("option")
      option.value = year.substring(4)
      option.innerHTML = year.substring(4)
      dataSelect.appendChild(option)
    })
    updateStats()
  } else if (buttonClicked === general) {
    const stats = Object.keys(selectedCircuit.stats)
    dataSelect.innerHTML = ""
    d3.select("#dataLabel").text("Select a statistic:")
    stats.forEach((stat) => {
      const option = document.createElement("option")
      option.value = stat
      option.innerHTML = stat
      dataSelect.appendChild(option)
    })
    updateStats()
  }
}

//updates the graph or podium depending on the statistic or year clicked
function updateStats() {
  const selectedData = dataSelect.value

  if (buttonClicked === results)
    showPodium(selectedCircuit.races[`year${selectedData}`])
  else if (buttonClicked === general)
    showGraph(selectedCircuit.stats[selectedData])

  if (selectedData === "wins") {
    d3.select("#graph-title").text("Most wins on this circuit")
    d3.select("#graph-xlabel").text("Wins")
  } else if (selectedData === "poles") {
    d3.select("#graph-title").text("Most pole positions on this circuit")
    d3.select("#graph-xlabel").text("Pole positions")
  } else if (selectedData === "podiums") {
    d3.select("#graph-title").text("Most podiums on this circuit")
    d3.select("#graph-xlabel").text("Podiums")
  }
}
