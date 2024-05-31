import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }
      const decodedToken =jwt.verify(token,process.env.ACCESS_TOKEN_SCRET);
     const userInstance =await User.findById(decodedToken?._id).select("-password -refreshToken");
    
     if(!userInstance){
        throw new ApiError(401 ,"invalid Access Token")
     }
     req.user=userInstance;
     next()
} catch (error) {
    throw new ApiError(401 ,error?.message || "invalid Access Token")
}
});
