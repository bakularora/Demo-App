import mongoose from "mongoose";
const Schema = mongoose.Schema;
const user = new Schema({
    googleId:{
        type: String
    },
    auth:{
        type: String
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
    
    },
    refreshToken:{
        type: String
    }
});

export default mongoose.model('Users', user);