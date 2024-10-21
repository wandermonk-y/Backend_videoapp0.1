import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
    {
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,  
        index:true
    },
    avatar:{
        type:String, // Cloudinary url
        required:true, 
    },
    coverImage:{
        type:String, // Cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types,ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type: String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    }
},
{timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); // this line of code prevents our password to get encrypted everytime this code says if there is no modification in the password field do not encrypt
    
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
// the next two line of code verifies that the password is correct or no. bcrypt takes the "String password " adn it compares it to the password the that it encrypted and it return as true and false manner.
userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname : this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.EFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)