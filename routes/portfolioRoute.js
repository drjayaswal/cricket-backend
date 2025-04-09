import express from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post("/set-portfolio", authMiddleware, async(req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized: No user data in token" });
        }
    
        const userId = req.user.userId;
        const user = await User.findById(userId).select("-password");
    
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Get portfolio data from request body
        const { playerId,playerName, team,initialPrice, price, quantity, runs } = req.body;
        
        // Validate required fields
        if (!playerId || !team || price === undefined || quantity === undefined) {
            return res.status(400).json({ message: "Missing required portfolio data" });
        }
        
        // Check if user already has this player in portfolio
        const existingPortfolioIndex = user.portfolio.findIndex(
            item => item.playerId.toString() === playerId.toString()
        );

        console.log(user.portfolio);
        
        
        const transactionAmount = price * quantity;
        
        if (existingPortfolioIndex !== -1) {
            // Portfolio entry exists - update it
            const portfolioItem = user.portfolio[existingPortfolioIndex];
            
            // Add a new transaction
            portfolioItem.transactions.push({
                type: "buy", 
                quantity, 
                price,
                runs
            });
            
            // Update current holdings
            portfolioItem.currentHoldings += quantity;
            
            // Calculate new average buy price
            const totalInvested = portfolioItem.averageBuyPrice * (portfolioItem.currentHoldings - quantity) + (price * quantity);
            portfolioItem.averageBuyPrice = totalInvested / portfolioItem.currentHoldings;
            
            // Update initial investment
            portfolioItem.initialInvestment += transactionAmount;
            
            // Update current value based on the latest price
            portfolioItem.currentValue = portfolioItem.currentHoldings * price;
            
            // Calculate profit/loss
            portfolioItem.profit = portfolioItem.currentValue - portfolioItem.initialInvestment;
            
        } else {
            // Add new portfolio entry
            user.portfolio.push({
                playerId,
                playerName,
                team,
                initialPrice,
                transactions: [{
                    type: "buy",
                    quantity,
                    price,
                    runs
                }],
                currentHoldings: quantity,
                averageBuyPrice: price,
                initialInvestment: transactionAmount,
                currentValue: transactionAmount,
                profit: 0 // Initially no profit/loss
            });
        }
        
        // Save updated user data
        await user.save();
        
        res.status(200).json({ 
            message: "Portfolio updated successfully", 
            portfolio: user.portfolio 
        });
        
    } catch (err) {
        console.error("❌ Error storing portfolio data:", err);
        res.status(500).json({ message: "Error storing portfolio data" });
    }
});

router.post("/sell-portfolio", authMiddleware, async(req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized: No user data in token" });
        }
    
        const userId = req.user.userId;
        const user = await User.findById(userId).select("-password");
        console.log(user);
        
    
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Get selling data from request body
        const { playerId, price, quantity, runs } = req.body;
        
        // Validate required fields
        if (!playerId || price === undefined || quantity === undefined) {
            return res.status(400).json({ message: "Missing required sell data" });
        }
        
        // Find the portfolio item
        const portfolioIndex = user.portfolio.findIndex(item => item.playerId.toString() === playerId.toString());
        console.log(portfolioIndex);
        
        
        if (portfolioIndex === -1) {
            return res.status(404).json({ message: "Player not found in portfolio" });
        }
        
        const portfolioItem = user.portfolio[portfolioIndex];
        
        // Check if user has enough stocks to sell
        if (portfolioItem.currentHoldings < quantity) {
            return res.status(400).json({ 
                message: "Not enough holdings to sell",
                available: portfolioItem.currentHoldings 
            });
        }
        
        // Add sell transaction
        portfolioItem.transactions.push({
            type: "sell",
            quantity,
            price,
            runs
        });
        
        // Update holdings
        portfolioItem.currentHoldings -= quantity;
        
        // Update current value
        portfolioItem.currentValue = portfolioItem.currentHoldings * price;
        
        // Calculate profit/loss
        portfolioItem.profit = portfolioItem.currentValue - 
            (portfolioItem.averageBuyPrice * portfolioItem.currentHoldings);
        
        // If all stocks sold, consider removing the entry or marking it as completely sold
        if (portfolioItem.currentHoldings === 0) {
            // Option 1: Remove the entry
            // user.portfolio.splice(portfolioIndex, 1);
            
            // Option 2: Keep history but mark as zero holdings
            portfolioItem.currentValue = 0;
        }
        
        await user.save();
        
        res.status(200).json({
            message: "Successfully sold stocks",
            portfolio: user.portfolio
        });
        
    } catch (err) {
        console.error("❌ Error processing sell request:", err);
        res.status(500).json({ message: "Error processing sell request" });
    }
});


// Get user's portfolio
router.get("/get-portfolio", authMiddleware, async(req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No user data in token" });
        }
    
        const userId = req.user.userId;
    
        // Find user by ID in MongoDB
        const user = await User.findById(userId).select("-password");
    
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json({ portfolio: user.portfolio });
        
    } catch (err) {
        console.error("❌ Error retrieving portfolio data:", err);
        res.status(500).json({ message: "Error retrieving portfolio data" });
    }
});

export default router;