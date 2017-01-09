var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// var sg = require('sendgrid')(process.env.SENDGRID_KEY);


var emailSvc = require('./services/email.svc.js');
var app = express();

app
    .use(express.static('client'))
    .use(bodyParser.json());

app.route('/api/posts')
    .get(all)
    .post(create);

app.route('/api/movies')
    .get(allMovies);
    
app.route('/api/posts/:id')
    .get(read)
    .put(update)
    .delete(del);

app.route('/api/movies/:id')
    .get(readMovies);

app.route('/api/purchases')
    .post(function(req, res, next) {
         stripe.charges.create({
             amount: req.body.amountToCharge,
             currency: 'usd',
             source: req.body.token,
             description: 'ticket purchase'
        })
        .then (function(success) {
            console.log(success);
            res.sendStatus(201);
            //success.id
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        })
    });

app.route('/api/contact')
    .post(function(req,res,next) {
        emailSvc.sendEmail('steelcityflicks@gmail.com', req.body.fullname, req.body.fromEmail, req.body.subject, req.body.content)
            .then(function(success) {
                console.log(success);
                console.log('check');
                res.send('email sent!');
            }, function(err) {
                console.log(err);
                res.sendStatus(500);
            });
    });
    
app.use(handleError);



app.listen(3000);
console.log('Server listening on port 3000');



function sendResponse(res, data) {
    var statusCode = 200
    var header = {
        'Content-Type': 'application/json'
    };
    res.writeHead(statusCode, header);
    res.end(data);
}

function handleError(err, req, res, next) {
    if (err instanceof Error) {
        var error = {
            code: 500,
            message: err.message
        };
        var header = {
            'Content-Type': 'application/json'
        };
        res.writeHead(500, header);
        res.end(JSON.stringify(error));
    } else {
        throw err;
    }
}

function all(req, res, next){
	var file = path.join(__dirname, 'data.json');
	fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
		    sendResponse(res, data);
        }
	});
}

function allMovies(req, res, next){
	var file = path.join(__dirname, 'movies.json');
	fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
		    sendResponse(res, data);
        }
	});
}


function del(req, res, next) {
    var id = req.params.id;
        file = path.join(__dirname, 'data.json');
    fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
            var posts;
            try {
                posts = JSON.parse(data);
            } catch (e) {
                var error = new Error('Corrupted datastore');
                return next(error);
            }
            var found = false;
            var foundAt;
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                if (post.id === id) {
                    found = true;
                    foundAt = i;
                    break;
                }
            }
            if (found) {
                posts.splice(foundAt, 1);
                fs.writeFile(file, JSON.stringify(posts),'utf8' , function(err){
                    if(err) {
                        var error = new Error('Error writing to datastore');
                        return next(error);
                    } else {
                        sendResponse(res, "{}");
                    }
                });
            } else {
                var error = new Error('Post not found.');
                return next(error);
            }
        }
    });
}

function update(req, res, next) {
    var newPost = req.body,
        id = req.params.id;
    var file = path.join(__dirname, 'data.json');
    fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
            var posts;
            try {
                posts = JSON.parse(data);
            } catch (e) {
                var error = new Error('Corrupted datastore');
                return next(error);
            }
            var found = false;
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                if (post.id === id) {
                    post.title = newPost.title;
                    post.author = newPost.author;
                    post.content = newPost.content;
                    found = true;
                    break;
                }
            }
            if (found) {
                fs.writeFile(file, JSON.stringify(posts),'utf8' , function(err){
                    if(err) {
                        var error = new Error('Error writing to datastore');
                        return next(error);
                    } else {
                        sendResponse(res, "{}");
                    }
                });
            } else {
                var error = new Error('Post not found.');
                return next(error);
            }
        }
    });
}

function read(req, res, next) {
    var postid = req.params.id;
    var file = path.join(__dirname, 'data.json');
    fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
            var posts;
            try {
                posts = JSON.parse(data);
            } catch (e) {
                var error = new Error('Corrupted datastore');
                return next(error);
            }
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                if (post.id && post.id === postid) {
                    sendResponse(res, JSON.stringify(post));
                    return;
                }
            }
            var error = new Error('Post not found.');
            return next(error);
        }
    });
}

function readMovies(req, res, next) {
    var id = req.params.id;
    var file = path.join(__dirname, 'movies.json');
    fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
            var posts;
            try {
                posts = JSON.parse(data);
            } catch (e) {
                var error = new Error('Corrupted datastore');
                return next(error);
            }
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                if (post.id && post.id === id) {
                    sendResponse(res, JSON.stringify(post));
                    return;
                }
            }
            var error = new Error('Movie not found.');
            return next(error);
        }
    });
}

function create(req, res, next) {
    var post = req.body;
    post.createdAt = new Date();
    post.id = crypto.randomBytes(5).toString('hex');
    var file = path.join(__dirname, 'data.json');
    fs.readFile(file, function(err, data) {
        if (err) {
            var error = new Error('Error reading datastore');
            return next(error);
        } else {
            var posts;
            try {
                posts = JSON.parse(data);
            } catch (e) {
                var error = new Error('Corrupted datastore');
                return next(error);
            }
            posts.push(post);
            fs.writeFile(file, JSON.stringify(posts),'utf8' , function(err){
                if(err) {
                    var error = new Error('Error writing to datastore');
                    return next(error);
                } else {
                    sendResponse(res, JSON.stringify({id: post.id}));
                }
            });
        }
    });
}

