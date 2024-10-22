import { v2 as cloudinary} from "cloudinary";
import fs from "fs" // used to control the files, already in the system with js.

// Configuration
cloudinary.config({ 
cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
api_key: process.env.CLOUDINARY_API_KEY, 
api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{ // the file will take time to upload so we used await here
            resource_type: "auto"
        })
        //  file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", 

            fs.unlinkSync(localFilePath)
            return response;
        } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed.   
        return null
    }

}

export{uploadOnCloudinary}