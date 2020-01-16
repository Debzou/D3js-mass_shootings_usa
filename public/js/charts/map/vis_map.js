//Width and height of map
var width = 960;
var height = 500;

// Map's donut params
let dMapWidth = 610;
let dMapHeight = 200;
let dColors = ["#390B06", "#6F332D", "#17193C", "#647375", "#a3bcbf"];
let mapDonut = new Donut(dMapWidth, dMapHeight, "#targetPlaces", "mDonutTooltip");

let dMapCategories = [
	{ label: "Home and neighborhood", sub: ["Residential home/Neighborhood, Retail/Wholesale/Services facility", "Residential home/Neighborhood"], count: 0 },
	{ label: "School and educationnal", sub: ["Primary school", "Secondary school", "College/University/Adult education"], count: 0 },
	{ label: "Public facilities", sub: ["Medical/Care", "Public transportation", "Park/Wilderness", "Place of worship", "Restaurant/Cafe", "Retail/Wholesale/Services facility", "Entertainment Venue", "Street/Highway"], count: 0 },
	{ label: "Government/military facilities", sub: ["Government facility", "Military facility"], count: 0 },
	{ label: "Work place", sub: ["Company/Factory/Office"], count: 0 }
];

//Create SVG element and append map to the SVG
var svg = d3.select("#map")
	.attr("width", width)
	.attr("height", height)
	.append("g");

// Append Div for tooltip to SVG
var div = d3.select("body")
	.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)


// APPEND INFORMATIONS FIELDS IN THE TOOLTIP

// VICTIMS
let tooltipVictims = div.append("div")
	.attr("id", "victims");

tooltipVictims.append("div")
   .attr("id", "killed");

tooltipVictims.append("div")
   .attr("id", "injured");

// DRAWING LINE
let tooltipLine = div.append("hr")
	.attr("id", "separator");

// CONTEXT
let tootipcontext = div.append("div")
	.attr("id", "context");

tootipcontext.append("div")
   .attr("id", "title");

tootipcontext.append("div")
   .attr("id", "date");

// DESCRIPTION
div.append("div")
   .attr("id", "description");



// D3 Projection
var projection = d3.geo.albersUsa()
	.translate([width / 2, height / 2])    // translate to center of screen
	.scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
	.projection(projection);  // tell path generator to use albersUsa projection


// Define linear scale for output
var color = d3.scale.linear()
	.range(["rgb(53,204,204)", "rgb(51,107,107)", "rgb(51,51,51)", "rgb(51,0,0)"]);

var legendText = ["150+", "100-150", "50-100", "0-50"];



// Load in my states data!
d3.dsv(';')("datasets/mass-shootings-in-america.csv", function (data) {
	var expensesCount = d3.nest()
		.key(function (data) { return data.State; })
		.rollup(function (v) {
			return {
				Total_Number_of_Victims: d3.sum(v, function (e) { return e.Total_Number_of_Victims; }),
				r: reducevalue(d3.sum(v, function (e) { return e.Total_Number_of_Victims; }))
			};
		}).entries(data);
	// console.log(JSON.stringify(expensesCount));
	color.domain([0, 1, 2, 3]); // setting the range of the input data

	// Load GeoJSON data and merge with states data
	d3.json("datasets/us-states.json", function (json) {

		// Loop through each state data value in the .csv file
		for (var i = 0; i < expensesCount.length; i++) {

			// Grab State Name
			var dataState = expensesCount[i].key;

			// Grab data value 
			var dataValue = expensesCount[i].values.r;

			// Find the corresponding state inside the GeoJSON
			for (var j = 0; j < json.features.length; j++) {
				var jsonState = json.features[j].properties.name;

				if (dataState == jsonState) {

					// Copy the data value into the JSON
					json.features[j].properties.r = dataValue;

					// Stop looking through the JSON
					break;
				}
			}
			//console.log(data)
		}

		// Bind the data to the SVG and create one path per GeoJSON feature
		svg.selectAll("path")
			.data(json.features)
			.enter()
			.append("path")
				.attr("d", path)
				.style("stroke", "#fff")
				.style("stroke-width", "1")
				.style("fill", function (d) {
					// Get data value
					var value = d.properties.r;
					// console.log(value);
					if (value) {
						return color(value);
					} else {
						return color(0);
					}
				})

			// MOUSEOVER
			.on("mouseover", function (d) {

			})

			// ON CLICK
			.on("click", function (d) {
				console.log(d.properties.name);
				// GENERATE A NEW DONUT
				let stateData = getStateData(d.properties.name, data);
				mapDonut.clear();
				mapDonut.generateDonut(dColors, dMapCategories, stateData, true);
			});
		// MOUSEOUT            
		// .on("mouseout", function(d) {
		// 	mapDonut.clear();
		// });


		d3.dsv(';')("datasets/mass-shootings-in-america.csv", function (data) {

			svg.selectAll("circle")
				.data(data)
				.enter()
				.append("circle")
				.attr("cx", function (d) {
					//console.log([d.Longitude, d.Latitude]);
					return projection([d.Longitude, d.Latitude])[0];
				})
				.attr("cy", function (d) {
					return projection([d.Longitude, d.Latitude])[1];
				})
				.attr("r", function (d) {
					return Math.sqrt(d.Total_Number_of_Victims) * 2;
				})
				.style("fill", "rgb(217,91,67)")
				.style("opacity", 0.85)


				// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
				// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
				.on("mouseover", function (d) {
					div.transition()
						.duration(200)
						.style("opacity", 1)
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
					// FILL INFORMATIONS ABOUT THE SHOOTING
					d3.select("#killed")
					  .html("<b><font color=\"red\">" + Math.floor(d.Number_of_Victim_Fatalities) + "</font></b>" + " killed");

					d3.select("#injured")
					  .html("<b><font color=\"red\">" + Math.floor(d.Number_of_Victims_Injured) + "</font></b>" + " injured");

					d3.select("#title")
						.text(d.Title);

					d3.select("#date")
						.text(d.Date_detailed);

					d3.select("#description")
						.text(d.Description);

				})

				
				// fade out tooltip on mouse out               
				.on("mouseout", function (d) {
					div.transition()
						.duration(500)
						.style("opacity", 0);
				});
		});

		// Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
		var legend = d3.select("#legend")
			.attr("class", "legend")
			.attr("width", 140)
			.attr("height", 200)
			.selectAll("g")
			.data(color.domain().slice().reverse())
			.enter()
			.append("g")
			.attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", color);

		legend.append("text")
			.data(legendText)
			.attr("x", 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.text(function (d) { return d; });
	});

});
