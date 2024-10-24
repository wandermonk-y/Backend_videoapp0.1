import { apiErrors } from "../utils/apiErrors";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,_,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // Bearer Token Authentication, which is a method of securely transmitting credentials (usually an access token) in the HTTP request's Authorization header.
    
        if(!token){
            throw new apiErrors(401,"Unauthorized request"); 
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        await User.findById(decodedToken?._id).select("-password - refreshToken")
        if(!User){
            throw new apiErrors(401,"Invalid Access Token");
            
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new apiErrors(401,"Invlaid access token");
        
    }
})
