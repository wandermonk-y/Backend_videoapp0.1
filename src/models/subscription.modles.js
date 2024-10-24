import { mongoose } from "mongoose";

const subscriptionScheam = new Schema({
    subscriber:{
        type : Schema.Types.ObjectId, // One who is subscribing
        ref : "User"
    },
    channel :{
        type : Schema.Types.ObjectId, // One who to whose channel subscriber is subscribing
        ref : "User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription",subscriptionScheam)