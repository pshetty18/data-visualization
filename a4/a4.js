function extractJobsPct(jobData, year, occCode, number) {
    var res = jobData.filter(
	function(d) { return ((year == null || d.year == year) &&
			      (occCode == null || d.occ_code == occCode)); });
    res = res.sort(function(a,b) {
	return d3.descending(+a.jobs_1000,+b.jobs_1000);
    });
    if (number) {
	return res.slice(0,number);
    } else {
	return res;
    }
}

var barW = 500,
    barH = 300,
    barMargin = {top: 20, bottom: 120, left: 100, right: 20},
    barX = d3.scaleBand().padding(0.1),
    barY = d3.scaleLinear(),
    barXAxis = null;
    animateDuration = 1000;
    animateDelay = 50;

function createBars(divId, jobData, year, occCode) {
    var svg = d3.select(divId).append("svg")
	.attr("width", barW+barMargin.left+barMargin.right)
	.attr("height", barH+barMargin.top+barMargin.bottom)
	
	.append("g")
	.attr("class", "main")
	.attr("transform",
	      "translate(" + barMargin.left + "," + barMargin.top + ")")

    var csData = extractJobsPct(jobData, year, occCode, 18);

    barX.range([0,barW])
	.domain(csData.map(function(d) { return d.area_title; }));
    barY.range([barH,0])
	.domain([0,d3.max(extractJobsPct(jobData, null, occCode),
			  function(d) { return +d.jobs_1000; })]);

    svg.selectAll("rect")
	.data(csData)
	.enter().append("rect")
	.attr("class", "bar")

	.attr("x", function(d) { return barX(d.area_title); })
	.attr("y", function(d) { return barY(+d.jobs_1000); })
	.attr("width", barX.bandwidth())
	.attr("height", function(d) { return barH - barY(+d.jobs_1000); })

    barXAxis = d3.axisBottom(barX);

    svg.append("g")
	.attr("transform", "translate(0," + barH +")")
	.attr("class", "x axis")
	.call(barXAxis)

    var barYAxis = d3.axisLeft(barY);

    svg.append("g")
	.attr("class", "y axis")
	.call(barYAxis)

    svg.append("g")
	.attr("transform", "translate(-30," + (barH/2) + ") rotate(-90)")
	.append("text")
	.style("text-anchor", "middle")
	.text("Jobs Per 1000")

    svg.append("text")
	.attr("x", barW/2)
	.attr("y", barH + 115)
	.text("State")
}

function updateBars(divId, jobData, year) {
    
    svg.transition()
    	.attr("height", function (d){
    		return barX(d);
    	})
    	.attr("y", function (d){
    		return barH - barX(d);
    	})
    	.duration(animateDuration)
    	.delay(function(d, i){
    		return i * animateDelay;
    	})
    	.ease("easeLinear")
    
}

function getStateRankings(jobData, occCode) {
    
    var stateRankings = d3.sort(function (d, jobData){
    	return d < jobData ? -1 : d > jobData ? 1 : d >= jobData ? 0 : NaN;
    })
    	.nest()
    		.key(function (d){
    		return d.occCode;
    	})
    		.entries(jobData);
}

function createBrushedVis(divId, usMap, jobData, year) {
    var jobData = jobData.filter(
	function(d) { return (+d.year == year); });
    
    var width = 600,
	height = 400;

    var svg = d3.select(divId).append("svg")
	.attr("width", width)
	.attr("height", height);

    var projection = d3.geoAlbersUsa()
	.fitExtent([[0,0],[width,height]], usMap);

    var path = d3.geoPath()
	.projection(projection);

    var rankings = getStateRankings(jobData, "15-0000");
    var color = d3.scaleSequential(d3.interpolateViridis).domain([22,0]);
    
    svg.append("g")
	.selectAll("path")
	.data(usMap.features)
	.enter().append("path")
	.attr("d", path)
	.attr("fill",
	      function(d) { return color(rankings[d.properties.name]); })
	.attr("class", "state-boundary")
	.classed("highlight", false)
    
    var bWidth = 400,
	bHeight = 400,
	midX = 200;
    
    var allJobs = d3.nest()
	.key(function(d) { return d["occ_code"]; })
	.key(function(d) { return d["occ_title"]; })
	.rollup(function(v) {
	    return v.reduce(function(s,d) {
		if (!+d.tot_emp) { return s; } return s + +d.tot_emp; },0); })
	.entries(jobData)
	.sort(function(a,b) { return d3.descending(+a.values[0].value, +b.values[0].value); })
    
    var barSvg = d3.select(divId).append("svg")
	.attr("width", bWidth)
	.attr("height", bHeight)
	.style("vertical-align", "bottom")
    
    var y = d3.scaleBand().padding(0.1).range([0,bHeight]).domain(allJobs.map(function(d) { return d.values[0].key; }));
    var x = d3.scaleLinear().range([0,bWidth-midX]).domain([0,d3.max(allJobs, function(d) { return d.values[0].value; })]);
    
    var bars = barSvg.selectAll(".bar").data(allJobs)
	.enter().append("g")
	.attr("transform",
	      function(d) { return "translate(0," + y(d.values[0].key) + ")";})
	.attr("class", "bar")
    
    function jobMouseEnter() {

		.on("mouseover", function (d){
			.transition()
			.style("opacity", 1)
			.html(d)
			.attr("fill", "blue")
			d3.select(this).style("opacity", 0.5)
		})
		.on("mouseout", function(d){
			.transition()
			.style("opacity", 0)
			d3.select(this).style("opacity", 1)
		})
    }
    
    bars.append("rect")
	.attr("x", midX)
	.attr("y", 0)
	.attr("width", function(d) { return x(d.values[0].value); })
	.attr("height", y.bandwidth())
	.classed("highlight", function(d) { return d.key == '15-0000'; })
	.on("mouseover", jobMouseEnter)

    bars.append("text")
    	.attr("x", midX - 4)
    	.attr("y", 12)
    	.style("text-anchor", "end")
    	.text(function(d) { var label = d.values[0].key.slice(0,-12);
			    if (label.length > 33) {
				label = label.slice(0,30) + "...";
			    }
			    return label; });
}

function processData(errors, usMap, jobsData) {
    console.log("Errors", errors)
    createBars("#bars", jobsData, 2012, "15-0000");
    updateBars("#bars", jobsData, 2016);

    createBrushedVis("#brushed", usMap, jobsData, 2016);    
}

d3.queue()
    // use these two files
    .defer(d3.json, "http://www.cis.umassd.edu/~dkoop/dsc530-2017sp/a4/us-states.json")
    .defer(d3.csv, "http://www.cis.umassd.edu/~dkoop/dsc530-2017sp/a4/occupations.csv")
    // or these HTTPS versions
    //.defer(d3.json, "https://cdn.rawgit.com/dakoop/69d42ee809c9e7985a2ff7ac77720656/raw/6707c376cfcd68a71f59f60c3f4569277f20b7cf/us-states.json")
    //.defer(d3.csv, "https://cdn.rawgit.com/dakoop/69d42ee809c9e7985a2ff7ac77720656/raw/6707c376cfcd68a71f59f60c3f4569277f20b7cf/occupations.csv")
    .await(processData);