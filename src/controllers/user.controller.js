import {asyncHandler} from "../utils/asyncHandler.js"
import {apiErrors} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import JWT from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        // we are gettng the userId using user from line 77
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const generateToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}


    } catch (error) {
        throw new apiErrors(500,"something went wrong while generating access and refresh token");
        
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // get user detail from frontend
    // validation - not empty, emil correct , correct format
    // check if user already exists : username and email
    // check for img and avtar
    //  upload them to cloudnary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return the response


    // 1 we are taking the req from frontend

    const {username, fullName,email, password }= req.body
    console.log("email :" , email);

    if (
        [fullName,email,username,password].some( (field)=> { //The .some() method in JavaScript is used to test whether at least one element in an array passes the condition implemented by the provided function
            field?.trim() === "" // trim function cuts off the empty spaces in a text.
        })
    ) {
        throw new apiErrors(400,"All fields are required");
        }
    if (email.includes('@')) {
        
    }

    const existedUser = await User.findOne({
        $or : [{ email }, { username }]
    })

    if (existedUser) {
        throw new apiErrors(409, "username or email already exists");
    }
    // we have all the access from req.body from express but we have multer middleware as well which gives us access to the .files to handle  multiple files
    // [0] is the first porperty of multer and if we take it optionally ( ? denotes optionally (may or maynot case)) so we can take the path of the folder
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImageLocalPath[0].path
    }



    if(!avatarLocalPath){
        throw new apiErrors(400,"Avatar is required");
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatarLocalPath){
    throw new apiErrors(400,"Avatar is required");
    }   

     const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // in this code line we are trying to find the user if the user is created or not so in this we take mongoDB method MDB creates an id for each entry so we will check the DB with th user entry to validate if the user is created
    const createdUser = await User.findById(user._id).select( // now the .select we will use to remove the password and refreshToken from the response. In select by default all the fileds are selected no to take password and rtk out we use "-" symbol as shown in the code
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiErrors(500,"something went wrong while registering th user");
    }

    return res.status(201).json(
        new apiResponse(200, createdUser,"User registered successfully")
    )





    // if (fullName=== "") {
    //     throw new apiErrors (400,"Full name is required")
    // }

})

const loginUser = asyncHandler(async(req,res) =>{
    // req body- data
    // username or email
    // find the user
    // password check
    // access and refresh token // USE OF REFRESH AND ACCESS IS TOKEN IS USED AS AS REFERENCE SO THE USER DOESN'T HAS TO LOGIN EVERYTIME IT USES THE APPLICATION
    // ACCESS TOKEN IS SHORT LIFE SPAN AND THE REFRESH TOKEN IS USED FOR A LING TIME SPAN 
    // send cookies

    // step 1 req data
    const{email,username,password} = req.body

    // step 2 checking username and email
    if (!username && !email) {
        throw new apiErrors(400,"username or email is required");
    } 
        
        
    
    const user = await User.findOne({
        $or :[{username},{email}]
    })

    // step 3 finding user
    if(!user){
        throw new apiErrors(404,"user does not exists");   
    }
    // step 4 password checking - isPasswordCorrect we got it from userModel.js 
    const isPasswordValid = await User.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiErrors(404,"password not valid");   
    }

    // step 5 now to get access and generate tokens 
    // - we will use it a lot so we will make a new methos of it so that we can access it easily ref line 7 from top

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly : true, // when you put httpOnly and secure as true in the cookies only the sever can modify it
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Scccessfully"

        )
    )
})

const logoutuser = asyncHandler(async(req,res) =>{
    // here we are trying to erase the refreshToken so that the user can be actually loggedout
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        // this new operator gives fresh refreshToken for future reference
        {
            new:true
        }
    )

    const options = {
        httpOnly : true, // when you put httpOnly and secure as true in the cookies only the sever can modify it
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("referenceToken",options)
    .json(new apiResponse(200,"User Loggedout successfully"))
})
const refreshAccessToken = asyncHandler(async(req,res) => {
    // Step 1 - we take the refresh token from the user either in the form of coodies or from body
    // we use body because what if the user is using the web app on the phone
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken){
        throw new apiErrors(401,"unauthorized request");
    }
    // Step 2 we will verify the token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
        // step 3 we will find the user and take the decoded refresh token from them using the decoded token we made in auth.middleware
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiErrors(401,"invalid refresh token");
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new apiErrors(401, "Refresh token is expired or used");
            
        }
    
        const options ={
            httpOnly : true,
            secure : true
        } 
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options )
        .cookie("refreshToken", newrefreshToken,options)
        .json(
            new apiResponse(
                200,
                {accessToken,refreshToken : newrefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new apiErrors(401,"Invalid refresh token");
        
    }
})

const ChangeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldpassword,newPassword,confirmPassword} = req.body

    if(!newPassword === confirmPassword){
        throw new apiErrors(401,"confirmed password is wrong");
        
    }
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)

    if(!isPasswordCorrect){
        throw new apiErrors(401,"Password is Incorrect");    
    }

    user.password = newpassword // reference for this code we can take form ../modles/user.model.js line 51 - 55 there in the code it is said that if the password is not modified then it will go to next middleware but if not then bcrypt will hash it.
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiResponse(200, {},"Password is changed"))
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200),
    json(200,req.user,"Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName,email} = req.body 

    if (!fullName || !email){
        throw new apiErrors(401,"All the fields are required");
        
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            // mongo DB operator set
            $set: {
                fullName,
                email
            }
        },
        {new :true} // this new keyword give us the updated information back
    ).select("-password ")

    return res
    .status(200)
    .json(new apiResponse(200,user,"Account details updates successfully"))
})

// now we are updating the avatar

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new apiErrors(401,"Avatar file is missing"); 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiErrors(400,"Error while uploading on avatar");
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
})
const updatenewUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new apiErrors(401,"Cover Image file is missing"); 
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiErrors(400,"Error while uploading on Cover Image");
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse(200,"Cover Image Update Successfully"))
})





export {
    registerUser,
    loginUser,
    logoutuser,
    refreshAccessToken,
    ChangeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updatenewUserCoverImage
}