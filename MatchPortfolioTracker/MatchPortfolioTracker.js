import { MatchScore } from "../models/MatchScore.js";
import User from "../models/User.js";
// import { fetchMatchScore } from "./your-fetch-function.js"; // wherever fetchMatchScore is exported
import { fetchMatchScore } from "../routes/matchScores.js";
import mongoose from "mongoose";

const activePortfolioMatches = new Map(); // matchId => interval

export async function startTrackingUserPortfolioMatches() {
  try {
    // Fetch all users who have portfolios
    const users = await User.find({ "portfolio.0": { $exists: true } });

    // Extract unique matchIds from all user portfolios
    const matchIdSet = new Set();
    users.forEach((user) => {
      user.portfolio.forEach((item) => {
        matchIdSet.add(item.matchId);
      });
    });

    const matchIds = [...matchIdSet];
    console.log("Tracking matchIds from user portfolios:", matchIds);

    for (const matchId of matchIds) {
      if (activePortfolioMatches.has(matchId)) continue;

      // Check if match is already complete
      const match = await MatchScore.findOne({ matchId });
      if (match?.isMatchComplete) {
        console.log(`Skipping completed match ${matchId}`);
        continue;
      }

      const interval = setInterval(async () => {
        const updatedMatch = await fetchMatchScore(matchId);

        // Stop interval if match completes
        if (updatedMatch?.isMatchComplete) {
          clearInterval(activePortfolioMatches.get(matchId));
          activePortfolioMatches.delete(matchId);
          console.log(`Stopped polling match ${matchId} (completed)`);
        }
      }, 10000); // 10 seconds

      activePortfolioMatches.set(matchId, interval);
    }
  } catch (err) {
    console.error("Error starting portfolio match tracking:", err.message);
  }
}
