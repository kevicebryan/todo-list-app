//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Mongoose here:
mongoose.connect(process.env.MONGO_ATLAS_URI, {
  useNewUrlParser: true,
});

const itemSchema = mongoose.Schema({
  name: String,
});
const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Insert a new Task",
});
const item2 = new Item({
  name: "Study",
});
const item3 = new Item({
  name: "Play Games",
});

const getDefaultDoc = function () {
  Item.insertMany([item1], function (err) {
    if (err) console.log(err);
    else console.log("Added Default Items Succesfully");
  });
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = new mongoose.model("List", listSchema);

// GET - POST - LISTEN
app.get("/", async function (req, res) {
  Item.find({}, async function (err, items) {
    if (items.length === 0) {
      const defaultDoc = await getDefaultDoc();
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, function (err, foundList) {
      if (!err) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect(`/${listTitle}`);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const delId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: delId }, function (err) {
      if (err) console.log(err);
      else console.log(`Successfully deleted`);
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: delId } } },
      function (err) {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/:customList", async function (req, res) {
  const listName = _.capitalize(req.params.customList);
  if (listName === "About") {
    return res.render("about");
  }
  List.findOne({ name: listName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // console.log(`${listName} DOES NOT EXIST`);
        const list = new List({
          name: listName,
          items: [item1, item2, item3],
        });
        list.save(function (err) {
          if (!err) {
            res.redirect(`/${listName}`);
          }
        });
      } else {
        // console.log(`${listName} ALREADY EXIST`);
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// Heroku Port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
// app.listen(port, function () {
//   console.log("Server has successfully started!");
// });

// For LOCAL HOST
app.listen(3000, function () {
  console.log("Server has successfully started!");
});
