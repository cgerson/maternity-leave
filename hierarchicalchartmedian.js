var data_median = {
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

var margin = {top: 80, right: 120, bottom: 0, left: 270},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var barHeight = 15;

var color = d3.scale.ordinal()
    .range(["#a943b7","#ccc"]);

var duration = 650,
    delay = 5;

var partition = d3.layout.partition()
    .value(function(d) { return d.median; })
    .children(function(d) { return d.values; })
    .sort(function(a,b) {return b.median - a.median;});

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", up);

svg.append("g")
    .attr("class", "x axis");

// Add the text label for the x axis
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", 50 - margin.top)
    .text("(Number of weeks of maternity leave)");

// Instruction text: how to interact.
// Ideally shouldn't need instructions
svg.append("text")
    .attr("class", "instructions")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 20 - margin.top)
        .text("Click on an Industry name for more information. Click on background to return to previous view.");

svg.append("g")
    .attr("class", "y axis")
  .append("line")
    .attr("y1", "100%");

var file_name = "ML_data_paid_median.json";

d3.json(file_name, function(error, data) {
    console.log(data);

    if (error) throw error;

    //filter data here
    //remove values where count = 0
    
    partition.nodes(data);
    x.domain([0, 52]).nice();
    down(data, 0);
    

});


function down(d, i) {
    
    if (!d.children || this.__transition__) return;
  var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Exit group label ?
    var exitLabel = svg.selectAll(".industryType")
        .attr("class", "exit");

    //Mean line
    var exitMeanLine = svg.selectAll(".meanLine")
        .attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it. NO
 exit.selectAll("rect").filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
  var enter = bar(d)
      .attr("transform", stack(i))
      .style("opacity", 1);

  // Have the text fade-in, even though the bars are visible.
  // Color the bars as parents; they will fade to children if appropriate.
  enter.select("text").style("fill-opacity", 1e-6);
    enter.select("rect").style("fill", color(true));

    // Industry name
   svg.select("g")
    .append("text")
    .attr("class", "industryType")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 50 - margin.top)
        .text(d.key.toString());

  // Update the x-scale domain.
  //x.domain([0, d3.max(d.children, function(d) { return d.value/d.count; })]).nice();

    // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to their new position.
  var enterTransition = enter.transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
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

    
    exitLabel.transition().duration(1).remove();

    exitMeanLine.transition().duration(1).remove();

    
    // Transition exiting bars to the new x-scale.
  exitTransition.selectAll("rect")
        .attr("width", function(d) { return x(d.median); });
    
  // Rebind the current node to the background.
  svg.select(".background")
      .datum(d)
    .transition()
      .duration(end);

  d.index = i;
}

function up(d) {
    
    if (!d.parent || this.__transition__) return;
    
    var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Exit group label ?
    var exitLabel = svg.selectAll(".industryType")
        .attr("class", "exit");

    //Mean line
    var exitMeanLine = svg.selectAll(".meanLine")
        .attr("class", "exit");

    
  // Enter the new bars for the clicked-on data's parent.
  var enter = bar(d.parent)
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
      .style("opacity", 1e-6);

  // Color the bars as appropriate. NO
  // Exiting nodes will obscure the parent bar, so hide it.
    enter.select("rect")
        .style("fill", function(d) { return color(!!d.children); })
        .filter(function(p) { return p === d; })
    .style("fill-opacity", 1e-6);

    svg.select("g")
    .append("text")
    .attr("class", "industryType")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 50 - margin.top)
        .text(d.parent.key.toString());

    
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
  var exitTransition = exit.selectAll("g").transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", stack(d.index));

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
        .remove();

    exitLabel.transition().duration(1).remove();

    exitMeanLine.transition().duration(1).remove();
    
  // Rebind the current parent to the background.
  svg.select(".background")
      .datum(d.parent)
    .transition()
      .duration(end);
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
      .attr("x", -6)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
        .text(function(d) { return d.key; });

  bar.append("rect")
        .attr("width", function(d) { return x(d.median); })
        .attr("height", barHeight);

    console.log("bar function");

  return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {
  var x0 = 0;
  return function(d) {
      var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
      x0 += x(d.median);
      console.log("stack");
    return tx;
  };
}
