// import dependencies you will use
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const session = require('express-session');
//const bodyParser = require('body-parser'); // not required for Express 4.16 onwards as bodyParser is now included with Express
// set up expess validator
const {check, validationResult} = require('express-validator'); //destructuring an object

//connect to DB
mongoose.connect('mongodb://localhost:27017/propertymaintenance',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//define the model
const Request = mongoose.model('Request',{
    userName : String,
    userEmail : String,
    userDescription : String,
    userImageName : String

});

// define model for admin users

const User = mongoose.model('User', {
    uName: String,
    uPass: String
});

// set up variables to use packages
var myApp = express();

// set up the session middleware
myApp.use(session({
    secret: 'myconfidentialdata',
    resave: false,
    saveUninitialized: true
}));

// myApp.use(bodyParser.urlencoded({extended:false})); // old way before Express 4.16
myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16
myApp.use(fileUpload()); // set up the express file upload middleware to be used with Express
// set path to public folders and view folders

myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');


var nameRegex = /^[a-zA-Z0-9]{1,}\s[a-zA-Z0-9]{1,}$/;

// set up different routes (pages) of the website
// render the home page
myApp.get('/',function(req, res){
    res.render('home'); // will render views/home.ejs
});

myApp.get('/login',function(req, res){
    res.render('login'); // will render views/home.ejs
});

myApp.post('/login', function(req, res){
    // fetch username and pass
    var uName = req.body.uname;
    var uPass = req.body.upass;

    // find it in the database
    User.findOne({uName: uName, uPass: uPass}).exec(function(err, user){
        // set up the session variables for logged in users
        console.log('Errors: ' + err);
        if(user){
            req.session.uName = user.uName;
            req.session.loggedIn = true;
            // redirect to dashboard
            res.redirect('/allrequests');
        }
        else{
            res.redirect('/login'); // in case you want to redirect the user to login
            // alternatively, render login form with errors
            //res.render('login', {error: 'Incorrect username/password'}); // complete the logic on login.ejs file to show the error only if error is undefined.
        }
    });
});

// show all cards
myApp.get('/allrequests',function(req, res){
    if(req.session.loggedIn){
        // write some code to fetch all the cards from db and send to the view allcards
        Request.find({}).exec(function(err, requests){
            console.log(err);
            console.log(requests);
            res.render('allrequests', {requests:requests}); // will render views/allcards.ejs
        });
    }
    else{
        res.redirect('/login');
    }
});

myApp.get('/logout', function(req, res){
    // destroy the whole session
    // req.session.destroy();
    // alternatively just unset the variables you had set 
    req.session.uName = '';
    req.session.loggedIn = false;
    res.redirect('/login');
});

// show only one card depending on the id, just like amazon products
// https://www.amazon.ca/dp/B08KJN3333
myApp.get('/print/:requestid', function(req, res){
    // write some code to fetch a card and create pageData
    var requestId = req.params.requestid;
    Request.findOne({_id: requestId}).exec(function(err, request){
        console.log(request);
        res.render('request', request); // render card.ejs with the data from card
    });
})

//delete a card
myApp.get('/delete/:requestid', function(req, res){
    // write some code to fetch a card and create pageData
    var requestId = req.params.requestid;
    Request.findByIdAndDelete({_id: requestId}).exec(function(err, request){
        console.log(request);
        res.render('delete', request); // render card.ejs with the data from card
    });
})

//edit a card
myApp.get('/edit/:requestid', function(req, res){
    // write some code to fetch a card and create pageData
    var requestId = req.params.requestid;
   //write some logic to show the card
   Request.findOne({_id: requestId}).exec(function(err, request){
   res.render('edit', request);
});
})

myApp.post('/editprocess/:requestid',function(req,res){  
    if(!req.session.loggedIn)
    {
        res.redirect('login');
    }
    else
    {
        //fetch all the form fields
        var userName = req.body.userName; // the key here is from the name attribute not the id attribute
        var userEmail = req.body.userEmail;
        var userDescription = req.body.userDescription;

        // fetch the file 
        // get the name of the file
        var userImageName = req.files.userImage.name;
        // get the actual file
        var userImageFile = req.files.userImage; // this is a temporary file in buffer.

        // save the file
        // check if the file already exists or employ some logic that each filename is unique.
        var userImagePath = 'public/uploads/' + userImageName;
        // move the temp file to a permanent location mentioned above
        userImageFile.mv(userImagePath, function(err){
            console.log(err);
        });

        var requestId = req.params.requestid;
        //write some logic to show the card
        Request.findOne({_id: requestId}).exec(function(err, request){
        request.userName = userName;
        request.userEmail = userEmail;
        request.userDescription = userDescription;
        request.userImageName = userImageName;
        request.save();
        res.render('request', request);
        });
    }
});

myApp.post('/process',[
    check('userDescription', 'Please enter a description.').not().isEmpty(),
    check('userEmail', 'Please enter a valid email').isEmail(),
    check('userName', 'Please enter firstname and lastname').matches(nameRegex)
], function(req,res){

    // check for errors
    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty())
    {
        res.render('home',{er: errors.array()});
    }
    else
    {
        //fetch all the form fields
        var userName = req.body.userName; // the key here is from the name attribute not the id attribute
        var userEmail = req.body.userEmail;
        var userDescription = req.body.userDescription;
       

        // fetch the file 
        // get the name of the file
        var userImageName = req.files.userImage.name;
        // get the actual file
        var userImageFile = req.files.userImage; // this is a temporary file in buffer.

        // save the file
        // check if the file already exists or employ some logic that each filename is unique.
        var userImagePath = 'public/uploads/' + userImageName;
        // move the temp file to a permanent location mentioned above
        userImageFile.mv(userImagePath, function(err){
            console.log(err);
        });

        // create an object with the fetched data to send to the view
        var pageData = {
            userName : userName,
            userEmail : userEmail,
            userDescription : userDescription,
            userImageName : userImageName
           
        }

        var myRequest = new Request(pageData);
        myRequest.save();
        // send the data to the view and render it
        //res.render('request', pageData);
        res.render('thankyou');
    }
});

// setup routes

myApp.get('/setup', function(req, res){

    let userData = [
        {
            uName: 'admin',
            uPass: 'admin'
        }
    ]
    User.collection.insertMany(userData);
    res.send('data added');
});

// start the server and listen at a port
myApp.listen(8080);

//tell everything was ok
console.log('Everything executed fine.. website at port 8080....');


