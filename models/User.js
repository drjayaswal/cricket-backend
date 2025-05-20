import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, unique: true },
  // otp: { type: String },
  isVerified: { type: Boolean, default: false },
  password: { type: String },

  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ["marketing", "financial", "super_admin", ""], default: "" },

  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },

  lastSeen: { type: Date, default: Date.now() },

  profileImage: { type: String },
  amount: { type: Number, default: 0 },

  referredBy: { type: String},
  referralCodes: { type: [String], default: [] },
  totalReferrals: {type: Number},

  transactions: [
    {
      txnID: {
        type: String,
      },
      // OID: {
      //   type: String,
      // },
      txnAmount: {
        type: Number,
      },
      txnStatus: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
      },
      txnType:{
        type:String,
        enum: ["Deposit", "Withdrawal"],
      },
      txnPaymentMethod:{
        type:String,
        enum: ["BT", "UPI", "NB", "CC", "DC"]
      },
      txnDate: {
        type: Date,
        default: Date(),
      },
    },
  ],
  // User Portfolio Schema
  playerPortfolio: [
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
          reason: { type: String }, // Reason for auto-selling (out, innings complete, match complete)
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
          reason: { type: String },
        },
      ],
      currentHoldings: { type: Number },
    },
  ],
});

const OtpRequestSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  otp: { type: String },
});


const User = mongoose.model("User", UserSchema);
const OtpRequest = mongoose.model("OTPrequest", OtpRequestSchema);

export { User, OtpRequest};
