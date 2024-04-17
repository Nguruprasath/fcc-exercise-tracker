
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const mySecret = process.env['MONGO_URI']

mongoose.connect(mySecret).catch((err) => console.log(err));

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error: " + err);
});

let userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    }
  },
);

let User = mongoose.model("User", userSchema);

let exerciseSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    description: String,
    duration: Number,
    date: Date,
  },
);

let Exercise = mongoose.model("Exercise", exerciseSchema);


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  let username = req.body.username;
  let existingUser = await User.findOne({ username })

  if (username === ""){
    res.json({error: "username is required"})
  }

  if (existingUser){
    return res.json(existingUser)
  }

  let user = await User.create({
    username
  })

  res.json(user)
});

app.get("/api/users", async (req, res) => {
  let usersList = await User.find();
  res.json(usersList);
});


app.post("/api/users/:_id/exercises", async (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date 


  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.json({error: "unknown userId"})
    } else {
      const newExercise = await Exercise.create({
        userId,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await newExercise.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (err) {
    console.log(err)
    res.json({
      error: "something went wrong"
    })
  }

  // if (date == "Invalid Date"){
  //   date = new Date().toDateString()
  // } else {
  //   date = new Date(date).toDateString()
  // }

  // if (description === ""){
  //   return res.json({error: "description is required"})
  // }

  // if (duration === ""){
  //   return res.json({error: "duration is required"})
  // } 

  // let user = await User.findById(userId).select("username")

  // if (!user){
  //   return res.json({error: "unknown userId"})
  // } 

  // let exercise = await Exercise.create({
  //   username: user.username,
  //   description, 
  //   duration, 
  //   date,
  //   userId,
  // });

  // return res.json({
  //   _id: user._id,
  //   username: user.username,
  //   date,
  //   duration,
  //   description,
  // });
});


app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  let userId = req.params._id;
  let user = await User.findById(userId);

  // let count = await Exercise.countDocuments({userId})
  // let log = await Exercise.find({userId})

  if (!user) {
    return res.json({ error: "unknown userId" });
  }

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }

  let filter = {
    userId
  }

  if (from || to){
    filter.date = dateObj
  }

  const exercises = await Exercise.find(filter)
    .limit(+limit ?? 999)

  const count = exercises.length;

  const log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count,
    log
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
