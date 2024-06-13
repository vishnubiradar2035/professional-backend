import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true },
);

export const Like = mongoose.model("like", likeSchema);
