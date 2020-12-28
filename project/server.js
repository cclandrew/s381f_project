const express = require('express');
const session = require('cookie-session');
//const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidableMiddleware = require('express-formidable');
const { Router } = require('express');
//const { Long } = require('mongodb');
const mongourl = '';
const dbName = '';
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })


app.set('view engine', 'ejs')

const SECRETKEY = 'COMPS381F';


const users = new Array(
	{name: 'demo', password: ''},
	{name: 'student', password: ''}
);

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
}));

app.use(function(req, res, next) {
    res.locals.username = req.session.username;
    next();
});

// support parsing of application/json type post data
app.use(formidableMiddleware());
////app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));



const findDocument = (db, criteria, callback) => {
    let cursor = db.collection('restaurants').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findDocument: ${docs.length}`);
        callback(docs);
    });
}

const updateDocument = (criteria, updateDoc, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
         db.collection('restaurants').updateOne(criteria,
            {
                $set : updateDoc
            },
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const handle_Find = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);   
        findDocument(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
        
            res.status(200).render('home',{nRestaurants: docs.length, restaurants: docs});
        });
   
    });
}

const handle_result = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName); 
       var searDoc ={}
        searDoc['name'] = req.fields.name; 
        findDocument(db,searDoc, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
        
            res.status(200).render('result',{restaurants: docs});
        });
    });       
}


const handle_Details = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        findDocument(db, DOCID, (docs) => {  // docs contain 1 document (hopefully)
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', {restaurants: docs[0]});
        });
    });
}

const handle_Edit = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        let cursor = db.collection('restaurants').find(DOCID);
        cursor.toArray((err,docs) => {
            client.close();
            assert.equal(err,null);
            res.status(200).render('edit',{restaurants: docs[0]});       
        });
    });
}


const handle_score = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        let cursor = db.collection('restaurants').find(DOCID);
        cursor.toArray((err,docs) => {
            client.close();
            assert.equal(err,null);
            res.status(200).render('rate',{restaurants: docs[0]});       
        });
    });
}

const handle_Update = (req, res, criteria) => {
   
        var DOCID = {};
        DOCID['_id'] = ObjectID(req.fields._id);
        var updateDoc = {};
        updateDoc['name'] = req.fields.name;
        updateDoc['borough'] = req.fields.borough;
        updateDoc['cuisine'] = req.fields.cuisine;
        updateDoc.address = {}
        updateDoc.address['street'] = req.fields.street;
        updateDoc.address['zipcode'] = req.fields.zipcode;
        updateDoc.address['building'] = req.fields.building;
        updateDoc.address.coord = {}
        updateDoc.address.coord ['lon']= req.fields.lon;
        updateDoc.address.coord ['lat']= req.fields.lat;


        if (req.files.filetoupload.size > 0) {
            fs.readFile(req.files.filetoupload.path, (err,data) => {
                assert.equal(err,null);
                updateDoc['photo'] = new Buffer.from(data).toString('base64');
                updateDocument(DOCID, updateDoc, (results) => {
                    res.status(200).render('info', {message: `Updated ${results.result.nModified} document(s)`})        
                });
            });
        } else {
            updateDocument(DOCID, updateDoc, (results) => {
                res.status(200).render('info', {message: `Updated ${results.result.nModified} document(s)`})      
            });
        }

}

      

const handle_Insert = (req, res, criteria) => {
   
    console.log(req.body)
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null,err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        var newDoc = {};
        newDoc['name'] = req.fields.name;
        newDoc['borough'] = req.fields.borough;
        newDoc['cuisine'] = req.fields.cuisine;
        newDoc.address = {}
        newDoc.address['street'] = req.fields.street;
        newDoc.address['zipcode'] = req.fields.zipcode;
        newDoc.address['building'] = req.fields.building;
        newDoc.address.coord = {}
        newDoc.address.coord ['lon']= req.fields.lon;
        newDoc.address.coord ['lat']= req.fields.lat;
        newDoc.grades ={}
        newDoc.grades['user'] = req.fields.user;
        newDoc.grades['score'] = req.fields.score;
        newDoc['owner'] = req.fields.user;
 
       if (req.files.filetoupload && req.files.filetoupload.size > 0) {
            fs.readFile(req.files.filetoupload.path, (err,data) => {
                assert.equal(err,null);
                newDoc['photo'] = new Buffer.from(data).toString('base64');
                db.collection('restaurants').insertOne(newDoc,(err,results) => {
                    res.status(200).render('info', {message: `inserted one document`})  
                    assert.equal(err,null);
                    client.close()                     
                })    
            });
        } else{
            db.collection('restaurants').insertOne(newDoc,(err,results) => {
                res.status(200).render('info', {message: `inserted one document`}) 
                assert.equal(err,null);
                client.close()
             
            })        
        } 
    })
}

const add_score = (req, res, criteria) => {

    console.log(req.body)
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null,err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        var addDoc = {};
        addDoc.grades ={}
        addDoc.grades['score'] = req.fields.score;
        addDoc.grades['user'] = req.fields.user;
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        if (req.files.filetoupload && req.files.filetoupload.size > 0) {
            fs.readFile(req.files.filetoupload.path, (err,data) => {
                assert.equal(err,null);
                newDoc['photo'] = new Buffer.from(data).toString('base64');
                db.collection('restaurants').insertOne(addDoc,(err,results) => {
                    res.status(200).render('info', {message: `inserted one document`})  
                    assert.equal(err,null);
                    client.close()                     
                })
            });
        } else {
            db.collection('restaurants').insertOne(DOCID,addDoc,(err,results) => {
                res.status(200).render('info', {message: `inserted score`}) 
                assert.equal(err,null);
                client.close()
             
            })        
        }      
    })
}

const handle_Delete = (req, res, criteria) => {

    let DOCID = {};
    DOCID['_id'] = ObjectID(criteria._id)
    
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            if(users.name == req.fields.owner){
            db.collection('restaurants').deleteMany(DOCID,(err) => {
                assert.equal(err,null)
                client.close()
                res.status(200).render('info', {message: `remove one document`})    
                console.log("delete successfully");  

            })
        } else{

            res.status(200).render('info', {message: `you aren't owner`})  

        }
        });
       
    } 

    app.post('/login', function(req,res) {
        users.forEach((user) => {
            if (user.name == req.fields.name && user.password == req.fields.password) {
                // correct user name + password
                // store the following name/value pairs in cookie session
                req.session.authenticated = true;        // 'authenticated': true
                req.session.username = req.fields.name;	 // 'username': req.body.name	
                res.status(200).render('logon',{name:req.session.username});	
            }
        });
        res.redirect('/');
    });
    
    app.get('/login', function(req, res,){
        res.status(200).render('login',{});
    });


