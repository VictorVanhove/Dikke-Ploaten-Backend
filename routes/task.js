var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
/**
 * Check if the name is valid
 * @param {*} name the given name
 */
const isNameValid = function(name){
    return typeof name === "string" && name.length > 0;
};

/**
 * Check if the description is valid
 * @param {*} description the given description
 */
const isDescriptionValid = function(description){
    return typeof description === "string" && description.length > 0;
};

/**
 * Format a given task to JSON.
 * CreationDate follows the @function formatDate(date) format
 * @example 
 * { 
 *   id: id
 *   name: name,
 *   description: description,
 *   priority:priority,
 *   payout: payout,
 *   completed: completed,
 *   creationDate: creationDate,
 *   ownerId: ownerId,
 *   ownerName: onwerName,
 *   claimerId: claimerId,
 *   claimerName: claimerName
 * }
 * @param {*} task the given task
 */
const formatTask = function(task){
    return {
        id: task._id,
        name: task.name,
        description: task.description,
        priority: task.priority,
        payout: task.payout,
        completed: task.completed,
        creationDate: task.creationDate,
        ownerId: task.owner.id,
        ownerName: task.owner.name,
        claimerId: (!task.claimer) ? null: task.claimer.id,
        claimerName: (!task.claimer) ? null: task.claimer.name
    };
};

/**
 * Check if the priority is valid
 * A priority is valid if it is a Number and it is 0(low priority),1(medium priority),2(high priority) or 3(very high priority)
 * @param {*} priority the priority level
 */
const isPriorityValid = function(priority){
    return typeof priority === "number" && Number.isInteger(priority) && (priority >=0 && priority < 4);
};

/**
 * Check if the given payout is valid
 * @param {*} payout the given payout
 */
const isPayoutValid = function(payout){
    return typeof payout === "number" && payout > 0;
};


/**
 * Post a new task
 */
router.post('/new',function(req,res, next)
{
    if(!req.body.name || !req.body.description || !req.body.payout || !req.body.ownerId)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    //Check input data
    if(!isNameValid(req.body.name)|| !isDescriptionValid(req.body.description) ||
     !isPriorityValid(req.body.priority) || !isPayoutValid(req.body.payout))
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //Find the owner for the new task
    User.findById(req.body.ownerId,function(err,user){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!user)
        {
            return res.status(401).json({message: "ERR_ADD_TASK_INVALID_USER_ID"});
        }else
        {
            //Save the task
            let Task = mongoose.model('Task');
            let task = new Task();
            task.name = req.body.name;
            task.description = req.body.description;
            task.priority = req.body.priority;
            task.payout = req.body.payout;
            task.completed = false;
            task.creationDate = new Date();
            task.owner = { id: user._id, name: user.username };
            task.claimer = null;
            task.save(function(err,task){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else{
                    return res.status(200).json({message: "SUCCESS_TASK_NEW"});
                }
            });
        }
    });
});

/**
 * Edit a task
 */
router.put('/edit',function(req,res,next)
{
    if(!req.body.name || !req.body.description || !req.body.payout || !req.body.ownerId || !req.body.taskId)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    if(!isNameValid(req.body.name)|| !isDescriptionValid(req.body.description) ||
     !isPriorityValid(req.body.priority) || !isPayoutValid(req.body.payout))
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    //Find the owner first
    let User = mongoose.model('User');
    User.findById(req.body.ownerId,function(err,owner){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!owner)
        {
            return res.status(401).json({message: "ERR_EDIT_TASK_INVALID_OWNER_ID"});
        }else{
            let Task = mongoose.model('Task');
            //Find the task that needs to be edited
            //The task/owner id should match and the task cannot be completed
            Task.findOne({_id: req.body.taskId, completed: false, 'owner.id': owner._id},function(err,task){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else if(!task){
                    return res.status(401).json({message: "ERR_EDIT_TASK_INVALID_TASK_ID"});
                }else{
                    //edit and save
                    task.name = req.body.name;
                    task.description = req.body.description;
                    task.priority = req.body.priority;
                    task.payout = req.body.payout;
                    task.save(function(err,task){
                        if(err)
                        {
                            console.log(err);
                            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                        }else{
                            return res.status(200).json({message: "SUCCESS_TASK_EDIT"});
                        }
                    });
                }
            });
        }
    });
});

/**
 * Get all tasks that are open for claiming for the given user,
 * thus any tasks that are not claimed and don't have the given user as owner
 */
router.get('/available',function(req,res,next){
    
    if(!req.query.id)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //Check if the given user actually exists
    User.findById(req.query.id,function(err,user){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!user)
        {
            return res.status(401).json({message: "ERR_GET_AVAILABLE_TASKS_INVALID_USER_ID"});
        }else{
            //Loop over all tasks, exclude the tasks that either
            // - have the user as owner
            // - are claimed
            let Task = mongoose.model('Task');
            Task.find({claimer: null, 'owner.id': {$ne: user._id} },function(err,tasks){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else{
                    return res.status(200).json({tasks: tasks.map(task => formatTask(task))});
                }
            });
        }
    });
});

