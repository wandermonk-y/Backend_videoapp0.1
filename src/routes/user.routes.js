import { Router } from "express"
import {loginUser, logoutuser, refreshAccessToken, registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/register").post(
    // this is a middleware (multer) we got it from ref line 3. middle ware will check the files before taking it to the cloudinary
    upload.fields([
        {
            name: "avatar",
            maxCount :1
        },
        {
            name:" coverImage",
            maxCount : 1
        }
    ]) ,
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("logout").post(verifyJWT,logoutuser)

router.route("/refresh-token").post(refreshAccessToken)

export default router
