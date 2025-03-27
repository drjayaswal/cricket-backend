import express from "express";
import { MatchScore } from "../models/MatchScore.js";
import { MatchSchedule } from "../models/MatchSchedule.js";
import axios from "axios";
import cron from "node-cron";
import dotenv from 'dotenv'

const router = express.Router();
dotenv.config()

// RapidAPI configuration
const rapidAPIHeaders = {
  "x-rapidapi-key": process.env.CRICKET_API,
  "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
};

// Function to fetch match scores

const fetchMatchScore = async (matchId) => {
  try {
    const response = await axios.get(
      `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/scard`,
      { headers: rapidAPIHeaders }
    );

    const matchData = response.data;
    if (!matchData) return null;

    // Extract scorecard data for both teams
    const scorecard = matchData.scorecard || [];
    
    // Process data for both innings
    const processedInnings = scorecard.map(innings => ({
      inningsId: innings.inningsId,
      batTeamName: innings.batTeamName,
      batTeamSName: innings.batTeamSName,
      score: innings.score || 0,
      wickets: innings.wickets || 0,
      overs: innings.overs || "0.0",
      runRate: innings.runRate || "0.00",
      ballNbr: innings.ballNbr,
      rpb: innings.rpb,
      batsmen: innings.batsman?.map(bat => ({
        id: bat.id,
        name: bat.name,
        nickName: bat.nickName,
        balls: bat.balls || 0,
        runs: bat.runs || 0,
        fours: bat.fours || 0,
        sixes: bat.sixes || 0,
        strkRate: bat.strkRate || "0.00",
        outDec: bat.outDec || "",
        isCaptain: bat.isCaptain || false,
        isKeeper: bat.isKeeper || false
      })) || [],
      bowlers: innings.bowler?.map(bowl => ({
        id: bowl.id,
        name: bowl.name,
        nickName: bowl.nickName,
        overs: bowl.overs || "0.0",
        maidens: bowl.maidens || 0,
        wickets: bowl.wickets || 0,
        runs: bowl.runs || 0,
        economy: bowl.economy || "0.00",
        balls: bowl.balls || 0
      })) || [],
      extras: {
        legByes: innings.extras?.legByes || 0,
        byes: innings.extras?.byes || 0,
        wides: innings.extras?.wides || 0,
        noBalls: innings.extras?.noBalls || 0,
        total: innings.extras?.total || 0
      },
      fow: innings.fow?.fow?.map(fall => ({
        batsmanId: fall.batsmanId,
        batsmanName: fall.batsmanName,
        overNbr: fall.overNbr,
        runs: fall.runs,
        ballNbr: fall.ballNbr
      })) || [],
      partnership: innings.partnership?.partnership?.map(p => ({
        bat1Id: p.bat1Id,
        bat1Name: p.bat1Name,
        bat1Runs: p.bat1Runs || 0,
        bat1Balls: p.bat1Balls || 0,
        bat1Ones: p.bat1Ones || 0,
        bat1Twos: p.bat1Twos || 0,
        bat1Threes: p.bat1Threes || 0,
        bat1Boundaries: p.bat1Boundaries || 0,
        bat1fours: p.bat1fours || 0,
        bat1sixes: p.bat1sixes || 0,
        bat2Id: p.bat2Id,
        bat2Name: p.bat2Name,
        bat2Runs: p.bat2Runs || 0,
        bat2Balls: p.bat2Balls || 0,
        bat2Ones: p.bat2Ones || 0,
        bat2Twos: p.bat2Twos || 0,
        bat2Threes: p.bat2Threes || 0,
        bat2Boundaries: p.bat2Boundaries || 0,
        bat2fours: p.bat2fours || 0,
        bat2sixes: p.bat2sixes || 0,
        totalRuns: p.totalRuns || 0,
        totalBalls: p.totalBalls || 0
      })) || []
    }));

    const newMatchScore = {
      matchId,
      status: matchData.status,
      isMatchComplete: matchData.isMatchComplete,
      responseLastUpdated: new Date(), // Ensure this is a Date object
      innings: processedInnings,
    };

    // Store in database - use findOneAndUpdate with new:true to return the updated document
    const storedMatchScore = await MatchScore.findOneAndUpdate(
      { matchId }, 
      newMatchScore, 
      { upsert: true, new: true }
    );

    return storedMatchScore;
  } catch (error) {
    console.error(`Error fetching score for match ${matchId}:`, error.message);
    return null;
  }
};

// Route to fetch and store match score
router.get("/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    // First check if we have the data in the database
    let matchScore = await MatchScore.findOne({ matchId });
    
    // If data exists in the database
    if (matchScore) {
      // Check if the data is fresh enough (less than 30 seconds old)
      const lastUpdated = new Date(matchScore.responseLastUpdated || 0);
      const currentTime = new Date();
      const timeDifference = currentTime - lastUpdated;
      
      // If data is older than 30 seconds, update it in the background
      if (timeDifference > 30000) {
        // Update in background, don't wait for response
        fetchMatchScore(matchId).catch(err => 
          console.error(`Background update failed for match ${matchId}:`, err.message)
        );
      }
      
      return res.status(200).json({
        message: "Match score fetched from database",
        matchScore,
        fromCache: true
      });
    }
    
    // If no data in DB, fetch from API
    await fetchMatchScore(matchId);
    
    // Then retrieve the stored data from database to ensure we're sending
    // exactly what's in the database
    matchScore = await MatchScore.findOne({ matchId });
    
    if (!matchScore) {
      return res.status(404).json({ message: "Match score not found" });
    }

    res.status(200).json({
      message: "Match score fetched and stored successfully",
      matchScore,
      fromCache: false
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching match score", error: error.message });
  }
});

// Route to get all stored match scores
router.get("/all-scores", async (req, res) => {
  try {
    const matchScores = await MatchScore.find({});
    res.status(200).json({ message: "All stored match scores", matchScores });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching match scores", error: error.message });
  }
});

// Schedule to auto-update match scores every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Auto-updating match scores...");
  const storedMatches = await MatchSchedule.find({});

  for (const match of storedMatches) {
    await fetchMatchScore(match.matchId);
  }

  console.log("Match scores updated.");
});

export default router;
