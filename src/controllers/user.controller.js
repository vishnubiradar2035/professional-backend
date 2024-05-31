import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";

const generateAccesssANdReffereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshTocken = user.genrateRefreshToken();
    user.refreshTocken = refreshTocken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshTocken };
  } catch (error) {
    throw new ApiError(
      500,
      "Somthing went wrong while generating refesh and access token",
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  //   return res.status(200).json({ message: "I love babita" });
  //  get user detail from front end
  //validation not empty
  //check is user is alredy exist or not : username and email
  //check for images for avatar
  //upload them to cloidanry , avatar
  //create user object -create entry in db
  //remove password and refresh token filer from response
  //check for user creation
  //return response
  const { email, fullname, password, username } = req.body;

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
  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
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

const loginUser = asyncHandler(async (req, res) => {
  //red data from res.body
  //username or email
  //find the user
  //password check
  //access and refresh token genrate
  //send cookie

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const userInstance = await User.findOne({ $or: [{ username }, { email }] });
  if (!userInstance) {
    throw new ApiError(400, "username does not exist");
  }
  const isPasswordValid = await userInstance.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshTocken } = await generateAccesssANdReffereshToken(
    userInstance._id,
  );
  const loggedInUser = await User.findById(userInstance._id).select(
    "-password -refreshTocken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshTocken", refreshTocken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshTocken },
        "User Loggd in Sussfully",
      ),
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshTocken: 1 },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshTocken", options)
    .json(new ApiResponse(200, {}, "User loggeout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookiees.refreshAccessToken || req.body.refreshAccessToken;
  if (incomingRefreshToken) {
    throw new ApiError(401, "unauthorise request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshAccessToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshTocken } =
      await generateAccesssANdReffereshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshTocken", newrefreshTocken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshTocken: newrefreshTocken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
