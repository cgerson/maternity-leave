var sample_data = {
    "key": "all_industries",
    "median": 6,
    "values": [
        {
            "key": "Tech",
            "median": 8.5,
            "values": [
                {
                    "key": "Tech: Software",
                    "median": 8,
                    "values": [
                        {"key": "Company 1", "median": 7},
                        {"key": "Company 2", "median": 9}
                        ]
                },
                {
                    "key": "Tech: Media",
                    "median": 9,
                    "values": [
                        {"key": "Company 3", "median": 8},
                        {"key": "Company 4", "median": 10}
                        ]
                }
            ]
        },
        {
            "key": "Pharma",
            "median": 9,
            "values": [
                {"key": "Pharma: 1", "median": 10},
                {"key": "Pharma: 2", "median": 9}
            ]
        }
    ]
}

var margin = {top: 50, right: 100, bottom: 30, left: 300},
    width = 1000 - margin.left - margin.right,
    height = 5000
    //height = 5000 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, 52]).nice()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height,0]);

var barHeight = 15;

var color = d3.scale.ordinal()
    .range(["#a943b7","#ccc"]);

var duration = 400,
    delay = 15;

var partition = d3.layout.partition()
    .value(function(d) { return d.median; })
    .children(function(d) { return d.values; })
    .sort(function(a,b) {return b.median - a.median || d3.ascending(a.key,b.key); }); //sort first by median, then alphabetically
    
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

/**
var input = d3.select("#checkBoxDiv")
    .append("input")
    .attr("type","checkbox")
    .style("position","relative")
    .on("change", sort);

var inputLabel = d3.select("#checkBoxDiv")
    .append("text")
    .attr("class","label")
    .style("position","relative")
    .text("Sort Alphabetically");
**/

d3.select("#input").on("change", sort);

/**
d3.select("#container")
    .append("svg:svg")
    .attr("width", 2000)//containerWidth)
      .attr("height", 2000);//containerHeight);
**/

var svg_width = width + margin.left + margin.right;
var svg_height = height + margin.top + margin.bottom;

var svg = d3.select("#container").append("svg")
    .attr("viewBox", "0,0,"+svg_width+",4000")
    //.attr("width", svg_width)
    //.attr("height", svg_height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", up);

svg.append("g")
    .attr("class", "x axis");

svg.append("g")
    .attr("class", "y axis")
  .append("line")
    .attr("y1", "100%");

// Add the text label for the x axis
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", 20 - margin.top)
    .text("(Number of weeks of paid maternity leave)");

// Instruction text: how to interact.
// Ideally shouldn't need instructions
/**
svg.append("text")
    .attr("class", "instructions")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 20 - margin.top)
        .text("Click on an industry name to find company-level information. Click on background to return to previous view.");
**/

var rootData;

var file_name = "ML_data_paid_median.json";

d3.json(file_name, function(error, data) {
    if (error) throw error;

    rootData = data; // save root data object
    
    partition.nodes(data);
    x.domain([0, 52]).nice();
    
    down(data, 0);
});

function sort(){
    console.log(this.checked);

    var sortalpha = function(a,b) {return d3.descending(b.key, a.key);};
    var sortmedian = function(a,b) {return b.median - a.median;};

    // Grab current data object
    // This is hacky
    data = svg.selectAll("rect")[0][0].__data__;

    partition.sort(this.checked ? sortalpha : sortmedian);
    partition.nodes(rootData); // sort all data from root

    down(data, 0); // draw starting at current data object 
}

function down(d, i) { 
    
    if (!d.children || this.__transition__) return;
    var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Exit group label ?
    /**
    var exitLabel = svg.selectAll(".industryType")
        .attr("class", "exit");
**/

    //Median line
    var exitMedianLine = svg.selectAll(".medianLine")
        .attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it. 
 exit.selectAll("rect").filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
    var enter = bar(d)
    //.attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
      .attr("transform", stack(i))
        .style("opacity", 1);

  // Have the text fade-in, even though the bars are visible.
  // Color the bars as parents; they will fade to children if appropriate.
  enter.select("text").style("fill-opacity", 1e-6);
    enter.select("rect").style("fill", color(true));

    d3.select("h1.title")
        .text("PAID MATERNITY LEAVE INFORMATION: "+d.key.toString().toUpperCase());

    /**
    // Industry name
   svg.select("g")
    .append("text")
    .attr("class", "industryType")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 50 - margin.top)
        .text(d.key.toString().toUpperCase());
**/

  // Update the x-scale domain.
  //x.domain([0, d3.max(d.children, function(d) { return d.median; })]).nice();
    
    // Update the x-axis.
    // why do I need to update if not changing domain ???
  svg.selectAll(".x.axis").transition()
      .duration(duration)
        .call(xAxis);

  // Transition entering bars to their new position.
  var enterTransition = enter.transition()
      .duration(duration)
      //.duration(0)
    .delay(function(d, i) { return i * delay; })
    //.delay(function(d, i) { return i; })
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; });

  // Transition entering text.
  enterTransition.select("text")
      .style("fill-opacity", 1);
    
  // Transition entering rects to the new x-scale.
  enterTransition.select("rect")
        .attr("width", function(d) { return x(d.median); })
      .style("fill", function(d) { return color(!!d.children); });

  // Transition exiting bars to fade out.
  var exitTransition = exit.transition()
      .duration(duration)
      .style("opacity", 1e-6)
      .remove();
    
    //exitLabel.transition().duration(0).remove();

    exitMedianLine.transition().duration(1).remove();

    // Transition exiting bars to the new x-scale.
  exitTransition.selectAll("rect")
        .attr("width", function(d) { return x(d.median); });
    
  // Rebind the current node to the background.
  svg.select(".background")
        .datum(d)
    .transition()
        .duration(end);

    d.index = i;

    // Median line
    drawMedian(d);
}

