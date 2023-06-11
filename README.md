# F1 RACES VISUALIZED

This project showcases an interactive map of circuits used in Formula 1 races. It allows users to explore various circuits around the world, view circuit details, and see podium finishes for different years. Markers are placed on the circuit locations and pressing on the brings up a display showing the circuit layout and various circuit information.

The map is displayed using D3.js and TopoJson file for a world map. The circuit layouts are shown by changing the svg element to the custom made track svg file (https://github.com/f1laps/f1-track-vectors).

## Run the project

To run the project on your browser you will need a web server for fetching data through XMLHttpRequest. Easiest way to run it is opening it in Visual Studio Code and installing the Live Server extension or using any other available web server or browser extension.

## How to use

1. Zoom in or out on the map using the mouse scroll wheel or by clicking on the map.
2. Hover over a circuit marker to see a tooltip displaying the location of the circuit.
3. When a circuit is clicked, a panel will appear showing the circuit information and a circuit layout.
4. Additionally, all-time circuit records will be displayed, including the option to choose a statistic to be shown.
5. Use the race results button to show results by year on the selected circuit.
6. To return to the main view, click anywhere on the map or use the zoom controls to zoom out.
