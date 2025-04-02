import express from 'express';
import { MatchSchedule } from '../models/MatchSchedule.js';
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';

const router = express.Router();

// RapidAPI configuration
const rapidAPIHeaders = {
  'x-rapidapi-key': process.env.CRICKET_API,
  'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
};

// Route to fetch and store all matches
router.get('/fetch-and-store-all', async (req, res) => {
  try {
    // Fetch all matches from Cricbuzz API
    const response = await axios.get('https://cricbuzz-cricket.p.rapidapi.com/schedule/v1/all', {
      headers: rapidAPIHeaders
    });
    console.log(response.data);
    

    // Remove any existing match schedules to avoid duplicates
    await MatchSchedule.deleteMany({});

    // Process and store only the schedule-related entries
    const scheduleEntries = response.data.matchScheduleMap.filter(
      entry => entry.scheduleAdWrapper && entry.scheduleAdWrapper.matchScheduleList
    );

    // Store processed schedule entries
    const storedSchedules = await MatchSchedule.create(
      scheduleEntries.map(entry => ({
        date: entry.scheduleAdWrapper.date,
        longDate: entry.scheduleAdWrapper.longDate,
        matchScheduleList: entry.scheduleAdWrapper.matchScheduleList
      }))
    );

    res.status(200).json({
      message: 'All matches fetched and stored successfully',
      totalMatchesStored: storedSchedules.length,
      processedEntries: scheduleEntries.length
    });
  } catch (error) {
    console.error('Error fetching and storing matches:', error);
    
    res.status(500).json({ 
      message: 'Failed to fetch and store matches',
      error: {
        message: error.message,
        details: error.response ? error.response.data : 'No additional error details'
      }
    });
  }
});



// Route to get the count of stored matches
router.get('/matches-count', async (req, res) => {
  try {
    const matchCount = await MatchSchedule.countDocuments();
    
    res.status(200).json({
      message: 'Total matches count retrieved',
      count: matchCount
    });
  } catch (error) {
    console.error('Error counting matches:', error);
    res.status(500).json({ 
      message: 'Failed to count matches',
      error: error.message 
    });
  }
});

// Route to retrieve all stored matches
router.get('/all-stored-matches', async (req, res) => {
  try {
    const storedMatches = await MatchSchedule.find({});
    
    res.status(200).json({
      message: 'All stored matches retrieved',
      matches: storedMatches
    });
  } catch (error) {
    console.error('Error retrieving stored matches:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve stored matches',
      error: error.message 
    });
  }
});

export default router;