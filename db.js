const mongoose = require('mongoose');


const connectToMongo = async ()=>{
    if(mongoose.connections[0].readyState){
        console.log("Mongodb already connected")
    }
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Mongodb connected');

}


module.exports = connectToMongo;