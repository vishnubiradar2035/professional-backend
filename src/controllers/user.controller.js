import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";
const registerUser = asyncHandler(async (req, res) => {
  //   return res.status(200).json({ message: "I love babita" });
  //  get user detail from front end
  // username
  //   email
  //   fullname
  //   avatar
  //   coverImage
  //   watchHistory
  //   password
  //validation not empty
  //check is user is alredy exist or not : username and email
  //check for images for avatar
  //upload them to cloidanry , avatar
  //create user object -create entry in db
  //remove password and refresh token filer from response
  //check for user creation
  //return response
  // {
  //       "email":""
  //   "fullname":""
  //   "avatar":""
  //   "coverImage":""
  //   "password":""
  // username
  // }
  const { email, fullname, password, username } = req.body;

  console.log("fullname", email);
  if (fullname === "") {
    throw new ApiError(400, "Fullname is requerd");
  }

  if (
    [email, fullname, password, username].some((filed) => filed.trim() === "")
  ) {
    throw new ApiError(400, "All Fileds are requerd");
  }
  const existedUse = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUse) {
    throw new ApiError(409, "User with email or username is aleady exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

//   const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files?.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files?.coverImage[0]?.path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required local file");
  }
  const avatar = await uploadONCloudinary(avatarLocalPath);

  const coverImage = await uploadONCloudinary(coverImageLocalPath);
  if (!avatar.url) {
    throw new ApiError(444, "avatar file is required");
  }
  const userRestiter = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(userRestiter._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, " Somthing went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user register sucessfully"));
});

export { registerUser };
