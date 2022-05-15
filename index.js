const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require ('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2m5oj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
    await client.connect();
    const servicesCollection = client.db('doctors_portals').collection('services');
    const bookingCollection = client.db('doctors_portals').collection('bookings');

    app.get('/services', async(req, res)=>{
        const query ={};
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
    });
    /*
    * API Naming Convention 
    * app.get('/booking') // get all booking in this collection. or get more than one or by filter
    * app.get('/booking/:id') // get a specific booking
    * app.post('/booking') // add a new booking
    * app.patch/update('/booking/:id') // updateing
    * app.delete('/booking/:id') // delete data
    */

    //This is not the proper way to query
    // After learning more about mongodb, use aggregate, lookup, pipeline , match , group
   app.get('/available', async(req, res) =>{
     const date = req.query.date || 'May 14, 2022';
     //step 1: get all services
     const services = await servicesCollection.find().toArray();
     //step-2 : get the booking of that day
     const query = {date: date};
     const bookings = await bookingCollection.find(query).toArray();
    //step 3: for each service, find bookings for that service
     services.forEach(service => {
      const serviceBookings = bookings.filter( book => book.treatment === service.name);
      const bookSlots = serviceBookings.map(book => book.slot);
    //  service.booked = serviceBookings.map(s => s.slot);
      const available = service.slots.filter(s  => !bookSlots.includes(s));
      service.slots = available;
    

    });
     res.send(services)
   })

   app.post('/booking', async(req, res) =>{
     const booking = req.body;
     const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient};
     const exists = await bookingCollection.findOne(query);
     if(exists){
       return res.send({success: false, booking: exists});
     }
     const result = await bookingCollection.insertOne(booking);
     return res.send({success: true, result});
   })

  }
  finally{

  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello From Doctor !')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})