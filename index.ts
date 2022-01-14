import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { appendData } from './lib/helpers'
import countryRoutes from './routes/country'

dotenv.config()

const app = express()

mongoose.connect(process.env.MONGO_URL, () => {
	console.log(`Connected to MongoDB: ${process.env.MONGO_URL}`)
})

// Middleware
app.use(express.json())

// Routes
app.use(countryRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log(`Express listening on port ${PORT}`)
})

// IIFE
// Run every 12 hours
;(function dailyTimer() {
	appendData()
	setTimeout(dailyTimer, 1000 * 60 * 60 * 12)
})()
