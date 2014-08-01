function App( path ){

  var _app = {
    funders: [],
    years: [],
    types: [],
    counties: [],
    county_agg: {}
  };

  function init(){
    _app.vis = d3.select('#vis');
    _app.cat20 = d3.scale.category10()
      .range(['#7ED3E0', '#00B3F7' ,'#007DC5', '#0054A6', '#B2D235', '#66B345', '#00874B', '#1B5A41', '#937CB9', '#7159A6', '#4D3F99', '#362A86', '#FFDF4F', '#E7BA48', '#E29844', '#F50521']);
    _app.orange = d3.scale.quantile()
      .domain([0, 275])
      .range(['#b6ba9f', '#a1b19b', '#8ba896', '#74a092', '#5c978e', '#3f8e89', '#0d8585']);
      //.range(['#0d8583', '#1d6f72', '#235b62', '#244652', '#233342']);
      //.range(['#008383', '#057777', '#0f696a', '#185b5c', '#1e4c4e', '#223c3f', '#232b30']);
      //.range(['#90ee90', '#7bd678', '#65be61', '#50a74a', '#3a9034', '#237a1d', '#006400']);
      //.range(["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#9f2d04"]);

    _app.data = {};

    d3.csv( path, function(d) {
      if (_app.years.indexOf(+d.year) == -1) _app.years.push(+d.year);
      if (_app.funders.indexOf(d.funder.replace(/\./g, '')) == -1) _app.funders.push(d.funder.replace(/\./g, ''));
      if (_app.types.indexOf(d.type) == -1) _app.types.push(d.type);
      
      var county = d.county.toLowerCase().trim();
      if (_app.counties.indexOf(county) == -1 && d.region == 'Heart of Colorado') { 
        _app.counties.push(county);
      }

      if ( !_app.county_agg[ county ]) _app.county_agg[county] = {
        money: 0,
        grants: 0,
        grant_years: {
          2009: 0, 
          2010: 0,
          2011: 0,
          2012: 0,
          2013: 0
        },
        grant_years_dollars: {
          2009: 0,
          2010: 0,
          2011: 0,
          2012: 0,
          2013: 0
        },
        nonprofits: []
      };

      _app.county_agg[ county ].money += +d.amount;
      _app.county_agg[ county ].grants++;
      _app.county_agg[ county ].grant_years[+d.year]++;
      _app.county_agg[ county ].grant_years_dollars[+d.year] += +d.amount;
      if (_app.county_agg[ county ].nonprofits.indexOf( d.nonprofit ) == -1) {
        _app.county_agg[ county ].nonprofits.push( d.nonprofit );
      }

      var g = {
        year: +d.year,
        funder: d.funder,
        nonprofit: d.nonprofit,
        amount: +d.amount,
        city: d.city,
        county: d.county.trim(),
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
      _app.years.sort(function(a,b){ return a < b; });
      _app.cat20.domain(_app.funders);
      _app.grants = rows;
      _app.selected = 'all';

      d3.select('#controls').append('div')
        .attr('id', 'view-all')
        .html('<span class="glyphicon glyphicon-search"></span> View All Funders')
        .on('click', function(){
          _app.selected = 'all';
          updateCountyData();
          d3.select(this).style('display', 'none');
          d3.selectAll('.funder').attr('class', 'funder');
        });
      
      controls();
      map();
      updateCountyData();
    });

  }

  function updateCountyData(){
    var funders = (_app.selected == 'all') ? _app.funders : _app.selected;
    if ( funders != 'all' ) {
      //d3.selectAll('.funder').style('background', '#aaa');
      funders.forEach(function(f){
        //d3.select('#'+f.replace(/ /g, '_')).style('background', function(d){ return _app.cat20(f);});
      });
    }


    _app.county_agg = {};
    var county_list = [];
    var max = 1;
    _app.grants.forEach(function(d, i){
      if ( funders.indexOf(d.funder.replace(/\./g, '')) != -1){ 
        var county = d.county.toLowerCase().trim();
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
            2012: 0,
            2013: 0
          },
          grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0
          },
          nonprofits: []
        };
        _app.county_agg[ county ].money += +d.amount;
        _app.county_agg[ county ].grants++;
        if (_app.county_agg[ county ].grants > max ){
          max = _app.county_agg[ county ].grants;
        }
        _app.county_agg[ county ].grant_years[+d.year]++;
        _app.county_agg[ county ].grant_years_dollars[+d.year] += +d.amount;
        if (_app.county_agg[ county ].nonprofits.indexOf( d.nonprofit ) == -1) {
          _app.county_agg[ county ].nonprofits.push( d.nonprofit );
        }
      }
    });
   
    _app.orange.domain([0, max]);
    updateScale();
 
    d3.select("#map").selectAll("path")
      .style('opacity', function(d){
        if (county_list.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
          return 1;
        }
      })
      .style('fill', function(d){ 
        if (county_list.indexOf(d.properties.COUNTY.toLowerCase()) != -1) { 
          return  _app.orange(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants); 
        }
      });

    if (_app.selected == 'all'){
      _app.showCounty( 'all' );
    } else if ( _app.selected_county ){
      _app.showCounty( _app.selected_county );
    }

  }

  function updateScale(){
    d3.select('#scale table').remove()
    d3.select('#scale').append('table').append('tr').selectAll('td')
      .data(_app.orange.quantiles())
      .enter().append('td')
        .style('background', function(d){ return _app.orange(d);})
        .text(function(d){ return Math.round(d);})
  }

  function map(){
    var projection = d3.geo.mercator()
      .center([-101.5, 38.2])
      .scale(3500);

    var path = d3.geo.path().projection(projection);

    d3.json("data/co_counties.json", function( data ){
      var counties = topojson.object(data, data.objects.counties);

      var vis = d3.select("#map").append("svg")
        .attr("width",460)
        .attr("height",350);

      vis.append("g")
        .selectAll("path")
        .data(counties.geometries)
        .enter().append("path")
          .attr("d", path)
          .attr("class", "county")
//          .style('opacity', function(d){
//            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
//              return 1;
//            }
//          })
          .style('fill', function(d){ 
            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
              return _app.orange(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants)
            }
          })
          .attr("id", function(d){
            return d.properties.COUNTY;
          })
           .on('click', function(d){
            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
              var poly = d3.select(this);
              if ( poly.attr('class') == 'county selected'){
                poly.attr('class', 'county');
                _app.showCounty( 'all' );
                _app.clicked_county = null;
                addHover();
              } else {
                d3.select('.county.selected').attr('class', 'county');
                poly.attr('class', 'county selected');
                _app.clicked_county = this.id.toLowerCase();
                _app.showCounty( this.id.toLowerCase() );
                removeHover();
              }  
            }
          });

          addHover();

    });
    updateScale();
  }


  function addHover(){
    d3.selectAll('.county')
      .on('mouseover', function(d){
        if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
          d3.select(this).style('stroke', '#ddd');
          d3.select(this).style('stroke-width', 2);
          _app.showCounty( this.id.toLowerCase() );
        }
      })
      .on('mouseout', function(){
        d3.select(this).style('stroke', '#AAA');
        d3.select(this).style('stroke-width', .5);
        _app.showCounty('all');
      });
  } 


  function removeHover(){
    d3.selectAll('.county')
      .on('mouseover', function(d){ })
      .on('mouseout', function(){ });
  }
  


  function controls(){

    var control_div = _app.vis.select('#controls')

    control_div.append('div')
      .attr('id', 'funders')
      .selectAll('div')
      .data(_app.funders.sort())
      .enter().append('div')
        .attr('class', 'funder')
        .attr('id', function(d){ return d.replace(/ /g, '_'); })
        //.style('background', function(d){ return _app.cat20(d); })
        //.text(function(d){ return d })
        .text(function(d){ return (d == 'Helen K and Arthur E Johnson Foundation') ? 'Helen K. and Arthur E. Johnson Foundation' : d; })
        .on('click', function(){
          var f = d3.select(this).data()[0];
          

          d3.selectAll('.funder').attr('class', function(){
            var f = d3.select(this);
            if (f[0][0].className != 'selected funder'){
              return 'unselected funder';
            } else {
              return 'selected funder';
            }
          });
          d3.select(this).attr('class', function(d){
            if (d3.select(this).node().className != 'selected funder'){
              return 'selected funder';
            } else {
              return 'unselected funder';
            }
          });
          

          /*if (d3.select(this).data()[0] == 'View All'){
            _app.selected = 'all';
            updateCountyData();
            return;            
          }*/
          d3.select('#view-all').style('display', 'block');

          if (_app.selected == 'all') {
            _app.selected = []; 
          }

          if ( _app.selected.indexOf(f) == -1 ) { 
            _app.selected.push( d3.select(this).data()[0] );
          } else {
            _app.selected.splice(_app.selected.indexOf(f),1);
          }

          if ( _app.selected.length == 0 ) {
            _app.selected = 'all';
            d3.select('#view-all').style('display', 'none');
            d3.selectAll('.funder').attr('class', 'funder');
          }

          updateCountyData();
          _app.showCounty('all');
        });

  }

  function total( agg ){

    var data = {
          money: 0,
          grants: 0,
          grant_years: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0
          },
          grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0
          },
          nonprofits: []
    };

    for (var county in agg){
      var d = agg[county];
      data.money += d.money;
      data.grants += d.grants;
      data.nonprofits += d.nonprofits;
      for (var yr in d.grant_years){
        data.grant_years[yr] += d.grant_years[yr];
        data.grant_years_dollars[yr] += d.grant_years_dollars[yr];
      }
    }
    return data;
  };

  _app.buildCountyText = function( year ){
    var name = ( !_app.clicked_county ) ? 'all' : _app.clicked_county;
    var totals = total( _app.county_agg );
    var data = ( name == 'all' ) ? totals : _app.county_agg[ name.replace(/\./g,'') ];
    var funders = (_app.selected == 'all') ? _app.funders.length : _app.selected.length;
    var len = ( funders == 1 ) ? 'funder' : 'funders';
    var plural = ( funders == 1 ) ? 'this' : 'these';

    if (year){
      var dollar_text = "<span class='stat'>$"+ Math.round(data.grant_years_dollars[year]).toString().replace(/\B(?=(\d{3})+(?!\d))/g,  ',') + "</span> in <span class='stat'>"+year+"</span>.";
    } else { 
      var dollar_text = "<span class='stat'>$"+Math.round(data.money).toString().replace(/\B(?=(\d{3})+(?!\d))/g,  ',') + "</span> over <span class='stat'>5</span> years.";
    }

    var n = (name == 'all') ? "the <span class='stat'>Heart of Colorado</span> region" : "<span class='stat'>" + name.replace(/\w\S*/g,   function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) + '</span> County';
    var line = "In "+ n +", "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + ((!year) ? data.grants : data.grant_years[year]) + "</span> grants for a total of " + dollar_text;
    d3.select('#county_data').html(line);

  };

  _app.showCounty = function( name ){

    if (name != 'all'){
      _app.selected_county = name;
    }
    
    var el = d3.select('#county_info');
    el.style('display', 'block');
    
    var totals = total( _app.county_agg );
    var data = ( name == 'all' ) ? totals : _app.county_agg[ name.replace(/\./g,'') ];
    var funders = (_app.selected == 'all') ? _app.funders.length : _app.selected.length;
    var len = ( funders == 1 ) ? 'funder' : 'funders';  
    var plural = ( funders == 1 ) ? 'this' : 'these'; 
    

    if ( !data ){
      data = {
        money: 0, 
        grants: 0, 
        grant_years: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0
        },
        grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0
        }
      };
    }


    var n = (name == 'all') ? "the <span class='stat'>Heart of Colorado</span> region" : "<span class='stat'>" + name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) + '</span> County';
    var line = "In "+ n +", "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + data.grants + "</span> grants for a total of <span class='stat'>$"+Math.round(data.money).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> over <span class='stat'>5</span> years."; 
    d3.select('#county_data').html(line);

    d3.select( '#county_chart' ).select('svg').remove();

    var margin = {top: 30, right: 30, bottom: 20, left: 65},
      width = 450 - margin.left - margin.right,
      height = 175 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .rangeRound([height, 0], .1);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(7)
        .orient("left")

    var svg = d3.select('#county_chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    x.domain([2009, 2010, 2011, 2012, 2013]);
    y.domain([0, d3.max(Object.keys(data.grant_years_dollars), function(d) { return data.grant_years_dollars[d]; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis axisLeft")
        .call(yAxis)

    var bars = svg.selectAll(".bar")
      .data(Object.keys(data.grant_years_dollars))
      .enter();

    bars.append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d)+8; })
      .attr("width", x.rangeBand() * .75)
      .attr("y", function(d) { return y(data.grant_years_dollars[d]); })
      .attr("height", function(d) { return height - y(data.grant_years_dollars[d]); })
      .on('mouseover', function(d){
        _app.buildCountyText( d );
      })
      .on('mouseout', function(d){
        _app.buildCountyText( );
      })


  }

  init();
  return _app;

}