const handle_map = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        findDocument(db, DOCID, (docs) => {  // docs contain 1 document (hopefully)
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('map', {restaurants: docs[0]});
        });
    });
}

app.get('/', (req,res) => {
	console.log(req.session);
	if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
        res.status(200).render('logon',{name:req.session.username});
	}
});

app.get("/map", (req,res) => {
    handle_map(res, req.query);
});

app.post('/search', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName); 
       var searDoc ={}
        searDoc['name'] = req.fields.name; 
        if(restaurants.name == req.fields.name){
            db.collection('restaurants').find(req.fields.name).toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                db.close();
              });
        }
    });   
});

app.get("/map", (req,res) => {
    handle_map(res, req.query);
});


app.get('/home', (req,res) => {
    handle_Find(res, req.query.docs,req.query);
})

app.get('/details', (req,res) => {
    handle_Details(res, req.query);
})

app.post('/add', (req,res) => {
    handle_Insert(req, res, req.query);
})

app.get('/create', (req,res) => {
    res.status(200).render('create',{u:req.session.username});
})

app.get('/rate', (req,res) => {
    handle_score(res, req.query);
})

app.post('/addscore', (req,res) => {
    add_score(req, res, req.query);
})
 
app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.post('/update', (req,res) => {
    handle_Update(req, res, req.query);
})

