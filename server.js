// Importing
import express from 'express'
import mongoose from 'mongoose'
import Pusher from 'pusher'
import cors from 'cors'

// Import db schema
import Message from './dbMessages.js'

// App config 
const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())

// DB Config
const mongoURI = 'mongodb+srv://admin:admin@cluster0.rima0.mongodb.net/messages?retryWrites=true&w=majority'

mongoose.connect(mongoURI,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// Pusher
const pusher = new Pusher({
  appId: '1093953',
  key: 'b0eaac0916ece4820287',
  secret: 'c39849e1de45e60db75a',
  cluster: 'ap1',
  encrypted: true
});

const db = mongoose.connection

db.once('open', () => {
    console.log('mongoDB connected')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.user,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    recieved: messageDetails.recieved
                }
            )
        } else {
            console.log('Error Pusher')
        }
    })
})

// Api routes
app.get('/',(req, res) => res.status(200).send('Hello World'))

app.get('/messages/sync', (req, res) => {
    Message.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/api/v1/message/new', (req,res) => {
    const dbMessage = req.body

    Message.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`New message created \n ${data}`)
        }
    })
})

// Listener
app.listen(port, ()=> {console.log(`Listening on http://localhost:${port}`)})