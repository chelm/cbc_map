function App( path ){

  var _app = {
    funders: [],
    years: [],
    types: [],
    counties: []
  };

  function init(){
    _app.vis = d3.select('#vis');
    _app.cat20 = d3.scale.category20();

    _app.data = {};

    d3.csv( path, function(d) {
      if (_app.years.indexOf(+d.year) == -1) _app.years.push(+d.year);
      if (_app.funders.indexOf(d.funder) == -1) _app.funders.push(d.funder);
      if (_app.types.indexOf(d.type) == -1) _app.types.push(d.type);
      if (_app.counties.indexOf(d.county.toLowerCase()) == -1) _app.counties.push(d.county.toLowerCase());

      var g = {
        year: +d.year,
        funder: d.funder,
        nonprofit: d.nonprofit,
        amount: +d.amount,
        city: d.city,
        county: d.county,
        region: d.region,
        type: d.type, 
        category: d.category
      };

      // structure data by year and donor
      if ( !_app.data[g.year] ) _app.data[g.year] = {};
      if ( !_app.data[g.year][g.funder] ) _app.data[g.year][g.funder] = [];
      _app.data[g.year][g.funder].push( g );

      return g;

    }, function(error, rows) {
      _app.grants = rows;
      _app.selected = 'all';
      
      initChart();
      map();
      controls();
    });

  }

  function map(){
    var projection = d3.geo.mercator()
      .center([-100, 37.5])
      .scale(3000);
    var path = d3.geo.path().projection(projection);

    d3.json("data/co_counties.json", function( data ){
      var counties = topojson.object(data, data.objects.counties);

      var vis = d3.select("#map").append("svg")
        .attr("width",400)
        .attr("height",300);

      vis.append("g")
        .selectAll("path")
        .data(counties.geometries)
        .enter().append("path")
          .attr("d", path)
          .attr("class", "county")
          .style('fill', function(d){ if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) return _app.cat20(d.properties.COUNTY); })
          .attr("id", function(d){
            //console.log('county', d);
            return d.properties.COUNTY;
          })
          .on('mouseover', function(){
            _app.showCounty( this.id.toLowerCase() );
          })
          .on('mouseout', function(){
            d3.select('#county_info').style('display', 'none');        
          }) 
    })
  }


  function controls(){

    var control_div = _app.vis.select('#controls')

    control_div.append('div')
      .attr('id', 'funders')
      //.text('Funders')
      .selectAll('div')
      .data(_app.funders)
      .enter().append('div')
        .attr('class', 'funder')
        .attr('id', function(d){ return d.replace(/ /g, '_'); })
        .style('background', function(d){ return _app.cat20(d); })
        .text(function(d){ return d})
        .on('click', function(){
          var f = d3.select(this).data()[0];

          if (_app.selected == 'all') {
            _app.selected = []; 
          }

          if ( _app.selected.indexOf(f) == -1 ) { 
            _app.selected.push( d3.select(this).data()[0] );
          } else {
            _app.selected.splice(_app.selected.indexOf(f),1);
          }

          _app.chart();
        });

    /*control_div.append('div')
      .attr('id', 'years')
      //.text('Years')
      .selectAll('div')
      .data(_app.years)
      .enter().append('div')
        .attr('class', 'year')
        .text(function(d){ return d});*/
  
  }

  _app.chart = function(){
    var funders = (_app.selected == 'all') ? _app.funders : _app.selected;

    if ( funders != 'all' ) {
      d3.selectAll('.funder').style('background', '#aaa');
      funders.forEach(function(f){
        console.log(f, d3.select('#'+f.replace(/ /g, '_')));
        d3.select('#'+f.replace(/ /g, '_')).style('background', function(d){ return _app.cat20(f);})
      });
    }

    // build charting data
    var chart_data = {};
    for ( var yr in _app.data ){
      if ( !chart_data[yr] ) chart_data[yr] = {};
      for ( var funder in _app.data[yr] ){
        var index = funders.indexOf(funder);
        if ( index >= 0 ){
          chart_data[ yr ][ funder ] = _app.data[ yr ][ funder ].length;
        }
      }
    }

    console.log(chart_data)

    


  }

  initChart = function(){

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 660 - margin.left - margin.right,
      height = 150 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);
    
    var y = d3.scale.linear()
        .rangeRound([height, 0]);
    
    var color = d3.scale.ordinal()
        .domain(_app.funders)
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        //.tickFormat(d3.format(".2s"));
    
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   /* data.forEach(function(d) {
      var y0 = 0;
      d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
      d.total = d.ages[d.ages.length - 1].y1;
    });*/
  
    //data.sort(function(a, b) { return b.total - a.total; });
  
    x.domain(_app.years);
    y.domain([0, 25]);
  
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
  
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Population");
  
    /*var state = svg.selectAll(".state")
        .data(data)
      .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x(d.State) + ",0)"; });
  
    state.selectAll("rect")
        .data(function(d) { return d.ages; })
      .enter().append("rect")
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.y1); })
        .attr("height", function(d) { return y(d.y0) - y(d.y1); })
        .style("fill", function(d) { return color(d.name); });*/


   /* var n = 4, // number of layers
    m = 58, // number of samples per layer
    stack = d3.layout.stack(),
    layers = stack(d3.range(n).map(function() { return bumpLayer(m, .1); })),
    yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
    yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

    var x = d3.scale.ordinal()
      .domain([2009, 2010, 2011, 2012])
      .rangeRoundBands([0, 600], .08);

    var y = d3.scale.linear()
      .domain([0, 1])
      .range([100, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var vis = d3.select("#chart").append("svg")
        .attr("width",700)
        .attr("height",200);  

    vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + 100 + ")")
      .call(xAxis);

    vis.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    var layer = vis.selectAll(".layer")
      .data( layers )
    .enter().append("g")
      .attr( "class", "layer" )
      .style( "fill", function(d, i) { ;return '#08c'; });*/

  }


  _app.showCounty = function( name ){
    var el = d3.select('#county_info');
    el.style('display', 'block');

    d3.select('#county_name').text(name + ' County')

  }

  init();
  return _app;

}
