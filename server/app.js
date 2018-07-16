﻿const express = require('express'),
  http = require('http'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser');
mongoose.connect('mongodb://172.20.10.2:3001/recipeDB')
  .then(() => console.log('DB running on port 3001'))
  .catch((e) => {
    console.error(`DB fail: ${e}`)
  });
const app = express(),
  server = http.createServer(app);
/////mongoose schema
const recipeSchema = new mongoose.Schema({
  time: Number,
  dateModify: Number,
  recipeName: String,
  recipeDetail: String

});
const DB = mongoose.model('recipeDB', recipeSchema);
const recipeDB = DB.aggregate([{
  $group: {
    _id: '$time',
    data: {
      $push: {
        time: '$time',
        dateModify: '$dateModify',
        recipeName: '$recipeName',
        recipeDetail: '$recipeDetail',
      },
    },
  },

}]);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});
app.use(bodyParser.json());

app.get('/api/getRecipe', (req, res) => {
  recipeDB
    .then(data =>
      data.map(e => e.data[e.data.length - 1])
    )
    .then(data => {
      return data
    })
    .then(data => res.send(JSON.stringify({
      data,
    })))
    .catch(er => console.error(er))
});

app.post('/api/addRecipe', (req, res) => {
  DB.create(req.body).then(() =>
    recipeDB
    .then(data =>
      data.map(e => e.data[e.data.length - 1])
    )
    .then(data => res.send(JSON.stringify({
      data,
    })))
    .catch(er => console.error(er))
  )
});

app.post('/api/versionRecipe', (req, res) => {

  DB.find({
      time: req.body.data
    })
    .then(data => res.send(JSON.stringify({
      view: true,
      data,
    })))
    .catch(er => console.error(er))
});


app.post('/api/deleteRecipe', (req, res) => {

  const remove = () => {
    if (req.body.view) {
      return DB.remove({
        dateModify: req.body.data
      })
    }
    return DB.remove({
      time: req.body.data
    })

  }
  remove()
    .then(
      () => {
        if (!req.body.view) {
          return (
            recipeDB
          )
        }
        return DB.find({
          time: req.body.time
        })
      })
    .then(data => {
      if (!req.body.view) return data.map(e => e.data[e.data.length - 1])
      return data
    })
    .then(data => res.send(JSON.stringify({
        data,
        view: req.body.view,
      }))
    )
    .catch(er => console.error(er))
});
//////////
/////////
server.listen(3000, () => {
  console.log("Express server listening on port " + 3000);
});