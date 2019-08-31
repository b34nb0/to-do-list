//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Set up mongoose to connect to database
mongoose.connect("mongodb+srv://admin-fabian:Test123@cluster0-zfroq.mongodb.net/todolistDB", {useNewUrlParser: true});

// Create item schema for database
const itemsSchema = {
  name: String
};

// New model
const Item = mongoose.model("Item", itemsSchema);

// 3 new items
const item1 = new Item({
  name: "Finish project"
});
const item2 = new Item({
  name: "Tidy up"
});
const item3 = new Item({
  name: "Cook dinner"
});

const defaultItems = [item1, item2, item3];

// Create list schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// List model
const List = mongoose.model("List", listSchema);

// GET response
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    // If no items are found in the database -> insert them
    // Else -> just display
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Successfully added default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

// POST method to insert new item
app.post("/", function(req, res){

  // Get item and list from the submit form
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Create new item record
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// POST method to delete checked items
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Remove checked item from database
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
          if(!err){
            res.redirect("/" + listName);
          }
        });
      }
    });
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      if(!foundList) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });


});

app.get("/about", function(req, res){
  res.render("about");
});


// Listen on port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port: " + port);
});
