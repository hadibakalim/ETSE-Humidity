//load the things we need
// libraries : mqtt, mysql, express, bodyparser, events
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://192.168.24.130');
var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var events = require('events');
var eventEmitter = new events.EventEmitter();

// this is an event function
// that event add new client to database
var addClientCreateDatabaseFunction = function addClientCreateDatabaseFunction()
{
    // Checking Process
    // read the table if there is any, with the same name
    connection.query('SELECT * FROM chipID;', 
        function (error, rows) 
        {
            // error handling
            if (error) throw error;

            //console.log(dat |aFromForm.description);

            // local value for comparison
            var checkValue = 0;
            // if the number which we want to add into database is already installed
            // checkValue can't be zero.
	        for(var i=0;i<rows.length;i++){
                if ( dataFromForm.number == tagDatas.chipIDnumber[i] ){
                    checkValue++;
                }
            }
            // if zero, the number hasnt installed into database yet.
            if (checkValue == 0){
                // if the client isnt registred yet,
                // save the new client to the chipID table in mysqldatabase
                if (tagDatas.chipIDqueue != ''){
                // if the value has a value
                    var nthVar = tagDatas.chipIDqueue.slice(-1);
                    if(parseInt(nthVar[0].slice(-2)) != '')
                    {
                        var sensorQueueNumber = parseInt(nthVar[0].slice(-1)) + 1 ;
                    }
                    else {
                        var sensorQueueNumber = parseInt(nthVar[0].slice(-2)) + 1 ;
                    }
                      
                    //console.log(sensorQueueNumber);
                    var sensorQueue = 's'+ sensorQueueNumber;
                }
                else {
                // else the value has not a value, default value should be s1 which stands for sensor1
                    var sensorQueue = 's1';
                }
                // insert the client value into chipID table
                connection.query('INSERT INTO chipID SET ?', {number: dataFromForm.number, 
                                            queue: sensorQueue, description: dataFromForm.description}  , 
                    function (err, result) {
                        // error handling
                        if (err) {
                            console.error(err);
      	                }
                        else{
                            console.error(result);
                        }
                    }
                );
                
                // create a new table according to new client, 
                // so that the data comes to new client can be saved in related table
                connection.query('CREATE TABLE '+ dataFromForm.number + sensorQueue +
                     ' ( id INT PRIMARY KEY AUTO_INCREMENT, temp VARCHAR(255) NOT NULL,'+
                     ' res VARCHAR(255) NOT NULL, adc VARCHAR(255) NOT NULL, mux VARCHAR(255) NOT NULL,'+
                     ' time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, unixTime INT );',
                    // error handling
                    function(err, result){
                        // Case there is an error during the creation
                        if(err) {
                            console.log(err);
                        } 
                        else {
                            console.log("New client's table created succesfully");
                        }
                    }
                );

                // STORE THE REGISTERED AND SUBSCRIBED CLIENTS AT VARIABLE TABLE
                connection.query('INSERT INTO registeredClients SET ?', {clientName: dataFromForm.number + sensorQueue
                                                , description: dataFromForm.description}  , 
                    function (err, result) {
                        // error handling
                        if (err) {
                            console.error(err);
      	                }
                        else{
                            console.error(result);
                        }
                    }
                );


            }
            else {
                console.log('This client ID is already registered')
            }
        }
    );

    
    // subscribe to all clients from starting over
    subscribeAll();
        
}
// when addClientCreateDatabase event emitted, addClientCreateDatabaseFunction starts
eventEmitter.on('addClientCreateDatabase', addClientCreateDatabaseFunction);

// this is an event function
// that event delete the client from database
var deleteClientFromDatabaseFunction = function deleteClientFromDatabaseFunction()
{
    // if form is not blank
    if(dataFromForm.number != ''){
         connection.query('SELECT * FROM chipID;', 
            function (error, rows) 
            {
                // error handling
                if (error) throw error;

                var checkValue = 0;
                var checkIndex = 0;
                // if the number we want to delete is in database
                // check value cant be zero
	            for(var i=0;i<rows.length;i++){
                    if ( dataFromForm.number == registeredClients.subscriptionName[i] ){
                        console.log(dataFromForm.number);
                        checkValue++;
                        checkIndex = i;
                    }
                }
                console.log(dataFromForm.number);
                // if checkValue is not zero, that means the number registered in database
                if (checkValue != 0){
                    
                    getDatafromchipIDtable();

                    if (tagDatas.chipIDqueue != ''){
                        var nthVar = tagDatas.chipIDqueue.slice(-1); 
                        var sensorQueueNumber = parseInt(nthVar[0].slice(-1)) ;
                        var sensorQueue = 's'+ sensorQueueNumber;
                    }
                    else{
                        return true;
                    }
                    
                    // if the client isnt registred yet,
                    // save the new client to the chipID table in mysqldatabase 
                    // delete from chipId table
                    connection.query('DELETE FROM chipID WHERE number = "'+ dataFromForm.number +'"' ,
                        function (err, result) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                //console.log(result);
                                console.log("Deleted succesfully from chipID table");
                            }
                        }
                    );
                    //checkIndex++;
                    //console.log(dataFromForm.number + rows[checkIndex].queue);
                    // delete related table from the database 
                    connection.query('DROP TABLE '+ dataFromForm.number ,
                        function(err, result){
                        // Case there is an error during the creation
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                //console.log(result);
                                console.log("Client's table deleted succesfully");
                            }
                        }
                    );
                    //console.log(dataFromForm.number + sensorQueue);
                    // DELETE FROM registeredClients TABLE
                    connection.query('DELETE FROM registeredClients WHERE clientName = "'+ dataFromForm.number +'"' ,
                        function (err, result) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log("ALSO UNSUBSCRIBED");
                            }
                        }
                    );

                    

                }
                else{
                        console.log('Wrong client ID');
                }
            }
        );
    }
    
    // subscribe to all clients from starting over
    subscribeAll();
       
}
// when deleteClientFromDatabase event emitted, deleteClientFromDatabaseFunction starts
eventEmitter.on('deleteClientFromDatabase', deleteClientFromDatabaseFunction);


