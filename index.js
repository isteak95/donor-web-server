const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyw1sec.mongodb.net/?retryWrites=true&w=majority`;

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

        const userCollection = client.db('userDB').collection('user');
        const AllUserCollection = client.db('allserDB').collection('all-user');
        const donorCollection = client.db('donorCollectionDB').collection('donation-request');
        const AllDonorCollection = client.db('AllDonorCollectionDB').collection('all-donation-request');
        const ApiBlogsCollection = client.db('ApiBlogsCollectionDB').collection('api-blogs');

        app.post('/user', async (req, res) => {
            const newBook = req.body;
            console.log(newBook);
            const result = await userCollection.insertOne(newBook);
            const results = await AllUserCollection.insertOne(newBook);
            res.json({ result, results });
        });

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })



        // Middleware for verifying admin role
        // const verifyAdmin = (req, res, next) => {
        //     const user = req.user; // Assuming the user information is stored in req.user by verifyToken middleware
        //     if (user.role !== 'admin') {
        //         return res.status(403).json({ error: 'Permission denied. Only admins can perform this action.' });
        //     }
        //     next();
        // };



        app.get('/user', async (req, res) => {
            try {
                const email = req.query.email;
                const query = { email: email };
                const result = await userCollection.find(query).toArray();
                res.send(result);

            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        app.get('/donor/create-donation-request', async (req, res) => {
            try {
                const email = req.query.email;
                const query = { email: email };
                const result = await AllDonorCollection.find(query).toArray();
                res.send(result);

            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        app.get('/users', async (req, res) => {
            const user = await userCollection.find({}).toArray();
            res.json(user);
        });


        app.post('/donor/create-donation-request', async (req, res) => {
            const newBook = req.body;
            console.log(newBook);
            const result = await donorCollection.insertOne(newBook);
            const results = await AllDonorCollection.insertOne(newBook);
            res.json({ result, results });
        });
        app.post('/api/blogs', async (req, res) => {
            const newBook = req.body;
            console.log(newBook);
            const result = await ApiBlogsCollection.insertOne(newBook);
            res.json({ result });
        });

        app.patch('/users/unblock/:id', async (req, res) => {
            const id = req.params.id; // Change to req.params.UserId to match the route parameter
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    status: 'active'
                }
            };

            const result = await userCollection.updateOne(filter, updatedDoc);
            const results = await AllUserCollection.updateOne(filter, updatedDoc);

            res.send({ result, results });
        });
        app.patch('/users/block/:id', async (req, res) => {
            const id = req.params.id; // Change to req.params.UserId to match the route parameter
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    status: 'block'
                }
            };

            const result = await userCollection.updateOne(filter, updatedDoc);
            const results = await AllUserCollection.updateOne(filter, updatedDoc);

            res.send({ result, results });
        });

        app.patch('/users/volunteer/:id', async (req, res) => {
            const id = req.params.id; // Change to req.params.UserId to match the route parameter
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: 'volunteer'
                }
            };

            const result = await userCollection.updateOne(filter, updatedDoc);
            const results = await AllUserCollection.updateOne(filter, updatedDoc);

            res.send({ result, results });
        });


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            const results = await AllUserCollection.updateOne(filter, updatedDoc);
            res.send({ result, results });
        });

        app.put('/donor/create-donation-request/:id', async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Invalid ID format' });
                }

                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const updateRequest = req.body;

                const request = {
                    $set: {
                        name: updateRequest.name,
                        anotherName: updateRequest.anotherName,
                        rating: updateRequest.rating,
                        category: updateRequest.Category,
                        image: updateRequest.image,
                    },
                };

                const result = await donorCollection.updateOne(filter, request, options);
                res.json(result);
            } catch (error) {
                console.error('Error updating donation request:', error);
                res.status(500).json({ error: 'An error occurred while updating the donation request.' });
            }
        });
        app.delete('/donor/create-donation-request/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await donorCollection.deleteOne(query);
            const results = await AllDonorCollection.deleteOne(query);
        
            res.send(result, results);
        });
        


        app.get('/donor/create-donation-request/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await donorCollection.findOne(query);
            res.send(result);
        });

        app.get('/api/blogs', async (req, res) => {
            const user = await ApiBlogsCollection.find({}).toArray();
            res.json(user);
        });

        app.get('/all-user', async (req, res) => {
            const user = await AllUserCollection.find({}).toArray();
            res.json(user);
        });


        app.get('/donor/create-donation-request', async (req, res) => {
            const products = await donorCollection.find({}).toArray();
            res.json(products);
        });
        app.get('/all-blood-donation-request', async (req, res) => {
            const user = await AllDonorCollection.find({}).toArray();
            res.json(user);
        });


        app.get('/', (req, res) => {
            res.send('It is working');
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // Connect the client to the server
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Don't close the client here to keep the connection open
    }
}

run().catch(console.dir);

// Define your route handlers here
