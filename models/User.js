import { time } from "console";
import mongoose from "mongoose";
import { type } from "os";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, unique: true },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  password: { type: String },

  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },

  profileImage: { type: String },
  amount: { type: String, default: 0 },
  
  transactions:[{
    TID:{
      type: String
    },
    amount:{
      type: Number
    },
    status:{
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    },
    paymentInstrument:{
      type:Object
    },
    time: {
      type: Date,
      default: Date.now()
    }
  }
  ],
  // User Portfolio Schema
  portfolio: [
    {
      matchId: { type: String },
      playerId: { type: String }, // Reference to the player
      playerName: { type: String },
      team: { type: String }, // Team of the player
      initialPrice: { type: String },
      transactions: [
        {
          type: { type: String, enum: ["buy", "sell"] }, // Transaction type
          quantity: { type: Number }, // Number of stocks bought/sold
          price: { type: Number }, // Price per stock at transaction time
          timestamp: { type: Date, default: Date.now }, // When the transaction occurred
          autoSold: { type: Boolean, default: false }, // Whether it was auto-sold
          reason: { type: String } // Reason for auto-selling (out, innings complete, match complete)
        },
      ],
      currentHoldings: { type: Number }, // Current number of stocks held
    },
  ],
  // teamportfolio

  teamPortfolio: [
    {
      matchId: { type: String },
      teamId: { type: String }, // A unique identifier for the team
      teamName: { type: String },
      initialPrice: { type: String },
      transactions: [
        {
          type: { type: String, enum: ["buy", "sell"] },
          quantity: { type: Number },
          price: { type: Number },
          timestamp: { type: Date, default: Date.now },
          autoSold: { type: Boolean, default: false },
          reason: { type: String }
        },
      ],
      currentHoldings: { type: Number },
    },
  ]
});

const User = mongoose.model("User", UserSchema);
export default User;
