import mongoose from "mongoose";

const batsmanSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    nickName: String,
    balls: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    dots: { type: Number, default: 0 },
    ones: { type: Number, default: 0 },
    twos: { type: Number, default: 0 },
    threes: { type: Number, default: 0 },
    fives: { type: Number, default: 0 },
    boundaries: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
    strikeRate: { type: String, default: "0.00" },
    outDesc: { type: String, default: "not out" },
    bowlerId: { type: Number, default: 0 },
    fielderId1: { type: Number, default: 0 },
    fielderId2: { type: Number, default: 0 },
    fielderId3: { type: Number, default: 0 },
    wicketCode: { type: String, default: "" },
    isCaptain: { type: Boolean, default: false },
    isKeeper: { type: Boolean, default: false },
    isOverseas: { type: Boolean, default: false },
    inMatchChange: { type: String, default: "" },
    playingXIChange: { type: String, default: "" },
  },
  { _id: false }
);

const bowlerSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    nickName: String,
    overs: { type: String, default: "0.0" },
    maidens: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    economy: { type: String, default: "0.00" },
    balls: { type: Number, default: 0 },
    dots: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    runsPerBall: { type: Number, default: 0 },
    isCaptain: { type: Boolean, default: false },
    isKeeper: { type: Boolean, default: false },
    isOverseas: { type: Boolean, default: false },
    inMatchChange: { type: String, default: "" },
    playingXIChange: { type: String, default: "" },
  },
  { _id: false }
);

const extrasSchema = new mongoose.Schema(
  {
    legByes: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const wicketsSchema = new mongoose.Schema(
  {
    batsmanId: Number,
    batsmanName: String,
    wicketNumber: Number,
    overNumber: String,
    runs: Number,
    ballNumber: Number,
  },
  { _id: false }
);

const partnershipsSchema = new mongoose.Schema(
  {
    bat1Id: Number,
    bat1Name: String,
    bat1Runs: { type: Number, default: 0 },
    bat1Balls: { type: Number, default: 0 },
    bat1Dots: { type: Number, default: 0 },
    bat1Ones: { type: Number, default: 0 },
    bat1Twos: { type: Number, default: 0 },
    bat1Threes: { type: Number, default: 0 },
    bat1Fours: { type: Number, default: 0 },
    bat1Fives: { type: Number, default: 0 },
    bat1Sixes: { type: Number, default: 0 },
    bat1Boundaries: { type: Number, default: 0 },

    bat2Id: Number,
    bat2Name: String,
    bat2Runs: { type: Number, default: 0 },
    bat2Balls: { type: Number, default: 0 },
    bat2Dots: { type: Number, default: 0 },
    bat2Ones: { type: Number, default: 0 },
    bat2Twos: { type: Number, default: 0 },
    bat2Threes: { type: Number, default: 0 },
    bat2Fours: { type: Number, default: 0 },
    bat2Fives: { type: Number, default: 0 },
    bat2Sixes: { type: Number, default: 0 },
    bat2Boundaries: { type: Number, default: 0 },

    totalRuns: { type: Number, default: 0 },
    totalBalls: { type: Number, default: 0 },
  },
  { _id: false }
);

const inningsSchema = new mongoose.Schema(
  {
    inningsId: Number,
    batTeamName: String,
    batTeamSName: String,
    bowlTeamName: String,
    bowlTeamSName: String,
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: String, default: "0.0" },
    runRate: { type: String, default: "0.00" },
    ballNbr: Number,
    rpb: Number,
    isDeclared: { type: Boolean, default: false },
    isFollowOn: { type: Boolean, default: false },
    revisedOvers: { type: Number, default: 0 },

    batsmen: [batsmanSchema],
    bowlers: [bowlerSchema],
    extras: extrasSchema,
    wickets: [wicketsSchema],
    partnerships: [partnershipsSchema],

    powerPlayData: { type: Object, default: {} },
  },
  { _id: false }
);

const matchScoreSchema = new mongoose.Schema(
  {
    matchId: {
      type: Number,
      required: true,
      unique: true,
    },
    status: String,
    isMatchComplete: Boolean,
    responseLastUpdated: {
      type: Date,
      default: Date.now,
    },
    innings: [inningsSchema],
  },
  { timestamps: true }
);

export const MatchScore = mongoose.model("MatchScore", matchScoreSchema);