function up(d) {
    
    if (!d.parent || this.__transition__) return;
    
    var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Exit group label ?
    /**
    var exitLabel = svg.selectAll(".industryType")
        .attr("class", "exit");
**/

    //Median line
    var exitMedianLine = svg.selectAll(".medianLine")
        .attr("class", "exit");

    // Enter the new bars for the clicked-on data's parent.
    // 1.2 adds space between bars
  var enter = bar(d.parent)
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
      .style("opacity", 1e-6);

  // Color the bars as appropriate. NO
  // Exiting nodes will obscure the parent bar, so hide it.
    enter.select("rect")
        .style("fill", function(d) { return color(!!d.children); });
        //.filter(function(p) { return p === d; })
    //.style("fill-opacity", 1e-6);

    /**
    svg.select("g")
    .append("text")
    .attr("class", "industryType")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 50 - margin.top)
        .text(d.parent.key.toString().toUpperCase());
    **/

    d3.select("h1.title")
        .text("PAID MATERNITY LEAVE INFORMATION: "+d.parent.key.toString().toUpperCase());
    
  // Update the x-scale domain.
    //x.domain([0, d3.max(d.parent.children, function(d) { return d.value/d.count; })]).nice();

    // Update the x-axis.
  svg.selectAll(".x.axis").transition()
     .duration(duration)
        .call(xAxis);
    
  // Transition entering bars to fade in over the full duration.
  var enterTransition = enter.transition()
      .duration(end)
      .style("opacity", 1);

  // Transition entering rects to the new x-scale.
    // When the entering parent rect is done, make it visible!

  enterTransition.select("rect")
        .attr("width", function(d) { return x(d.median); })
      .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

  // Transition exiting bars to the parent's position.
    var exitTransition = exit.selectAll("g")
        .transition()
    .duration(duration)
    //.duration(0)
    .delay(function(d, i) { return i * delay; })
    //.delay(function(d, i) { return 0; })
        //.attr("transform", stack(d.index));
        .attr("transform",function(d, i) { return "translate(0," + barHeight * d.index * 1.2 + ")"; });

  // Transition exiting text to fade out.
  exitTransition.select("text")
      .style("fill-opacity", 1e-6);

    // Transition exiting rects to the new scale and fade to parent color.
    
  exitTransition.select("rect")
        .attr("width", function(d) { return x(d.median); })
      .style("fill", color(true));
    
  // Remove exiting nodes when the last child has finished transitioning.
    exit.transition()
    .duration(end)
    //.duration(duration)
        .remove();

    
    //exitLabel.transition().duration(0).remove();

    exitMedianLine.transition().duration(1).remove();
    
  // Rebind the current parent to the background.
  svg.select(".background")
        .datum(d.parent)
        .transition()
       // .duration(duration);
        .duration(end);

    // Median line
    drawMedian(d.parent);
}

// Creates a set of bars for the given data node, at the specified index.
function bar(d) {
    
  var bar = svg.insert("g", ".y.axis")
      .attr("class", "enter")
      .attr("transform", "translate(0,5)")
    .selectAll("g")
      .data(d.children)
    .enter().append("g")
      .style("cursor", function(d) { return !d.children ? null : "pointer"; })
      .on("click", down);

    bar.append("text")
        .attr("class", "label")
      .attr("x", -6)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
        .text(function(d) { return d.key; });

  bar.append("rect")
        .attr("width", function(d) { return x(d.median); })
        .attr("height", barHeight);

  return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {

  var x0 = 0;
  return function(d) {
      var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
      x0 += x(d.median);
      //x0 = x(0)
      console.log("stack");
    return tx;
  };

}

// Draw a vertical line at median weeks of leave within industry
function drawMedian(d){

    var m = d3.median(d.children, function(d) { return d.median; });
    var l = d.children.length;

    console.log("median", m);

    var median =
        svg.select("g")
        .append("line")
        .attr("class", "medianLine")
        .style("stroke", "black")
        .attr("x1", x(m))
        .attr("y1", 0)
        .attr("x2", x(m))
        .attr("y2", l*barHeight*1.2);

    return median;
}
