import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CROS_ORIGIN,
    credentials: true,
  }),
);
//accepat form
app.use(
  express.json({
    limit: "16kb",
  }),
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


//routes import 

import  userRouter from './routes/user.routes.js'

//rout declaration 

app.use("/api/v1/users",userRouter)

export { app };