app.get('/edit', (req,res) => {
    handle_Edit(res, req.query);
})

app.get('/delete', (req,res) => {
    handle_Delete(req, res, req.query);
})

//
// RESTful
//

/*  CREATE
curl -X POST -H "Content-Type: application/json" --data '{"bookingid":"BK999","mobile":"00000000"}' localhost:8099/api/booking/BK999

curl -X POST -F 'bookingid=BK999' -F "filetoupload=@image.png" localhost:8099/api/booking/BK999
*/
app.post('/api/restaurants/:name', (req,res) => {
    if (req.params.name) {
        console.log(req.body)
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null,err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            let newDoc = {};
			newDoc['name'] = req.fields.name;
			newDoc['borough'] = req.fields.borough;
			newDoc['cuisine'] = req.fields.cuisine;
			
            if (req.files.filetoupload && req.files.filetoupload.size > 0) {
                fs.readFile(req.files.filetoupload.path, (err,data) => {
                    assert.equal(err,null);
                    newDoc['photo'] = new Buffer.from(data).toString('base64');
                    db.collection('restaurants').insertOne(newDoc,(err,results) => {
                        assert.equal(err,null);
                        client.close()
                        res.status(200).end()
                    })
                });
            } else {
                db.collection('restaurants').insertOne(newDoc,(err,results) => {
                    assert.equal(err,null);
                    client.close()
                    res.status(200).end()
                })
            }
        })
    } else {
        res.status(500).json({"error": "missing bookingid"});
    }
})

/* READ
curl -X GET http://localhost:8099/api/restaurants/:name
*/
app.get('/api/restaurants/:name', (req,res) => {
    if (req.params.name) {
        let criteria = {};
        criteria['name'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findDocument(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing restaurants name"});
    }
})


/*  UPDATE
curl -X PUT -H "Content-Type: application/json" --data '{"mobile":"88888888"}' localhost:8099/api/booking/BK999

curl -X PUT -F "mobile=99999999" localhost:8099/api/booking/BK999 
*/
app.put('/api/restaurants/:name', (req,res) => {
    if (req.params.bookingid) {
        console.log(req.body)
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null,err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            let criteria = {}
            criteria['name'] = req.params.name

            let updateDoc = {};
            Object.keys(req.fields).forEach((key) => {
                updateDoc[key] = req.fields[key];
            })
            console.log(updateDoc)
            if (req.files.filetoupload && req.files.filetoupload.size > 0) {
                fs.readFile(req.files.filetoupload.path, (err,data) => {
                    assert.equal(err,null);
                    newDoc['photo'] = new Buffer.from(data).toString('base64');
                    db.collection('restaurants').updateOne(criteria, {$set: updateDoc},(err,results) => {
                        assert.equal(err,null);
                        client.close()
                        res.status(200).end()
                    })
                });
            } else {
                db.collection('restaurants').updateOne(criteria, {$set: updateDoc},(err,results) => {
                    assert.equal(err,null);
                    client.close()
                    res.status(200).end()
                })
            }
        })
    } else {
        res.status(500).json({"error": "missing name"});
    }
})

/*  DELETE
curl -X DELETE localhost:8099/api/booking/BK999
*/
app.delete('/api/restaurants/:name', (req,res) => {
    if (req.params.name) {
        let criteria = {};
        criteria['name'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            db.collection('restaurants').deleteMany(criteria,(err,results) => {
                assert.equal(err,null)
                client.close()
                res.status(200).end();
            })
        });
    } else {
        res.status(500).json({"error": "missing name"});       
    }
})
//
// End of Restful
//


app.get('/*', (req,res) => {
    //res.status(404).send(`${req.path} - Unknown request!`);
    res.status(404).render('info', {message: `${req.path} - Unknown request!` });
})


app.listen(process.env.PORT || 8080);
