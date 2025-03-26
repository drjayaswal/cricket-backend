import mongoose from 'mongoose';

const VenueInfoSchema = new mongoose.Schema({
  ground: String,
  city: String,
  country: String,
  timezone: String
});

const TeamSchema = new mongoose.Schema({
  teamId: Number,
  teamName: String,
  teamSName: String,
  imageId: Number
});

const MatchInfoSchema = new mongoose.Schema({
  matchId: {
    type: Number,
    required: true
  },
  seriesId: Number,
  matchDesc: String,
  matchFormat: String,
  startDate: String,
  endDate: String,
  team1: TeamSchema,
  team2: TeamSchema,
  venueInfo: VenueInfoSchema
});

const MatchScheduleSchema = new mongoose.Schema({
  date: String,
  longDate: String,
  matchScheduleList: [{
    seriesName: String,
    matchInfo: [MatchInfoSchema],
    seriesId: Number,
    seriesHomeCountry: Number,
    seriesCategory: String
  }]
}, {
  timestamps: true
});

// Add a compound index to improve query performance
MatchScheduleSchema.index({ 
  date: 1, 
  'matchScheduleList.seriesName': 1 
});

export const MatchSchedule = mongoose.model('MatchSchedule', MatchScheduleSchema);