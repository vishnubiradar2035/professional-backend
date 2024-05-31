import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  // api_secret: "DvDuvFODh-GPTnNNavwxx3UjH1k"
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// CLOUDINARY_URL=cloudinary://736322359312953:DvDuvFODh-GPTnNNavwxx3UjH1k@dajriqzr2

const uploadONCloudinary = async (localFilPath) => {
  try {
    if (!localFilPath) return null;

    //upload the file on cloudinary
   const response = await cloudinary.uploader.upload(localFilPath,{
        resource_type: "auto"
    });
    fs.unlinkSync(localFilPath)
    return response;
  } catch (error) {

    console.log("Error ",error)
    fs.unlinkSync(localFilPath) //remove the local save temporary file as the upload fail 

    return null;
  }
};

export { uploadONCloudinary}

// (async function() {

//     // Configuration
//     cloudinary.config({
//         cloud_name: "dajriqzr2",
//         api_key: "736322359312953",
//         api_secret: "<your_api_secret>" // Click 'View Credentials' below to copy your API secret
//     });

//     // Upload an image
//     const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
//         public_id: "shoes"
//     }).catch((error)=>{console.log(error)});

//     console.log(uploadResult);

//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url("shoes", {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });

//     console.log(optimizeUrl);

//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url("shoes", {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });

//     console.log(autoCropUrl);
// })();
