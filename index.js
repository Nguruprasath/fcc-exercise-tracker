const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
const { Schema } = require('mongoose');


let mongoose;
try {
  mongoose = require ('mongoose');
} catch (e) {
  console.log(e);
}
// CONNECT DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// create schema;
const ExercisesSchema = new Schema({
  user_id:{type: String, required: true },
  User: String,
  description: String,
  duration: Number,
  date: Date,
});
//create a model
const Exercise = mongoose.model("Exercies",ExercisesSchema);
// Define the schema for the User model
const UserSchema = new Schema({
  username: { type: String, required: true }
});
// Create the User model
const User = mongoose.model("User", UserSchema); 
// middlerware for parser the data
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/users', async (req, res) => {
  try {
    const userObj = new User({ username: req.body.username });
    const user = await userObj.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error creating user');
  }
});
//next api users id 
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).send('Could not find user');
    }

    const exerciseObj = new Exercise({
      user_id: id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });

    const exercise = await exerciseObj.save();

    res.json({ 
      _id: user._id,
      username: user.username, 
      description: exercise.description,
      date: new Date(exercise.date).toDateString()
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error adding exercise');
  }
});


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// it will show the users 
app.get("/api/users", async(req, res) => {
  const users = await User.find({}).select("_id username");
  if(!users) {
    res.send("no users")
  } else {
    res.json(users)
  }
})
// create logs
app.get("/api/users/:_id/logs", async (req, res) =>{
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send("could not find user");
    return;
  }
  let dataObj = {};
  if (from) {
    dataObj["$gt"] = new Date(from);
  }
  if (to) {
    dataObj["$lt"] = new Date(to);
  }
  let filter = {
    user_id: id
  };
  if (from || to) {
    filter.date = dataObj;
  }
  const exercises = await Exercise.find(filter).limit(+limit || 500);
  
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  }));
  
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
