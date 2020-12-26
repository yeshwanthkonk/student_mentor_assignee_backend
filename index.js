const express = require("express")
const mongodb = require("mongodb")
const cors = require("cors")

const app = express();
const port = process.env.PORT || 3000;
const mongoClient = mongodb.MongoClient;
const object_id = mongodb.ObjectID;
const mongodb_url = "mongodb://127.0.0.1:27017/";

app.use(express.json());
app.use(cors());

app.post("/create_mentor", async (req, res)=>{
    let data = req.body;
    console.log("DATA", data)
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"})
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('mentors');
    let response = await collection.insertOne(data);
    client.close();
    if(response['insertedCount'] == 1)
        return res.status(200).json({"detail":`record inserted`, "id":response["ops"][0]["_id"]})
    else
        return res.status(500).json({"detail": "Some Error Occured"})
})

app.post("/create_student", async (req, res)=>{
    let data = req.body;
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"})
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('students');
    data["status"] = "NA";
    let response = await collection.insertOne(data);
    client.close();
    if(response['insertedCount'] == 1)
        return res.status(200).json({"detail":`record inserted`, "id":response["ops"][0]["_id"]})
    else
        return res.status(500).json({"detail": "Some Error Occured"})
})

app.post("/assigne_students_mentor", async (req, res)=>{
    let data = {"student_id": object_id(req.body["student_id"]), "mentor_id": object_id(req.body["mentor_id"])};
    if(Object.keys(data).length == 0)
        return res.status(400).json({"detail": "Invalid Body Request"});
    try{
        let client  = await mongoClient.connect(mongodb_url);
        let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('mentor_student_relationship');
        let response = await collection.insertOne(data);
        collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('students');
        if(response['insertedCount'] >= 1){
            await collection.findOneAndUpdate({"_id": object_id(data["student_id"])},{$set: {"status": "Assigned"}});
            client.close();
            return res.status(200).json({"detail":`Mapped Successful`, "ids":response["insertedIds"]})
        }
        else{
            client.close();
            return res.status(500).json({"detail": "Some Error Occured"})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).json({"detail": "Some Error Occured"})
    }
})

app.put("/change_mentor/:student_id", async (req, res)=>{
    let mentor_id = req.body['mentor_id'];
    let student_id = req.params["student_id"];
    if(!mentor_id)
        return res.status(400).json({"detail": "Invalid Body Request"});
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('mentor_student_relationship');
    let response = await collection.findOneAndUpdate({"student_id": object_id(student_id)},{$set: {"mentor_id": object_id(mentor_id)}});
    console.log(response);
    client.close();
    if(response['ok'])
        return res.status(200).json({"detail":`Mapped Successful`, "ids":response["insertedIds"]})
    else
        return res.status(500).json({"detail": "Some Error Occured"})
})

app.get("/get_students/:mentor_id", async (req, res)=>{
    let mentor_id = req.params["mentor_id"];
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('mentor_student_relationship');
    let result = await collection.aggregate([
        {
            $match: {"mentor_id":object_id(mentor_id)}
        },
        {
            $lookup: 
            {
                from: 'students',
                localField: 'student_id',
                foreignField: '_id',
                as: 'student'
            }
        },
        {
            $project:
            {
                "name": {$arrayElemAt: ["$student.name", 0]},
                "id": {$arrayElemAt: ["$student.id", 0]},
            }
        }
    ]).toArray();
    client.close();
    res.status(200).json({result})
})

app.get("/get_mentors/", async (req, res)=>{
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('mentors');
    let result = await collection.find().toArray();
    client.close();
    res.status(200).json({"detail": "Success", "data": result})
})

app.get("/get_students", async (req, res)=>{
    let client  = await mongoClient.connect(mongodb_url);
    let collection = client.db("guvi_DailyTask(DT)_11-21-2020").collection('students');
    let result = await collection.find({"status": "NA"}).toArray();
    client.close();
    res.status(200).json({"detail": "Success", "data": result})
})

app.listen(port, ()=>console.log("Server Started on Port "+port));