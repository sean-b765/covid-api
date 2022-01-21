import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import historyRoutes from './routes/history'
import homeRoute from './routes/home'
import currentRoutes from './routes/current'
import cors from 'cors'
import { appendData, getAllData } from './lib/helpers'

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
// Run every 12 hours. In heroku this will run when the service stops idling as well.
;(function dailyTimer() {
	appendData()
	setTimeout(dailyTimer, 1000 * 60 * 60 * 12)
})()
