import mongoose from "mongoose";

const batsmanSchema = new mongoose.Schema({
  id: Number,
  name: String,
  nickName: String,
  balls: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  strkRate: { type: String, default: "0.00" },
  outDec: { type: String, default: "" },
  isCaptain: { type: Boolean, default: false },
  isKeeper: { type: Boolean, default: false }
}, { _id: false });

const bowlerSchema = new mongoose.Schema({
  id: Number,
  name: String,
  nickName: String,
  overs: { type: String, default: "0.0" },
  maidens: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  economy: { type: String, default: "0.00" },
  balls: { type: Number, default: 0 }
}, { _id: false });

const extrasSchema = new mongoose.Schema({
  legByes: { type: Number, default: 0 },
  byes: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  noBalls: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const fowSchema = new mongoose.Schema({
  batsmanId: Number,
  batsmanName: String,
  overNbr: String,
  runs: Number,
  ballNbr: Number
}, { _id: false });

const partnershipSchema = new mongoose.Schema({
  bat1Id: Number,
  bat1Name: String,
  bat1Runs: { type: Number, default: 0 },
  bat1Balls: { type: Number, default: 0 },
  bat1Ones: { type: Number, default: 0 },
  bat1Twos: { type: Number, default: 0 },
  bat1Threes: { type: Number, default: 0 },
  bat1Boundaries: { type: Number, default: 0 },
  bat1fours: { type: Number, default: 0 },
  bat1sixes: { type: Number, default: 0 },
  bat2Id: Number,
  bat2Name: String,
  bat2Runs: { type: Number, default: 0 },
  bat2Balls: { type: Number, default: 0 },
  bat2Ones: { type: Number, default: 0 },
  bat2Twos: { type: Number, default: 0 },
  bat2Threes: { type: Number, default: 0 },
  bat2Boundaries: { type: Number, default: 0 },
  bat2fours: { type: Number, default: 0 },
  bat2sixes: { type: Number, default: 0 },
  totalRuns: { type: Number, default: 0 },
  totalBalls: { type: Number, default: 0 }
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  inningsId: Number,
  batTeamName: String,
  batTeamSName: String,
  score: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: String, default: "0.0" },
  runRate: { type: String, default: "0.00" },
  ballNbr: Number,
  rpb: Number,
  batsmen: [batsmanSchema],
  bowlers: [bowlerSchema],
  extras: extrasSchema,
  fow: [fowSchema],
  partnership: [partnershipSchema]
}, { _id: false });

const matchScoreSchema = new mongoose.Schema({
  matchId: {
    type: Number,
    required: true,
    unique: true
  },
  status: String,
  isMatchComplete: Boolean,
  responseLastUpdated: {
    type: Date,
    default: Date.now
  },
  innings: [inningsSchema]
}, { timestamps: true });

export const MatchScore = mongoose.model("MatchScore", matchScoreSchema);