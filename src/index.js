// require('dotenv').config({path:'.env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config(
    {
        path:'./env'
    }
)

connectDB()
.then(()=>{
    app.listen(process.env.port || 3000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed.",err);
    
})










/*
import express from "express"
const app = express()
;( async () => {
    try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", (error)=>{
        console.log("Errr: ", error);
        throw error;        
    })

    app.listen(process.env.PORT,()=>{
        console.log(`app is listing on ${process.env.PORT}`);
        
    })

    } catch (error) {
        console.error("ERROR",error);
        throw err
    }
}) ()
*/
// const UserScheam = new mongoose.Schema({

// },{timestamps:true})

// export const User = mongoose.model("User",UserScheam)

