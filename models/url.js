import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },

    redirectUrl: {
      type: String,
      required: true,
    },
    visitedHistory: [
      {
        _id: false,
        timestamp: {
          type: Date,
        },
      },
    ],
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true },
);

const URL = mongoose.model("url", urlSchema);

export default URL;
