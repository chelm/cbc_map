var csv = require('csv'),
  fs = require('fs')

var regions = [
  'Northwest',
  'Northeast',
  'Southwest',
  'Southeast',
  'San\ Luis\ Valley',
  'Heart\ of\ Colorado',
  'San\ Juan',
  'Western\ Slope'
]
var out = {"funders":["Adolph Coors Foundation","Anschutz Family Foundation","AV Hunter Trust","Boettcher Foundation","Caring for Colorado Foundation","Daniels Fund","El Pomar Foundation","Gates Family Foundation","Helen K. and Arthur E. Johnson Foundation","Temple Hoyne Buell Foundation","TheColorado Health Foundation","The Colorado Trust"],"counties": {"delta":"Western Slope","eagle": "Western Slope","garfield":"Western Slope","mesa":"Western Slope","pitkin":"Western Slope", "cheyenne":"Northeast","morgan":"Northeast","kit carson":"Northeast","lincoln":"Northeast", "logan":"Northeast","phillips":"Northeast","sedgwick":"Northeast","washington":"Northeast", "yuma": "Northeast","montrose":"San Juan","hinsdale":"San Juan","san miguel":"San Juan","gunnison":"San Juan","ouray":"San Juan","chaffee":"Heart of Colorado","teller":"Heart of Colorado","custer":"Heart of Colorado","fremont":"Heart of Colorado","park":"Heart of Colorado","gilpin":"Heart of Colorado","lake":"Heart of Colorado","summit":"Heart of Colorado","clear creek": "Heart of Colorado","alamosa":"San Luis Valley","rio grande":"San Luis Valley","conejos": "San Luis Valley","costilla":"San Luis Valley","mineral":"San Luis Valley","saguache":"San Luis Valley","archuleta":"Southwest","san juan":"Southwest","dolores":"Southwest","la plata":"Southwest","montezuma":"Southwest","baca":"Southeast","kiowa":"Southeast","bent":"Southeast","crowley":"Southeast","huerfano":"Southeast","las animas":"Southeast","otero":"Southeast","prowers":"Southeast","grand":"Northwest","moffat":"Northwest","routt":"Northwest","rio blanco":"Northwest","jackson":"Northwest"}};
var stats = {};
var len = regions.length;

(function next () {
  if (-- len < 0) {
    out.stats = stats;
    return console.log(JSON.stringify(out));
  }
  csv.parse(fs.readFileSync('../'+regions[len]+'.csv').toString(), function(err, data){
    stats[ regions[ len ] ] = {};

    data.forEach(function(row,i){
      if (i > 0){
        var funder = row[0],
          year = row[1],
          amount = row[5];

        if (!stats[regions[ len ]][funder]){
          stats[regions[ len ]][funder] = {};
        } 
        if (!stats[regions[ len ]][funder][year]){
          stats[regions[ len ]][funder][year] = {
            count: 0,
            amount: 0
          }
        }
        stats[regions[ len ]][funder][year].count++;
        stats[regions[ len ]][funder][year].amount += parseInt(amount);
    
      }
    });
    next();
  });
})();
