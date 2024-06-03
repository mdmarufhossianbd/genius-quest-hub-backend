const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000
require('dotenv').config();


app.use(cors({
  origin: [
    'http://localhost:5173'
  ]
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nss4adm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const contestCollections = client.db('geniusQuestHub').collection('contests')
    const userCollections = client.db('geniusQuestHub').collection('users')
    const commentCollections = client.db('geniusQuestHub').collection('comments')



    // users
    app.post('/users', async(req, res)=>{
        const user = req.body;
        const query = {email : user.email}        
        const existingUser = await userCollections.findOne(query);
        if (existingUser){
            return res.send({message : 'This user is already exists', insertedId: null})
        }
        const result = await userCollections.insertOne(user);
        res.send(result);
    })

    app.get('/users', async(req, res)=>{
        const result = await userCollections.find(req.body).toArray();
        res.send(result);
    })

    app.delete('/users/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {
        _id : new ObjectId(id)
      }
      const result = await userCollections.deleteOne(query);
      res.send(result);
    })


    // make creator
    app.patch('/users/creators/:id', async(req, res)=>{ 
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateUserRole = {
        $set: {
          role: 'Creator',
          status: {
            block: 'Block',
            unBlock: 'Unblock'
          }
        }
      }
      const result = await userCollections.updateOne(filter, updateUserRole);
      res.send(result)
    })

    app.get('/users/creators/:id', async(req, res)=>{
      const email = req.params.id;
      const query = {email : email};
      const user = await userCollections.findOne(query);
      res.send(user)
    })

    // contests
    app.post('/contests', async(req, res)=>{
        const result = await contestCollections.insertOne(req.body)
        res.send(result);
    })

    app.get('/contests', async(req, res)=>{
        const result = await contestCollections.find().toArray();
        res.send(result);
    })

    app.delete('/contests/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await contestCollections.deleteOne(query);
      res.send(result);
    })

    app.patch('/contests/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updateStatus = {
        $set: {
          status : 'Publish'
        }
      }
      const result = await contestCollections.updateOne(filter, updateStatus);
      res.send(result);
    })

    // comments
    app.post('/comments', async(req, res)=>{
      const result = await commentCollections.insertOne(req.body)
      res.send(result);
    })

    app.get('/comments', async(req, res)=>{
      const result = await commentCollections.find().toArray();
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// server
app.get('/', (req, res)=>{
    res.send('Welcome to Genius Contest Hub server and it is running')
})

app.listen(port, ()=>{
    console.log(`Genius Contest Hub server is running on ${port}`);
})