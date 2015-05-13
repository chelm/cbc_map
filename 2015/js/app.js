function App( options ){

  var regionDataPath = options.regions;

  var _app = {
    funders: [],
    years: [],
    types: [],
    counties: [],
    county_agg: {}
  };

  function init(){
    d3.json( regionDataPath, function(d) {
      _app.regions = d;
      var stats = buildStateStats();
      d3.select('#county_data #close-region')
        .on('click', function(){
          _app.resetMap(d);
        });
      createMap(d);
      showStateStats(stats);
    });
  }

  // build the state total dollars and grants
  function buildStateStats (callback) {
    var state = {
        grants_by_year: {},
        amount_by_year: {},
        totalAmount: 0,
        totalGrants: 0
    };
    for (var r in _app.regions.stats){
      var funders = _app.regions.stats[r];
      for (var f in funders){
        var selectedFunder = true;
        if ((_app.selected && _app.selected !== 'all') && _app.selected.indexOf(f) == -1){
          var selectedFunder = false;
        }
        if (selectedFunder){
          for( var y in funders[f]){
            state.totalAmount += funders[f][y].amount;
            state.totalGrants += funders[f][y].count;
            if (!state.grants_by_year[y]){
              state.grants_by_year[y] = 0
            }
            state.grants_by_year[y] += funders[f][y].count;
          
            if (!state.amount_by_year[y]){
              state.amount_by_year[y] = 0
            }
            state.amount_by_year[y] += funders[f][y].amount;
          }
        }
      }
    }
    return state;
  };

  function showStateStats (stats) {
    var div = d3.select('#region-info');
    var funders = (_app.selected == 'all' || !_app.selected) ? 12 : _app.selected.length;
    var len = ( funders == 1 ) ? 'funder' : 'funders';
    var plural = ( funders == 1 ) ? 'this' : 'these';
    var line = "In <span class='stat'>Colorado</span>, "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + stats.totalGrants.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> grants for a total of <span class='stat'>$"+Math.round(stats.totalAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> over <span class='stat'>6</span> years.";
    //div.html(['Colorado', stats.totalGrants, stats.totalAmount].join(', '));
    div.html(line);
    regionChart(stats);
  };

  function createMap( regions ){
    var projection = d3.geo.mercator()
      .center([-101.5, 38.2])
      .scale(3500);

    var path = d3.geo.path().projection(projection);

    d3.json("data/co_counties.json", function( data ){
      var counties = topojson.object(data, data.objects.counties);

      _app.vis = d3.select("#map").append("svg")
        .attr("width",460)
        .attr("height",350);

      _app.selected = 'all'; 
      controls( regions );

      var id;
      _app.vis.append("g")
      .selectAll("path")
      .data(counties.geometries)
      .enter().append("path")
        .attr("d", path)
        .attr("class", "county")
        .style('fill', function(d){
          return _app.regionColor(regions.counties[d.properties.COUNTY.toLowerCase()]);
        })
        .attr("data-region", function(d){
          return regions.counties[d.properties.COUNTY.toLowerCase()];
        })
        .attr("id", function(d){
          return d.properties.COUNTY;
        })
        .on('click', function(d){
          if (!_app.region){
            if (d3.select(this).attr('data-region')){
              //d3.select("#close-region").style('display', 'block');
              d3.select('#region-info').html('').style('display', 'none');
              d3.select('#region-help').style('display', 'none');
              d3.select('#county-info').style('display', 'block');
              d3.select('#county_data').style('display', 'block');
              d3.select('#scale').style('display', 'block');
              _app.region = d3.select(this).attr('data-region');
              _app.initRegion('./data/'+_app.region+'.csv');      
              d3.select('#scale-help').style('display', 'block');
            }
          } else {
            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
              var poly = d3.select(this);
              if ( poly.attr('class') == 'county selected'){
                poly.attr('class', 'county');
                _app.showCounty( 'all' );
                _app.clicked_county = null;
                delete _app.selected_county;
                addHover();
              } else if (poly.attr('data-region') === _app.region ){
                d3.select('.county.selected').attr('class', 'county');
                poly.attr('class', 'county selected');
                id = this.id.toLowerCase();
                _app.clicked_county = id;
                _app.selected_county = id;
                _app.showCounty( id );
                removeHover();
              }  
            }
          }
        });
        addHover(); 
    });
  }

  _app.resetMap = function (regions) {
    if (_app.selected_county){
      //d3.select('#'+_app.selected_county).style('fill', '#fff');
      _app.showCounty( 'all' );
      _app.clicked_county = null;
      delete _app.selected_county;
    }
    _app.region = null;
    _app.vis.selectAll(".county")
      .attr('class', 'county')
      .style('fill', function(d){
        return _app.regionColor(regions.counties[d.properties.COUNTY.toLowerCase()]);
      })
      .style('stroke', '#AAA')
      .style('stroke-width', '.5')
      .style('opacity', '0.75')

    showStateStats(buildStateStats());
    addHover(); 


    d3.select('#region-info').style('display', 'block');
    d3.select("#county_data").style('display', 'none');
    //d3.select("#close-region").style('display', 'none');
    d3.select("#scale").style('display', 'none');
    d3.select("#region-help").style('display', 'block');
    d3.select("#scale-help").style('display', 'none');
    //d3.select("#county_info").style('display', 'none');
    //d3.select("#funders").remove();
    //d3.select("#view-all").remove();
  }

  _app.regionColor = function ( regionName) {
    switch (regionName) {
      case 'Western Slope':
        return '#0F8584';
        break;
      case 'Northeast':
        return '#CE6667';
        break;
      case 'Heart of Colorado':
        return '#385E76';
        break;
      case 'Northwest':
        return '#67C8CA';
        break;
      case 'San Juan':
        return '#9B9B66';
        break;
      case 'Southwest':
        return '#B3B3B3';
        break;
      case 'San Luis Valley':
        return '#B7BBA0';
        break;
      case 'Southeast':
        return '#9A3234';
        break;
      default: 
        return '#eee';
    }
  };

  _app.setRegionColorScale = function ( regionName ) {
    var colors;
    switch (regionName) {
      case 'Western Slope':
        colors = ['#b7dada', '#9fcecd', '#87c2c1', '#6fb5b5', '#57a9a8', '#3e9d9c', '#269190'];
        break;
      case 'Northeast':
        colors = ['#f0d1d1', '#ebc1c2', '#e6b2b3', '#e1a3a3', '#dc9394', '#d78485', '#d27576'];
        break;
      case 'Heart of Colorado':
        colors = ['#c3ced5', '#afbec8', '#9baeba', '#879eac', '#738e9f', '#5f7e91', '#4b6e83'];
        break;
      case 'Northwest':
        colors = ['#d1eeef', '#c2e9e9', '#b3e3e4', '#a3dedf', '#94d8d9', '#85d3d4', '#67c8ca'];
        break;
      case 'San Juan':
        colors = ['#e1e1d1', '#d7d7c1', '#cdcdb2', '#c3c3a3', '#b9b993', '#afaf84', '#a5a575'];
        break;
      case 'Southwest':
        colors = ['#e8e8e8', '#e0e0e0', '#d9d9d9', '#d1d1d1', '#c9c9c9', '#c2c2c2', '#b3b3b3'];
        break;
      case 'San Luis Valley':
        colors = ['#e9eae2', '#e2e3d9', '#dbddcf', '#d3d6c6', '#cccfbc', '#c5c8b3', '#b7bba0'];
        break;
       case 'Southeast':
        colors = ['#e0c1c2', '#d6adad', '#cc9899', '#c28485', '#b86f70', '#ae5a5c', '#a44648'];
        break;
      default:
        colors = ['#b6ba9f', '#a1b19b', '#8ba896', '#74a092', '#5c978e', '#3f8e89', '#0d8585'];
    }
    _app.colors = d3.scale.quantile()
      .domain([0, 275])
      .range(colors);
  };
    
  _app.initRegion = function( path ){
    _app.vis = d3.select('#vis');
    _app.data = {};
    
    if (!_app.regionData){
      _app.regionData = {};
    }

    _app.setRegionColorScale( _app.region );

    if (_app.regionData[_app.region]) {
       _app.years.sort(function(a,b){ return a < b; });
      _app.grants = _app.regionData[_app.region];
      map();
      updateCountyData();
    } else { 
      d3.csv( path, function(d) {
        if (_app.years.indexOf(+d.year) == -1) _app.years.push(+d.year);
        if (_app.funders.indexOf(d.funder.replace(/\./g, '')) == -1) _app.funders.push(d.funder.replace(/\./g, ''));
        if (_app.types.indexOf(d.type) == -1) _app.types.push(d.type);
        
        var county = d.county.toLowerCase().trim();
        if (_app.counties.indexOf(county) == -1 && d.region == _app.region) { 
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
            2013: 0,
            2014: 0
          },
          grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0,
            2014: 0
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
        //_app.cat20.domain(_app.funders);
        _app.grants = rows;
        _app.regionData[_app.region] = rows;
        map();
        updateCountyData();
      });
    };

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
      if ( funders.length || funders.indexOf(d.funder) != -1){ 
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
            2013: 0,
            2014: 0
          },
          grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0,
            2014: 0
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
   
    _app.colors.domain([0, max]);
    updateScale();
 
    d3.select("#map").selectAll("path")
      .style('opacity', function(d){
        if (county_list.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
          return 1;
        }
      })
      .style('fill', function(d){ 
        if (county_list.indexOf(d.properties.COUNTY.toLowerCase()) != -1) { 
          return  _app.colors(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants); 
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
      .data(_app.colors.quantiles())
      .enter().append('td')
        .style('background', function(d){ return _app.colors(d);})
        .text(function(d){ return Math.round(d);})
  }

  function map(){
      var id;
      _app.setRegionColorScale( _app.region );

      _app.vis.append("g")
        .selectAll(".county")
          .style('fill', function(d){ 
            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
              return _app.colors(_app.county_agg[d.properties.COUNTY.toLowerCase()].grants)
            }
          })
          .attr("id", function(d){
            return d.properties.COUNTY;
          });

          addHover();

      updateScale();
  }


  function addHover(){
    d3.selectAll('.county')
      .on('mouseover', function(d){
        if (!_app.region){
          var region = d3.select(this).attr('data-region');
          if (region) {
            _app.showRegionInfo( region );
          } else {
            var message = 'This map only documents grantmaking to the 52 rural Colorado counties as defined by RPD';
            showHoverWin(message, d3.event.clientX, d3.event.clientY);
          }
        } else {
          if (d3.select(this).attr('data-region') === _app.region ) {
            if (_app.counties.indexOf(d.properties.COUNTY.toLowerCase()) != -1) {
              d3.select(this).style('stroke', '#ddd');
              d3.select(this).style('stroke-width', 2);
              _app.showCounty( this.id.toLowerCase() );
            }
          }
        }
        if (_app.region && (d.properties.COUNTY === 'CLEAR CREEK' || d.properties.COUNTY === 'GILPIN')){
          var message = 'Data for Clear Creek and Gilpin Counties will be available in 2016';
          showHoverWin(message, d3.event.clientX, d3.event.clientY);
        }
      })
      .on('mouseout', function(){
        if (!_app.region){
          _app.showRegionInfo( );
        } else {
          d3.select(this).style('stroke', '#AAA');
          d3.select(this).style('stroke-width', .5);
          _app.showCounty('all');
        }
        hideHoverWin();
      });
  }

  showHoverWin = function(msg, x, y){
    console.log(x,y)
    d3.select('#hoverwin')
      .style('display','block')
      .style('left', x+'px')
      .style('top', y+'px')
      .html(msg);
  } 

  hideHoverWin = function(){
    d3.select('#hoverwin').style('display', 'none');
  };

  _app.showRegionInfo = function(region){
    var div = d3.select('#region-info');
    if (region){
      var stats = {
        grants_by_year: {},
        amount_by_year: {},
        totalAmount: 0,
        totalGrants: 0
      };

      var build = function(funder){
        for ( var year in funder){
            stats.totalGrants += funder[year].count;
            stats.totalAmount += funder[year].amount;
            if (!stats.grants_by_year[year]){
              stats.grants_by_year[year] = 0;
            }
            stats.grants_by_year[year] += funder[year].count;
            if (!stats.amount_by_year[year]){
              stats.amount_by_year[year] = 0;
            }
            stats.amount_by_year[year] += funder[year].amount;
        }
      }
      for ( var f in _app.regions.stats[region]) {
        var funder = _app.regions.stats[region][f];
        if (_app.selected === 'all'){
          build(funder);
        } else if (_app.selected.indexOf(f) != -1 ){
          build(funder);
        }
      }
      var funders = (_app.selected == 'all' || !_app.selected) ? 12 : _app.selected.length;
      var len = ( funders == 1 ) ? 'funder' : 'funders';
      var plural = ( funders == 1 ) ? 'this' : 'these';
      var line = "In the <span class='stat'>"+region+"</span> region, "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + stats. totalGrants.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> grants for a total of <span class='stat'>$"+Math.round(stats.totalAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> over <span class='stat'>6</span> years.";
      div.html(line);
      //div.html(region + ', ' + stats.totalGrants +', '+ stats.totalAmount );
      regionChart(stats);
    } else {
      showStateStats(buildStateStats());
    } 
  }

  function removeHover(){
    d3.selectAll('.county')
      .on('mouseover', function(d){ })
      .on('mouseout', function(){ });
  }

  function controls( regions ){

    d3.select('#controls').append('div')
        .attr('id', 'view-all')
        .html('<span class="glyphicon glyphicon-search"></span> View All Funders')
        .on('click', function(){
          d3.event.stopPropagation();
          _app.selected = 'all';
          if (_app.region){
            updateCountyData();
          } else {
            showStateStats( buildStateStats() );
          }
          d3.select(this).style('display', 'none');
          d3.selectAll('.funder').attr('class', 'funder');
        });

    var control_div = d3.select('#controls')

    control_div.append('div')
      .attr('id', 'funders')
      .selectAll('div')
      .data(regions.funders.sort())
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

          if (_app.region){
            updateCountyData();
          } else {
            showStateStats( buildStateStats() );
          }
          if ( typeof(_app.selected_county) == 'undefined'){
            if (_app.region) {
              _app.showCounty('all');
            } else {
              showStateStats( buildStateStats() );
            }
          }
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
            2013: 0,
            2014: 0
          },
          grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0,
            2014: 0
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
      var dollar_text = "<span class='stat'>$"+Math.round(data.money).toString().replace(/\B(?=(\d{3})+(?!\d))/g,  ',') + "</span> over <span class='stat'>6</span> years.";
    }

    var n = (name == 'all') ? "the <span class='stat'>"+_app.region+"</span> region" : "<span class='stat'>" + name.replace(/\w\S*/g,   function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) + '</span> County';
    var line = "In "+ n +", "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + ((!year) ? data.grants : data.grant_years[year]) + "</span> grants for a total of " + dollar_text;
    d3.select('#county_data .data').html(line);

  };

  _app.showCounty = function( name ){

    if (name != 'all'){
      //_app.selected_county = name;
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
            2013: 0,
            2014: 0
        },
        grant_years_dollars: {
            2009: 0,
            2010: 0,
            2011: 0,
            2012: 0,
            2013: 0,
            2014: 0
        }
      };
    }

    var n = (name == 'all') ? "the <span class='stat'>"+_app.region+"</span> region" : "<span class='stat'>" + name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) + '</span> County';
    var line = "In "+ n +", "+plural+" <span class='stat'>"+ funders +"</span> " + len + " awarded <span class='stat'>" + data.grants + "</span> grants for a total of <span class='stat'>$"+Math.round(data.money).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + "</span> over <span class='stat'>6</span> years."; 
    d3.select('#county_data .data').html(line);

    d3.select( '#county_chart' ).select('svg').remove();

    var margin = {top: 30, right: 30, bottom: 20, left: 85},
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
        .orient("left");


    var svg = d3.select('#county_chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    x.domain([2009, 2010, 2011, 2012, 2013, 2014]);
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
      .style('fill', _app.colors.range()[5])
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

  regionChart = function(stats){
    d3.select( '#county_chart' ).select('svg').remove();

    var margin = {top: 30, right: 30, bottom: 20, left: 85},
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
        .orient("left");

    var svg = d3.select('#county_chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    x.domain([2009, 2010, 2011, 2012, 2013, 2014]);
    y.domain([0, d3.max(Object.keys(stats.amount_by_year), function(d) { return stats.amount_by_year[d]; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis axisLeft")
        .call(yAxis)

     var bars = svg.selectAll(".bar")
      .data(Object.keys(stats.amount_by_year))
      .enter();

    bars.append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d)+8; })
      .attr("width", x.rangeBand() * .75)
      .attr("y", function(d) { return y(stats.amount_by_year[d]); })
      .attr("height", function(d) { return height - y(stats.amount_by_year[d]); })
      .on('mouseover', function(d){
        //_app.buildCountyText( d );
      })
      .on('mouseout', function(d){
        //_app.buildCountyText( );
      })
  }

  init();
  return _app;

}
