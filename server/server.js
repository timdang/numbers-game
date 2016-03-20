'use strict';

const koa = require('koa');
const router = require('koa-router')();
const path = require('path');
const r = require('rethinkdb');
const config = require('../database/config');
const job = require('./controllers/jobs');
const user = require('./controllers/user');
// const parse = require('co-body');
const http = require('http');
const app = koa();
const spa = require('koa-spa');
const passport = require('koa-passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;;
const tokens = require('./config');


// Create a rethinkdb connection, and save it in req._rdbConn
function* createConnection(next) {
  try {
    const conn = yield r.connect(config.rethinkdb);
    this._rdbConn = conn;
  } catch (err) {
    this.status = 500;
    this.body = err.message || http.STATUS_CODES[this.status];
  }
  yield next;
}

// Close the RethinkDB connection
function* closeConnection(next) {
  this._rdbConn.close();
  yield next;
}

app.use(createConnection);
app.use(router.routes());

router.post('/api/jobs/', job.addJob);
router.delete('/api/jobs/', job.deleteJob);
router.put('/api/jobs/', job.updateJob);

router.get('/api/jobs/:source/:keywords/:city', job.list);
router.get('/api/jobs/:source/:keywords', job.list);

router.post('/api/users/', user.addUser);
router.delete('/api/users/', user.deleteUser);

// app.use(closeConnection);

//Google Auth routes
router.get('/auth/google', passport.authenticate('google',{scope:['email','profile']}));
router.get('/auth/google/callback', 
  passport.authenticate('google',{
    successRedirect:'/dashboard',
    failureRedirect: '/'   
  }
));


// app.use(serve(path.join(__dirname, '../dist')));
app.use(spa(path.join(__dirname, '../dist'), {
  index: 'index.html',
  404: '404.html',
  routeBase: '/'
}));

app.listen(3000);
console.log('server running on port 3000');
