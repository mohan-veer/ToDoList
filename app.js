const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const app = express();
const url = "mongodb+srv://*******************/toDoListDB";

//set view engine - ejs
app.set('view engine', 'ejs');

//body parser
app.use(bodyParser.urlencoded({extended:true}));

//static files
app.use(express.static('public'));

//create a db/connect to db
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

//schema
const todoListSchema = mongoose.Schema({
    taskItem: {
        type:String,
        required:true
    }
});

//create a collection/model
const todoModel = mongoose.model('todoList', todoListSchema);

//schema-2
const listSchema = mongoose.Schema({
    name: String,
    items: [todoListSchema]
});

//model-2
const list = mongoose.model("list", listSchema);

//options for date
const options = {
    weekday: "long",
    day : "numeric",
    month : "long",
};

// call for faviicon
app.get("/favicon.ico", function(req, res){
    res.status(204);
});

app.get("/", function(req, res){
    let listHeading = "To Do";
    let resultTasks = [];
    let currentDate = new Date();
    todoModel.find({}, function(err, result){
        if(err){
            console.log('Error = '+err);
        }
        else{
            result.forEach(function(doc){
                resultTasks.push(doc.taskItem);
            });
            res.render("home", {today : currentDate.toLocaleString("en-US", options), allTasks: result, listTitle : listHeading});
        }
    });    
});

app.post("/", function(req, res){
    if(req.body.newTask != null && req.body.newTask.length > 0){
        const newTaskInsert = new todoModel({
            taskItem:req.body.newTask
        });

        if(req.body.button == "To Do"){
            newTaskInsert.save(function(err){
                if(err){
                    console.log('Error while saving = '+err);
                }
                else{
                    res.redirect('/');
                }
            });
        }
        else{
            list.findOne(
                {name: req.body.button},
                function(err, results){
                    if(err){
                        console.log('Error while finding the list values : '+err);
                    }
                    else{
                        if(results.length != 0){
                            results.items.push(newTaskInsert);
                            results.save(function(err){
                                if(err){
                                    console.log("Error While Inserting new Item in Custom List");
                                }
                                else{
                                    res.redirect('/customList/'+req.body.button);
                                }
                            });
                        }
                    }
                }
            );
        }   
    }
});

app.post("/deleteTask", function(req, res){
    let completedTaskId = req.body.completed;
    const listName = _.capitalize(req.body.customListName);
    if(listName === "To do"){
        todoModel.deleteOne(
            {_id: completedTaskId},
            function(err){
                if(err){
                    console.log("while deleting -> "+err);
                }
                else{
                    res.redirect('/');
                }
            }
        );
    }
    else{

        list.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id : completedTaskId}}},
            function(err, result){
                if(err){
                    console.log('Error while deleting custom list item: '+err);
                }
                else{
                    console.log('the found item in custom list = '+result);
                    res.redirect("/customList/"+listName);
                }
            }
        );
    }
});

app.get("/customList/:routeName", function(req, res){
    const customListName = req.params.routeName;
    if(customListName != "favicon.ico"){
        const listHeading = _.capitalize(customListName);
        let resultTasks = [];
        let currentDate = new Date();
    
        list.find({
        name:listHeading
        }, function(err, results){
        if(err != null){
            console.log('Error = '+err);
        }
        else{
            if(results.length == 0){
                const newInsert = new list({
                    name: listHeading,
                    items:[{taskItem: "butter"}, {taskItem: "eggs"}, {taskItem:"apple"}]
                });
                newInsert.save(function(err){
                    if(err){
                        console.log('Not able to insert default items');
                    }
                    else{
                        console.log('Inserted default items');
                        res.redirect('/customList/'+listHeading);
                    }
                });
                
            }
            else{
                results.forEach(function(doc){
                    doc.items.forEach(function(toDis){
                        resultTasks.push(toDis);
                    });
                });
                res.render("home", {today : currentDate.toLocaleString("en-US", options), allTasks: resultTasks, listTitle : listHeading});
            }
        }  
    });
    }
    else{
        res.status(204);
    }
    
});

app.listen(3000, function(){
    console.log('Hey I am listening');
});