/**
 * Get the tasks that have a relation to the given user,
 * thus the user is either the owner or the claimer
 */
router.get('/user',function(req,res,next){
    if(!req.query.id)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //Find the given user
    User.findById(req.query.id,function(err,user){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if (!user)
        {
            return res.status(401).json({message: "ERR_GET_USER_TASKS_INVALID_USER_ID"});
        }else
        {
            let Task = mongoose.model('Task');
            //Find all tasks where the user is the owner OR where the claimer is set and its this user
            Task.find({ $or: [ 
                //User is owner
                {'owner.id': user._id },
                //User is claimer
                { $and: [
                    {claimer: {$ne: null}},
                    {'claimer.id': user._id}
                ]}
            ]},function(err,tasks){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else{
                    return res.status(200).json({tasks: tasks.map(task => formatTask(task))});
                }
            });
        }
    });
});


/**
 * Claim a given task, when the given user isn't the owner and it can still be claimed
 */
router.put('/claim',function(req,res,next){
    if(!req.body.userId || !req.body.taskId)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //Try to find the user that wants to claim a task
    User.findById(req.body.userId,function(err,claimer){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!claimer)
        {
            return res.status(401).json({message: "ERR_CLAIM_TASK_INVALID_CLAIMER_ID"});
        }else{
            //Find a non completed task with the given id, that isn't claimed and doesn't belong to this user
            let Task = mongoose.model('Task');
            Task.findOne({_id: req.body.taskId,completed: false, claimer: null, 'owner.id': {$ne: claimer._id}},function(err,task){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else if(!task)
                {
                    return res.status(401).json({message: "ERR_CLAIM_TASK_INVALID_TASK_ID"});
                }else{
                    //Set claim + save task
                    task.claimer = {id: claimer._id, name: claimer.username};
                    task.save(function(err,task){
                        if(err)
                        {
                            console.log(err);
                            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                        }else{
                            return res.status(200).json({message: "SUCCESS_TASK_CLAIM"});
                        }
                    });
                }
            });
        }
    });
});

/**
 * Complete a claimed task
 */
router.put('/complete',function(req,res,next){
    if(!req.body.userId || !req.body.taskId)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //try to find the claimer, that wants to complete one of his tasks
    User.findById(req.body.userId,function(err,claimer){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!claimer)
        {
            return res.status(401).json({message: "ERR_COMPLETE_TASK_INVALID_USER_ID"});
        }else{
            let Task = mongoose.model('Task');
            //Find a not completed task, with the given id, that is claimed by the given user
            Task.findOne({_id: req.body.taskId, completed: false, $and: [
                //Is claimed
                { claimer: {$ne: null} },
                //By the current user
                { 'claimer.id': claimer._id }
            ]},function(err,task){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else if(!task)
                {
                    return res.status(401).json({message: "ERR_COMPLETE_TASK_INVALID_TASK_ID"});
                }else{
                    //Set complete, save
                    task.completed = true;
                    task.save(function(err,task){
                        if(err)
                        {
                            console.log(err);
                            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                        }else{
                            //add payout to wallet of user and save user
                            claimer.wallet += task.payout;
                            claimer.save(function(err,claimer){
                                if(err)
                                {
                                    console.log(err);
                                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                                }else{
                                    return res.status(200).json({ balance: claimer.wallet});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

/**
 * Delete a completed task
 */
router.delete('/delete',function(req,res,next){
    if(!req.query.userId || !req.query.taskId)
    {
        return res.status(400).json({message: "ERR_REQUEST_INVALID"});
    }
    let User = mongoose.model('User');
    //find the owner
    User.findById(req.query.userId,function(err,user){
        if(err)
        {
            console.log(err);
            return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
        }else if(!user)
        {
            return res.status(401).json({message: "ERR_DELETE_TASK_INVALID_USER_ID"});
        }else{
            //Find a task where
            // - the task has the given id
            // - the given user is the owner
            // - the task was either not claimed OR claimed and completed
            //   
            //and then delete it
            let Task = mongoose.model('Task');
            Task.findOneAndDelete({_id: req.query.taskId, 'owner.id': user._id, 
            $or: [
                //Not claimed
                {claimer: null},
                //Claimed and completed
                {$and: [{claimer: {$ne: null}},{completed: true}] }
            ]},function(err,task){
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({message: "ERR_INTERNAL_SERVER_ERROR"});
                }else if(!task)
                {
                    return res.status(401).json({message: "ERR_DELETE_TASK_INVALID_TASK_ID"});
                }else{
                    return res.status(200).json({message: "SUCCESS_TASK_DELETE"});
                }
            });
        }
    });
});


module.exports = router;