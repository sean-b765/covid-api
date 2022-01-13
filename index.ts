import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { getDataDaily } from './lib/helpers'
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

setInterval(getDataDaily, 1000)
