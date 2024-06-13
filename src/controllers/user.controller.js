import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import mongoose, { Mongoose } from "mongoose";

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
      $unset: { refreshTocken: 1 },
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
    .json(new ApiResponse(200, {}, "User log out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookiees.refreshAccessToken || req.body.refreshAccessToken;
  if (!incomingRefreshToken) {
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "current user fetched sucessfully"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  console.log("fullname",fullname,email)
  if (!fullname || !email) {
    throw new ApiError(400, "all filed are required ");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account detail updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing ");
  }
  const avatar = await uploadONCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatr  updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image  file is missing ");
  }
  const coverImage = await uploadONCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "Error while cover uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing ");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribTo",
      },
    },
    {
      $addFields: {
        subscriptionsCount: {
          $size: "$subscriptions",
        },
        channelSubscriptionsCount: {
          $size: "$subscribTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscriptions.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriptionsCount: 1,
        channelSubscriptionsCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "Channel dos not exists");
  }
  console.log(channel);
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channek featch sucessfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch hishistory fetched sucessfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