var unsubsribeClientFunction = function unsubsribeClientFunction()
{
    // if form is not blank
    if(dataFromForm.unsubscribe != ''){
         connection.query('SELECT * FROM chipID;', 
            function (error, rows) 
            {
                // error handling
                if (error) throw error;

                var checkValue = 0;
                var checkIndex = 0;
                // if the number we want to delete is in database
                // check value cant be zero
	            for(var i=0;i<rows.length;i++){
                    if ( dataFromForm.unsubscribe == registeredClients.subscriptionName[i] ){
                        checkValue++;
                        checkIndex = i;
                    }
                }
                // if checkValue is not zero, that means the number registered in database
                if (checkValue != 0){
                    
                    getDatafromchipIDtable();
                    getDatafromRegisteredClientsTable();
                    

                    if (tagDatas.chipIDqueue != ''){
                        var nthVar = tagDatas.chipIDqueue.slice(-1); 
                        var sensorQueueNumber = parseInt(nthVar[0].slice(-1)) ;
                        var sensorQueue = 's'+ sensorQueueNumber;
                    }
                    else{
                        return true;
                    }
                    
                    // if the client isnt registred yet,
                    // save the new client to the chipID table in mysqldatabase 
                    // delete from chipId table
                    connection.query('DELETE FROM chipID WHERE number = "'+ dataFromForm.unsubscribe +'"' ,
                        function (err, result) {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log("Deleted succesfully from chipID table");
                            }
                        }
                    );
                    //checkIndex++;
                    // COUNT THE REGISTERED
                    //getDatafromRegisteredClientsTable();

                    
                }
                else{
                        console.log('Wrong client ID');
                }
            }
        );
    }
    
    // subscribe to all clients from starting over
    subscribeAll();
       
}
// when unsubsribeClient event emitted, unsubsribeClientFunction starts
eventEmitter.on('unsubsribeClient', unsubsribeClientFunction);




//database settingsd
var connection = mysql.createConnection({
  	host: 'localhost',
  	user: 'root',
  	password: 'HADIBAKALIM',
  	database: 'datas',
  	multipleStatements: true
});

connection.connect();

var tagDatas = {
    chipIDname : [],
	chipIDnumber : [],
    chipIDqueue : [],
    chipIDunixTime : [],
    chipIDid : [],
    chipIDdescription : []
};

var sensorAll = [];

var dataFromForm = {
	number : [],
    queue : [],
    description : [],
    unsubscribe : []
};

var registeredClients = {
	subscriptionName : [],
    description : [],
    ID : []
};


// set the view engine to ejs on ExpressJS
app.set('view engine', 'ejs');

// set the main page on ExpressJS
app.get('/', function(req, res) {
		// use res.render to load up an ejs view file
    		res.render('pages/index');
	});

app.get("/burak", function(request, response) {
  response.end("BURAK SATAR was here!");
});

// express ajax, reachable website from public
app.use('/public', express.static('public'));


app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json 
app.use(bodyParser.json())


function getDatafromchipIDtable(){
    
    connection.query('SELECT * FROM chipID;', function (error, rows) 
    {
        tagDatas.chipIDname = [];
        tagDatas.chipIDnumber = [];
        tagDatas.chipIDqueue = [];
        tagDatas.chipIDunixTime = [];
        tagDatas.chipIDid = [];
        tagDatas.chipIDdescription = [];

        for(var i=0;i<rows.length;i++){
            tagDatas.chipIDname.push( rows[i].number + rows[i].queue );
     	    tagDatas.chipIDnumber.push(rows[i].number);
            tagDatas.chipIDqueue.push( rows[i].queue );
            tagDatas.chipIDunixTime.push(rows[i].unixTime);
            tagDatas.chipIDid.push(rows[i].id);
            tagDatas.chipIDdescription.push(rows[i].description);
    	}
    });
}


