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

var out = {};
var len = regions.length;

(function next () {
  if (-- len < 0) {
    return console.log(JSON.stringify(out));
  }
  csv.parse(fs.readFileSync('../'+regions[len]+'.csv').toString(), function(err, data){
    out[ regions[ len ] ] = {};

    data.forEach(function(row,i){
      if (i > 0){
        var funder = row[0],
          year = row[1],
          amount = row[5];

        if (!out[regions[ len ]][funder]){
          out[regions[ len ]][funder] = {};
        } 
        if (!out[regions[ len ]][funder][year]){
          out[regions[ len ]][funder][year] = {
            count: 0,
            amount: 0
          }
        }
        out[regions[ len ]][funder][year].count++;
        out[regions[ len ]][funder][year].amount += parseInt(amount);
    
      }
    });
    next();
  });
})();
