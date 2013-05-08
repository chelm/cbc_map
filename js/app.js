function App( path ){

  var _app = {
    funders: ['View All'],
    years: [],
    types: [],
    counties: [],
    county_agg: {}
  };

  function init(){
    _app.vis = d3.select('#vis');
    _app.cat20 = d3.scale.category20()
      .range(['#7ED3EO', '#00B3F7' ,'#007DC5', '#0054A6', '#B2D235', '#66B345', '#00874B', '#1B5A41', '#937CB9', '#7159A6', '#4D3F99', '#362A86', '#FFDF4F', '#E7BA48', '#E29844', '#DD6E35']);
    _app.orange = d3.scale.quantile()
      .domain([0, 275])
      .range(["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"])

    _app.data = {};

    d3.csv( path, function(d) {
      if (_app.years.indexOf(+d.year) == -1) _app.years.push(+d.year);
      if (_app.funders.indexOf(d.funder) == -1) _app.funders.push(d.funder);
      if (_app.types.indexOf(d.type) == -1) _app.types.push(d.type);
      
      var county = d.county.toLowerCase();
      //if (_app.counties.indexOf(county) == -1) _app.counties.push(county);
      if (_app.counties.indexOf(county) == -1 && d.region == 'WesternSlope') { 
        console.log(county, d);
        _app.counties.push(county);
      }

      if ( !_app.county_agg[ county ]) _app.county_agg[county] = {
        money: 0,
        grants: 0,
        grant_years: {
          2009: 0, 
          2010: 0,
          2011: 0,
          2012: 0
        },
        nonprofits: []
      };

      _app.county_agg[ county ].money += +d.amount;
      _app.county_agg[ county ].grants++;
      _app.county_agg[ county ].grant_years[+d.year]++;
      if (_app.county_agg[ county ].nonprofits.indexOf( d.nonprofit ) == -1) {
        _app.county_agg[ county ].nonprofits.push( d.nonprofit );
      }

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
      
      //_app.chart();
      map();
      controls();
    });

  }

  function updateCountyData(){
    var funders = (_app.selected == 'all') ? _app.funders : _app.selected;

    if ( funders != 'all' ) {
      d3.selectAll('.funder').style('background', '#aaa');
      funders.forEach(function(f){
        //console.log(f, d3.select('#'+f.replace(/ /g, '_')));
        d3.select('#'+f.replace(/ /g, '_')).style('background', function(d){ return _app.cat20(f);})
      });
    }

    console.log(funders);

    _app.county_agg = {};
    var county_list = [];
    var max = 1;
    _app.grants.forEach(function(d){
      if ( funders.indexOf(d.funder) != -1 && d.region == 'WesternSlope'){ 
        var county = d.county.toLowerCase();
        if (county_list.indexOf(county) == -1) { 
          county_list.push(county);
        }

        if ( !_app.county_agg[ county ]) _app.county_agg[county] = {
          money: 0,
          grants: 0,
          grant_years: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0
          },
          nonprofits: []
        };

        _app.county_agg[ county ].money += +d.amount;
        _app.county_agg[ county ].grants++;
        if (_app.county_agg[ county ].grants > max ){
          max = _app.county_agg[ county ].grants;
        }
        _app.county_agg[ county ].grant_years[+d.year]++;
        if (_app.county_agg[ county ].nonprofits.indexOf( d.nonprofit ) == -1) {
          _app.county_agg[ county ].nonprofits.push( d.nonprofit );
        }
      }
    });
    console.log(_app.county_agg, county_list);
   
    _app.orange.domain([0, max]);
 
    d3.select("#map").selectAll("path")
      .style('fill', function(d){ 
        if (county_list.indexOf(d.properties.COUNTY.toLowerCase()) != -1) { 
          return  _app.orange(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants); 
        }
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
          .style('fill', function(d){ if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) return _app.orange(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants) })
          .attr("id", function(d){
            return d.properties.COUNTY;
          })
          .on('mouseover', function(){
            if (_app.counties.indexOf(this.id.toLowerCase()) != -1) _app.showCounty( this.id.toLowerCase() );
          })
          .on('mouseout', function(){
            //d3.select('#county_info').style('display', 'none');        
          }) 
    })
  }


  function controls(){

    var control_div = _app.vis.select('#controls')

    control_div.append('div')
      .attr('id', 'funders')
      .selectAll('div')
      .data(_app.funders)
      .enter().append('div')
        .attr('class', 'funder')
        .attr('id', function(d){ return d.replace(/ /g, '_'); })
        .style('background', function(d){ return _app.cat20(d); })
        .text(function(d){ return d})
        .on('click', function(){
          var f = d3.select(this).data()[0];

          if (d3.select(this).data()[0] == 'View All'){
            _app.selected = 'all';
            updateCountyData();
            return;            
          }

          if (_app.selected == 'all') {
            _app.selected = []; 
          }

          if ( _app.selected.indexOf(f) == -1 ) { 
            _app.selected.push( d3.select(this).data()[0] );
          } else {
            _app.selected.splice(_app.selected.indexOf(f),1);
          }

          updateCountyData();
        });

  }

  _app.showCounty = function( name ){
    var el = d3.select('#county_info');
    el.style('display', 'block');
    var data = _app.county_agg[name];

    d3.select('#county_name').text(name.charAt(0).toUpperCase() + name.slice(1) + ' County')
    d3.select('#county_grants').html('<td class="stat">'+ data.grants +'</td> <td> grants</td>');
    d3.select('#county_money').html('<td class="stat">$'+ Math.round(data.money).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +'</td><td> in donations</td>');
    d3.select('#county_nonprofits').html('<td class="stat">'+ data.nonprofits.length +'</td> <td> organizations </td>');

    d3.select('#county_chart').select('svg').remove();

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 300 - margin.left - margin.right,
      height = 150 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .rangeRound([height, 0], .1);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    
    var svg = d3.select('#county_chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(_app.years);
    y.domain([0, d3.max(Object.keys(data.grant_years), function(d) { return data.grant_years[d]; })]);

     svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    svg.selectAll(".bar")
      .data(Object.keys(data.grant_years))
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(data.grant_years[d]); })
      .attr("height", function(d) { return height - y(data.grant_years[d]); });


  }

  init();
  return _app;

}
