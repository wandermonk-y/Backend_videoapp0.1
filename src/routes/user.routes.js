import { Router } from "express"
import {registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"



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

export default router
