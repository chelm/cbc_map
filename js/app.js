function App( path ){

  var _app = {
    funders: [],
    years: [],
    types: []
  };

  function init(){
    _app.vis = d3.select('#vis');

    map();

    d3.csv( path, function(d) {
      if (_app.years.indexOf(+d.year) == -1) _app.years.push(+d.year);
      if (_app.funders.indexOf(d.funder) == -1) _app.funders.push(d.funder);
      if (_app.types.indexOf(d.type) == -1) _app.types.push(d.type);

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
      return g;
    }, function(error, rows) {
      _app.grants = rows;
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
          .style("id", function(d){
            //console.log('county', d);
            return d.properties.COUNTY;
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
        .text(function(d){ return d});

    /*control_div.append('div')
      .attr('id', 'years')
      //.text('Years')
      .selectAll('div')
      .data(_app.years)
      .enter().append('div')
        .attr('class', 'year')
        .text(function(d){ return d});*/
  
  }

  init();
  return _app;

}
