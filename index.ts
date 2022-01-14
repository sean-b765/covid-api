import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { appendData, getAllData } from './lib/helpers'
import historyRoutes from './routes/history'
import homeRoute from './routes/home'

dotenv.config()

const app = express()

mongoose.connect(process.env.MONGO_URL, () => {
	console.log(`Connected to MongoDB: ${process.env.MONGO_URL}`)
})

// Middleware
app.use(express.json())

// Routes
app.use(historyRoutes)
app.use(homeRoute)

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
