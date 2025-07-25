var http = require('http').createServer(handler); //require http server, and create server with function handle$
var fs = require('fs'); //require filesystem module
var path = require('path');
const io = require('socket.io')(http, {
  pingTimeout: 4000,      // How long without a pong packet to consider the connection closed
  pingInterval: 25000     // How often to send a ping packet
});
//io.set('transports',['websocket']);

const sqlite3 = require('sqlite3').verbose();

// Global vars
//var QNH = 1013;


let db = new sqlite3.Database('/memdb/memdb.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.run("PRAGMA busy_timeout = 1000");
db.run("PRAGMA journal_mode = WAL");

http.listen(8088); //listen to port 80

function handler (request, response) { //create server
    console.log('Server starting...');
//	console.log('Session' + request.sessionID);

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './EFIS.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;

    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}

io.sockets.on('connection', function (socket) {// WebSocket Connection
//  var lightvalue = 0; //static variable for current status
var QNH = 1013;
var Airspeed = 0;
var Altitude = 0;
var VerticalSpeed = 0;
var Heading = 0;
var Roll = 0;
var Pitch = 0;
var TurnRate = 0;

var TachoRPM = 0;
var FuelPressure = 0;
var FuelFlow = 0;
var FuelTank1 = 0;
var OilTemperature = 0;
var OilPressure = 0;
var EGT1 = 0;
var EGT2 = 0;
var EGT3 = 0;
var EGT4 = 0;
var CHT1 = 0;
var CHT2 = 0;
var CHT3 = 0;
var CHT4 = 0;
var Volts = 0;
var AmpsAlternator = 0;
var AmpsBattery = 0;
var GPS_GS = 0;
var GPS_Alt = 0;
var GPS_TRK_T = 0;
var TimeUTC = '00:00:00';
var TempSeconds = 0;

var TS_TachoRPM = 0;
var TS_FuelPressure = 0;
var TS_FuelFlow = 0;
var TS_FuelTank1 = 0;
var TS_OilTemperature = 0;
var TS_OilPressure = 0;
var TS_EGT1 = 0;
var TS_EGT2 = 0;
var TS_EGT3 = 0;
var TS_EGT4 = 0;
var TS_CHT1 = 0;
var TS_CHT2 = 0;
var TS_CHT3 = 0;
var TS_CHT4 = 0;
var TS_Volts = 0;
var TS_AmpsAlternator = 0;
var TS_AmpsBattery = 0;
var TS_GPS_GS = 0;
var TS_GPS_Alt = 0;
var TS_GPS_TRK_T = 0;



//  socket.on('light', function(data) { //get light switch status from client
//    lightvalue = data;
//    if (lightvalue) {
//      console.log(lightvalue); //turn LED on or off, for now we will just show it in console.log
//    }
//  });


// Update at 20Hz
var increment = 0;

var myInterval = setInterval(function() {
var d = new Date();


// get the data from the database
db.serialize(() => {
  db.each('SELECT * FROM messages', (err, row) => {
    if (err) {
      console.error(err.message);
    }
//    console.log(row.Param_Text + "\t" + row.Param_Value);
   switch (row.Param_Text) {
      case 'Airspeed':
			if (Airspeed != row.Param_Value) {
				Airspeed = row.Param_Value;
				socket.emit('Airspeed', Airspeed );
			}
            break;
      case 'Altitude':
			if (Math.abs(row.Param_Value - Altitude)>20) {
				Altitude = row.Param_Value;
				socket.emit('Altitude', Altitude );
//            console.log(Static_Pressure + "\t" + Altitude);
			}
            break;
      case 'VerticalSpeed':
			if (Math.abs(VerticalSpeed - row.Param_Value) > 50) {
				VerticalSpeed = row.Param_Value;
        if (Math.abs(VerticalSpeed)<90) {
          VerticalSpeed = 0;
        }
				socket.emit('Vario', VerticalSpeed);
//            console.log(row.Param_Text + "\t" + row.Param_Value);
			}
            break;
      case 'QNH':
			if (QNH != row.Param_Value) {
				QNH = row.Param_Value;
				if (QNH == 0) {
					QNH = 1013;
				}
				socket.emit('QNH', QNH);
			}
            break;
      case 'Heading':
			if (Heading != row.Param_Value) {
				Heading = row.Param_Value;
				socket.emit('Heading', Heading );
			}
            break;
      case 'Roll':
			if (Roll != row.Param_Value) {
				Roll = -row.Param_Value;
				socket.emit('AH_Roll', Roll );
			}
            break;
      case 'Pitch':
			if (Pitch != -row.Param_Value) {
				Pitch = row.Param_Value;
				socket.emit('AH_Pitch', Pitch );
			}
            break;
      case 'TurnRate':
            if (TurnRate != row.Param_Value) {
				TurnRate = row.Param_Value;
				socket.emit('Turn', TurnRate );
			}
            break;
      case 'RPM':
			if (TachoRPM != row.Param_Value || d.getTime() - TS_TachoRPM > 12000) {
        TS_TachoRPM = d.getTime() - Math.floor(Math.random() * 5000);
				TachoRPM = row.Param_Value;
//        TachoRPM = FuelFlow*2;                      //******************************************************
				socket.emit('TachoRPM', TachoRPM );
//            	console.log("RPM = " + row.Param_Value);
			}
            break;
      case 'FuelPressure':
      if (FuelPressure != row.Param_Value || d.getTime() - TS_FuelPressure > 12000) {
          TS_FuelPressure = d.getTime() - Math.floor(Math.random() * 5000);
      		FuelPressure = row.Param_Value;
//          FuelPressure = FuelFlow/10000;
      		socket.emit('FuelPressure', FuelPressure/1000 );
      }
            break;
      case 'FuelFlow':
      if (FuelFlow != row.Param_Value || d.getTime() - TS_FuelFlow > 12000) {
          TS_FuelFlow = d.getTime() - Math.floor(Math.random() * 5000);
      		FuelFlow = row.Param_Value;
      		socket.emit('FuelFlow', FuelFlow/100 );
      }
      break;

      case 'FuelTank1':
      if (FuelTank1 != row.Param_Value) {
      		FuelTank1 = row.Param_Value;
      		socket.emit('FuelTank1', FuelTank1 );
      }
      break;

      case 'OilTemperature':
			if (OilTemperature != row.Param_Value || d.getTime() - TS_OilTemperature > 12000) {
        TS_OilTemperature = d.getTime() - Math.floor(Math.random() * 5000);
				OilTemperature = row.Param_Value;
				socket.emit('OilTemperature', OilTemperature/10 );
			}
            break;
      case 'OilPressure':
			if (OilPressure != row.Param_Value || d.getTime() - TS_OilPressure > 12000) {
        TS_OilPressure = d.getTime() - Math.floor(Math.random() * 5000);
				OilPressure = row.Param_Value;
				socket.emit('OilPressure', OilPressure/1000 );
			}
            break;

      case 'EGT1':
      if (EGT1 != row.Param_Value || d.getTime() - TS_EGT1 > 12000) {
          TS_EGT1 = d.getTime() - Math.floor(Math.random() * 5000);
      		EGT1 = row.Param_Value;
//          EGT1 = FuelFlow*2/10;                      //******************************************************
      		socket.emit('EGT1', EGT1 );
      }
      break;
      case 'EGT2':
      if (EGT2 != row.Param_Value || d.getTime() - TS_EGT2 > 12000) {
          TS_EGT2 = d.getTime() - Math.floor(Math.random() * 5000);
      		EGT2 = row.Param_Value;
//          EGT2 = FuelFlow*2/10;                      //******************************************************
      		socket.emit('EGT2', EGT2 );
      }
      break;
      case 'EGT3':
      if (EGT3 != row.Param_Value || d.getTime() - TS_EGT3 > 12000) {
          TS_EGT3 = d.getTime() - Math.floor(Math.random() * 5000);
          EGT3 = row.Param_Value;
//          EGT3 = FuelFlow*2/10;                      //******************************************************
      		socket.emit('EGT3', EGT3 );
      }
      break;
      case 'EGT4':
      if (EGT4 != row.Param_Value || d.getTime() - TS_EGT4 > 12000) {
          TS_EGT4 = d.getTime() - Math.floor(Math.random() * 5000);
          EGT4 = row.Param_Value;
//          EGT4 = FuelFlow*2/10;                      //******************************************************
      		socket.emit('EGT4', EGT4 );
      }
      break;

      case 'CHT1':
      if (CHT1 != row.Param_Value || d.getTime() - TS_CHT1 > 12000) {
          TS_CHT1 = d.getTime() - Math.floor(Math.random() * 5000);
      		CHT1 = row.Param_Value;
      		socket.emit('CHT1', CHT1 );
      }
      break;

 // Standard Rotax 912 has only two CHT sensors so the CHT2 and CHT3 are temporary disabled to save space on the display
 /*
      case 'CHT2':
      if (CHT2 != row.Param_Value) {
      		CHT2 = row.Param_Value;
      		socket.emit('CHT2', CHT2 );
      }
      break;
      case 'CHT3':
      if (CHT3 != row.Param_Value) {
      		CHT3 = row.Param_Value;
      		socket.emit('CHT3', CHT3 );
      }
      break;
      */
      case 'CHT4':
      if (CHT4 != row.Param_Value || d.getTime() - TS_CHT4 > 12000) {
          TS_CHT4 = d.getTime() - Math.floor(Math.random() * 5000);
      		CHT4 = row.Param_Value;
      		socket.emit('CHT4', CHT4 );
      }
      break;

      case 'Volts':
      if (Volts != row.Param_Value) {
      		Volts = row.Param_Value;
      		socket.emit('Volts', Volts/1000 );
      }
      break;

      case 'AmpsAlternator':
      if (AmpsAlternator != row.Param_Value) {
      		AmpsAlternator = row.Param_Value;
      		socket.emit('AmpsAlternator', AmpsAlternator/1000 );
      }
      break;

      case 'AmpsBattery':
      if (AmpsBattery != row.Param_Value) {
          AmpsBattery = row.Param_Value;
          socket.emit('AmpsBattery', AmpsBattery/1000 );
      }
      break;

      case 'GPS_GS':
      if (GPS_GS != row.Param_Value) {
      		GPS_GS = row.Param_Value;
      		socket.emit('GPS_GS', GPS_GS );
      }
      break;
      case 'GPS_Alt':
      if (GPS_Alt != row.Param_Value) {
      		GPS_Alt = row.Param_Value;
      		socket.emit('GPS_Alt', GPS_Alt );
      }
      break;
      case 'GPS_TRK_T':
      if (GPS_TRK_T != row.Param_Value) {
      		GPS_TRK_T = row.Param_Value;
      		socket.emit('GPS_TRK_T', GPS_TRK_T );
      }
      break;

   }

  });
});

  if (TempSeconds != d.getSeconds()) {
    if (d.getHours() < 10) {
      TimeUTC = '0' + d.getHours() + ':';
    } else {
      TimeUTC = d.getHours() + ':';
    }
    if (d.getMinutes() < 10) {
      TimeUTC = TimeUTC + '0' + d.getMinutes() + ':';
    } else {
      TimeUTC = TimeUTC + d.getMinutes() + ':';
    }
    if (d.getSeconds() < 10) {
      TimeUTC = TimeUTC + '0' + d.getSeconds();
    } else {
      TimeUTC = TimeUTC + d.getSeconds();
    }

  	socket.emit('TimeUTC', TimeUTC);
  }

	increment++;
	//console.log('increment='+increment);
	//console.log('Session = ' + request.session);
	if (increment>1000000) {
		increment = 0;
		}



	}, 50);

	// if user is disconnected or went to another page break the loop (Interval) above
	socket.on('disconnect',function(){
          console.log('User disconnected. Msg count: '+increment);
			clearInterval(myInterval); });

});

//io.sockets.on('disconnect',function(){
//   console.log('user disconnected');  });
