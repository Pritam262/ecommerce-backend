const mongoose = require('mongoose');

const userSchema =mongoose.Schema({
fname:{
    type:String,
    required:true,
},
lname:{
    type:String,
    required:true,
},
email:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true
},
phone:{
    type:String,
    required:true
},
countryCode:{
    type:Number,
    required:true
},
country:{
    type:String,
    required:true,
},
address:{
    type:Array,
},
imageUrl:{
    type:String,
},
date:{
    type:Date,
    default:()=> new Date(), //set the default value to the current UTC time
}
});


module.exports = mongoose.model('User', userSchema)