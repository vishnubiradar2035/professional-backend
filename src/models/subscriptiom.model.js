import mongoose, { Schema, SchemaType, Types } from "mongoose";

const subscriptionSchena = new Schema(
  {
    subscriber: {
      type: Schema.Type.ObjectId, //one who is subscribin
      ref: "User",
    },
    channel: {
      type: Schema.Type.ObjectId, //one who is subscriber is subscribing
      ref: "User",
    },
  },
  { timestamps: true },
);

export const SubscriptionSchena = mongoose.model(
  "Subscription",
  subscriptionSchena,
);
