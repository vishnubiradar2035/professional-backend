import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    let connectionIntances = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
    );
    console.log(
      `ln mongoDb connected || DB HOST ${connectionIntances.connection.host}`,
    );
  } catch (error) {
    console.log("MONGODB connect Failed", error);
    process.exit(1);
  }
};

export default connectDB;
