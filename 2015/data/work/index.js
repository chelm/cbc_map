var csv = require('csv'),
  fs = require('fs')

var headers, out = [['funder','year','region','county','nonprofit','amount','city','type','category']];

var region = process.argv[2];

csv.parse(fs.readFileSync('./2009.csv').toString(), function(err, data2009){
  cnt = 0, n = 0;
  data2009.forEach(function(row,i){
    if (row[2] === region){
      row[5] = parseFloat(row[5].replace('$','').replace(/,/g, ''));
      //console.log(row[5])
      cnt += row[5];
      n++;
      out.push(row);
    }
  })
  
    //console.log(cnt, n);
    csv.parse(fs.readFileSync('./2010.csv').toString(), function(err, data2010){
      data2010.forEach(function(row,i){
        if (row[2] === region){
          row[5] = parseFloat(row[5].replace('$','').replace(/,/g, ''));
          out.push(row);
        }
      });
      csv.parse(fs.readFileSync('./2011.csv').toString(), function(err, data2011){
        data2011.forEach(function(row,i){
          if (row[2] === region){
            //console.log(row[5])
            row[5] = parseFloat(row[5].replace('$','').replace(/,/g, ''));
            //console.log(row[5])
            out.push(row);
          }
        });
        csv.parse(fs.readFileSync('./2012.csv').toString(), function(err, data2012){
          data2012.forEach(function(row,i){
            if (row[2] === region){
              row[5] = parseFloat(row[5].replace('$','').replace(/,/g, ''));
              out.push(row);
            }
          });
          csv.parse(fs.readFileSync('./2013.csv').toString(), function(err, data2013){
            data2013.forEach(function(row,i){
              if (row[2] === region){
                row[5] = parseFloat(row[5].replace('$','').replace(/,/g,''));
                //console.log(row[5])
                out.push(row);
              }
            });
            csv.parse(fs.readFileSync('./2014.csv').toString(), function(err, data2014){
              data2014.forEach(function(row,i){
                if (row[2] === region){
                  row[5] = parseFloat(row[5].replace('$','').replace(/,/g,''));
                  //console.log(row[5])
                  out.push(row);
                }
              });
              // finish
              csv.stringify(out, function(err, data){
                process.stdout.write(data);
              });
            });
            
          });
        });
      });
    
  })
  
})
