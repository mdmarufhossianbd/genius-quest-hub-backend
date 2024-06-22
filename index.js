require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRECT_KEY) 
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173'
  ]
}));
app.use(express.json());


const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require('mongodb');
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

    const contestCollections = client.db('geniusQuestHub').collection('contests');
    const userCollections = client.db('geniusQuestHub').collection('users');
    const commentCollections = client.db('geniusQuestHub').collection('comments');
    const contestSummeryCollections = client.db('geniusQuestHub').collection('contestSummerys');
    const registeredCollections = client.db('geniusQuestHub').collection('registereds');
    const submitContestCollections = client.db('geniusQuestHub').collection('submitContests');
    const winnerCollections = client.db('geniusQuestHub').collection('winners');


    // users
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = {
        email: user.email
      }
      const existingUser = await userCollections.findOne(query);
      if (existingUser) {
        return res.send({
          message: 'This user is already exists',
          insertedId: null
        })
      }
      const result = await userCollections.insertOne(user);
      res.send(result);
    })

    app.get('/users', async (req, res) => {
      const result = await userCollections.find(req.body).toArray();
      res.send(result);
    })

    app.get('/users/:id', async (req, res) => {
      const email = req.params.id;
      const query = {
        email: email
      }
      const result = await userCollections.findOne(query);
      res.send(result);
    })

    app.put('/update-user/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const options = {upsert : true};
      const updateProfile = req.body;
      const profileInfoUpdate = {
        $set: {
          name : updateProfile.name,
          photo : updateProfile.photo
        }
      }
      const result = await userCollections.updateOne(filter, profileInfoUpdate, options);
      res.send
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await userCollections.deleteOne(query);
      res.send(result);
    })

    // user block
    app.patch('/users/block/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const updateBlock = {
        $set: {
          status: "block"
        }
      }
      const result = await userCollections.updateOne(filter, updateBlock);
      res.send(result);
    })

    // unblock
    app.patch('/users/unblock/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const updateBlock = {
        $set: {
          status: "Unblock"
        }
      }
      const result = await userCollections.updateOne(filter, updateBlock);
      res.send(result);
    })


    // make creator
    app.patch('/users/creators/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      };
      const updateUserRole = {
        $set: {
          role: 'Creator',
        }
      }
      const result = await userCollections.updateOne(filter, updateUserRole);
      res.send(result)
    })

    // admin find
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }

      const query = {
        email: email
      };
      const user = await userCollections.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'Admin'
      }
      res.send({admin});
    })

    // creator find
    app.get('/users/creators/:email', async (req, res) => {
      const email = req.params.email;

      const query = {
        email: email
      };
      const user = await userCollections.findOne(query);
      let creator = false;
      if (user) {
        creator = user?.role === "Creator"
      }
      res.send({
        creator
      })
    })

    // contests
    app.post('/contests', async (req, res) => {
      const result = await contestCollections.insertOne(req.body)
      res.send(result);
    })

    app.get('/contests', async(req, res)=>{
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await contestCollections.find().skip(page * size).limit(size).toArray();
      res.send(result);
    })

    app.get('/popular-contests', async (req, res) => {
      const filter = req.query;
      const query = {
        contestParticipateCount : {$gte : 1}
      };
      const options = {
        sort : {
          contestParticipateCount : filter.sort === "asc" ? -1 : 1
        }
      };
      const result = await contestCollections.find(query, options).toArray();
      res.send(result);
    })

    app.get('/contests/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: id};
      const result = await contestCollections.findOne(query);
      res.send(result)
    })

    app.get('/contests/my-contests/:email', async (req, res) => {
      const email = req.params.email;
      const query = {
        creatorEmail: email
      }
      const result = await contestCollections.find(query).toArray();
      res.send(result)

    })

    app.delete('/contests/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await contestCollections.deleteOne(query);
      res.send(result);
    })

    app.put('/contests/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      };
      const options = {
        upsert: true
      };
      const updateContest = req.body;
      const contest = {
        $set: {
          contestName: updateContest.contestName,
          contestImage: updateContest.contestImage,
          contestDescription: updateContest.contestDescription,
          contestRegistrationFee: updateContest.contestRegistrationFee,
          contestPrize: updateContest.contestPrize,
          contestInstructions: updateContest.contestInstructions,
          contestContestType: updateContest.contestContestType,
          contestPublishDate: updateContest.contestPublishDate,
          contestDeadline: updateContest.contestDeadline,
        }
      }
      const result = await contestCollections.updateOne(filter, contest, options);
      res.send(result);
    })

    app.patch('/contests/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const updateStatus = {
        $set: {
          contestStatus: 'Publish'
        }
      }
      const result = await contestCollections.updateOne(filter, updateStatus);
      res.send(result);
    })
    // pagination
    app.get('/total-contest', async(req, res)=>{
      const count = await contestCollections.estimatedDocumentCount();
      res.send({count})
    })
    // search
    app.get('/search', async(req, res) => {
      const searchKW = req.query.keyword;     
      let query = {
        contestContestType : {
          $regex : `${searchKW}`,
          $options : 'i'
        }
      }
      const result = await contestCollections.find(query).toArray();
      res.send(result);
    })

    // comments
    app.post('/comments', async (req, res) => {
      const result = await commentCollections.insertOne(req.body)
      res.send(result);
    })

    app.get('/comments', async (req, res) => {
      const result = await commentCollections.find().toArray();
      res.send(result)
    })

    // contest summery
    app.post('/contest-summery', async(req, res) => {
      const result = await contestSummeryCollections.insertOne(req.body);      
      res.send(result)
    })

    app.put('/contest-summery/:email', async(req, res)=>{
      const email = req.params.email;
      const filter = {email : email};
      const options = { upsert : true};
      const updateConfirmBookContest = req.body;
      const registeredContest = {
        $set : {
          contestId : updateConfirmBookContest.contestId,
          email : updateConfirmBookContest.email,
          name : updateConfirmBookContest.name,
          contestName : updateConfirmBookContest.contestName,
          contestRegistrationFee : updateConfirmBookContest.contestRegistrationFee,
          creatorEmail : updateConfirmBookContest.creatorEmail,
          creatorName : updateConfirmBookContest.creatorName,
          contestDeadline : updateConfirmBookContest.contestDeadline,
          contestImage : updateConfirmBookContest.contestImage,
          contestPrize : updateConfirmBookContest.contestPrize,
          contestPublishDate : updateConfirmBookContest.contestPublishDate,
          contestType : updateConfirmBookContest.contestContestType
        }
      }
      const result = await contestSummeryCollections.updateOne(filter, registeredContest, options);
      res.send(result);
    })

    app.get('/contest-summery', async(req, res)=>{
      const email = req.query.email;      
      const query = {email : email};      
      const result = await contestSummeryCollections.find(query).toArray();      
      res.send(result)
    })

    // registered contest
    app.post('/registered-contest', async(req, res)=>{
      const regContest = req.body;
      const result = await registeredCollections.insertOne(req.body);
      // update contestParticipateCount
      const updatePraticipate = {
        $inc : { contestParticipateCount : 1}
      }
      const contestQuery = {_id : new ObjectId(regContest.contestId)}
      const updatePraticipateCount = await contestCollections.updateOne(contestQuery, updatePraticipate)
      res.send(result);
    })

    app.get('/registered-contests/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await registeredCollections.findOne(query);
      res.send(result)
    })

    app.get('/registered-contests', async(req, res)=>{
      const result = await registeredCollections.find(req.body).toArray();
      res.send(result);
    })

    app.get('/registered-contest', async(req, res)=>{
      const email = req.query.email;
      const query = {userEmail : email};
      const result = await registeredCollections.find(query).toArray();
      res.send(result);
    })

    app.get('/registered-contest/creator', async(req, res)=>{
      const email = req.query.email;
      const query = {creatorEmail : email};
      const result = await registeredCollections.find(query).toArray();
      res.send(result);
    })

    // contest submit
    app.post('/submit-contest', async(req, res)=>{
      const result = await submitContestCollections.insertOne(req.body);
      res.send(result)
    })

    app.get('/submit-contest', async(req, res)=>{
      const result = await submitContestCollections.find().toArray();
      res.send(result)
    })

    app.get('/submit-contest/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await submitContestCollections.findOne(query);
      res.send(result)
    })

    // contest winner
    app.post('/contest-winner', async(req, res)=>{
    const result = await winnerCollections.insertOne(req.body);
    res.send(result)
    })

    app.get('/winners', async(req, res)=>{
      const result = await winnerCollections.find(req.body).toArray();
      res.send(result);
    })


    // payment
    app.post('/create-payment', async(req, res)=>{
      const {regFee} = req.body;
      const amount = parseInt( regFee * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency : 'usd',
        payment_method_types : ['card']
      })
      res.send({
        clientSecret : paymentIntent.client_secret
      })
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({
      ping: 1
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// server
app.get('/', (req, res) => {
  res.send('Welcome to Genius Contest Hub server and it is running')
})

app.listen(port, () => {
  console.log(`Genius Contest Hub server is running on ${port}`);
})