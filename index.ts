import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import historyRoutes from './routes/history'
import homeRoute from './routes/home'
import currentRoutes from './routes/current'
import cors from 'cors'
import { appendData, getAllData } from './lib/helpers'
import moment from 'moment'

dotenv.config()

const app = express()

mongoose.connect(process.env.MONGO_URL, () => {
	console.log(`Connected to MongoDB: ${process.env.MONGO_URL}`)
})

// Middleware
app.use(express.json())
app.use(
	cors({
		origin: '*',
	})
)

// Routes
app.use(historyRoutes)
app.use(homeRoute)
app.use(currentRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log(`Express listening on port ${PORT}`)
})

// IIFE
// Run every 50 minutes, executes appendData every few hours
;(function dailyTimer() {
	const hrs = moment().hours()
	// this array specifies the hours of the day which appendData() should be called
	const updateHours = [1, 4, 7, 10, 13, 16, 19, 22]

	if (updateHours.includes(hrs)) appendData()

	setTimeout(dailyTimer, 1000 * 60 * 50)
})()