function getDatafromRegisteredClientsTable(){
    
    connection.query('SELECT * FROM registeredClients;', function (error, rows) 
    {
        registeredClients.subscriptionName = [];
        registeredClients.description = [];

        for(var i=0;i<rows.length;i++){
            registeredClients.subscriptionName.push(rows[i].clientName);
            registeredClients.description.push(rows[i].description);
    	}
    });
}


app.get('/configuration', function(req, res) {

    res.render('pages' + '/configuration',{
	//send the data with those names as an array
        tagName : tagDatas.chipIDname,
        tagNumber : tagDatas.chipIDnumber,
	    tagQueue : tagDatas.chipIDqueue,
        tagUnixTime : tagDatas.chipIDunixTime,
        tagId : tagDatas.chipIDid,
        tagDescription : tagDatas.chipIDdescription,
        tagRegistered : registeredClients.subscriptionName,
        descriptionOfRegistered : registeredClients.description
 	});
});

app.post('/configuration', function(req, res) {

    if ( req.body.number ){
        dataFromForm.number = req.body.number;
        dataFromForm.description = req.body.description;
        eventEmitter.emit('addClientCreateDatabase');
    }
    if ( req.body.numberForDelete ){
        dataFromForm.number = req.body.numberForDelete;
        eventEmitter.emit('deleteClientFromDatabase');
    }
    if ( req.body.numberForUnsubscribe ){
        dataFromForm.unsubscribe = req.body.numberForUnsubscribe;
        eventEmitter.emit('unsubsribeClient');
    }
    // use res.render to load up an ejs view file
    res.render('pages' + '/configuration',{
	//send the data with those names as an array
        tagName : tagDatas.chipIDname,
        tagNumber : tagDatas.chipIDnumber,
	    tagQueue : tagDatas.chipIDqueue,
        tagUnixTime : tagDatas.chipIDunixTime,
        tagId : tagDatas.chipIDid,
        tagDescription : tagDatas.chipIDdescription,
        tagRegistered : registeredClients.subscriptionName,
        descriptionOfRegistered : registeredClients.description
 	});
});


subscribeAll();

// main base for prototype
var sensorObjectBase = function  (){ 
    this.testValue = true;
};

// define name of the variables, call from main base
var sensorObject = function( chipId ){
    sensorObjectBase.call(this);
	this.chipId = chipId;
}

// use prototype from sensorObjectBase, even if it is not defined
sensorObject.prototype = Object.create(sensorObjectBase.prototype);
// create the prototype
sensorObject.prototype.constructor = sensorObject;
 // define the function of prototype
sensorObject.prototype.calling = function(){
	// call the main function with variables
	mqtt2sql(this.chipId);
}


function subscribeAll(){
    // define client
    client.end();

    client  = mqtt.connect('mqtt://192.168.24.130')

    client.on('connect', function () {

        getDatafromchipIDtable();
        
        connection.query('SELECT * FROM chipID;', function (error, rows) 
        {
            // gets data from database and assing them related array
	        for(var i=0;i<rows.length;i++){
                sensorAll[i] = new sensorObject( tagDatas.chipIDname[i] );
                sensorAll[i].calling();
                client.subscribe('/data/' + tagDatas.chipIDname[i]);
            }
        });
    })
}


// send it every 5 seconds
app.post('/getBuff', function(req, res) {

    // gets data from database and assing them related array               
    // use res.render to load up an ejs view file
    getDatafromchipIDtable();
    getDatafromRegisteredClientsTable();

    res.send({
        tagName : tagDatas.chipIDname,
        tagNumber : tagDatas.chipIDnumber,
	    tagQueue : tagDatas.chipIDqueue,
        tagUnixTime : tagDatas.chipIDunixTime,
        tagId : tagDatas.chipIDid,
        tagDescription : tagDatas.chipIDdescription,
        tagRegistered : registeredClients.subscriptionName,
        descriptionOfRegistered : registeredClients.description
	});
});


// if a data goes to mqtt broker and if server subscribe one those topic
// gets the data and write them into sqldatabase
function mqtt2sql(chipIDofSensor) {
        //mqtt client is on
    //console.log(chipIDofSensor);
    client.on('message', function (topic, message) {
        // message is Buffer
        //console.log(chipIDofSensor);
        // if topic equals to one of topic that client(server) subscribe
        if(topic == '/data/' + chipIDofSensor) {
    
            var dynamicChipValue = chipIDofSensor.slice(-1);
            //console.log(dynamicChipValue);

            //get data as a string 
            data = message.toString(); 
      
            //split it by comma
            var newbuff = data.split(",");
            //console.log(newbuff);
            //assign the data to related post values   
            var post  = {
                temp: newbuff[0], 
                res: newbuff[1], 
                adc: newbuff[2], 
                mux: newbuff[3]
            };
   
            // put post values to table of sensor1 in MYSQL database
            var query = connection.query('INSERT INTO '+ chipIDofSensor + ' SET ?', post , function (err, result) {
            
                if (err) {
                    //console.error(err);
        		    return;
      		    }
      		    //console.error(result);

            });        
        }              
    })
}
app.listen(8080);
console.log('the port: 8080, is active ');
