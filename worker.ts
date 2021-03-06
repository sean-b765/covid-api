/**
 * Author: Sean Boaden
 * Date: 28-01-2022
 * Description: Worker thread for performing daily DB updates
 */

import mongoose from 'mongoose'
import { dailyUpdate, initialFetch } from './lib/data'

mongoose.connect(process.env.MONGO_URL, () => {
	console.log(`Connected to MongoDB on worker thread`)
})

// Check if DB needs update every few hours
//  if the lastPullDate was atleast 12 hours ago, it will update the DB

// Every 60 mins - check for daily update
dailyUpdate()
setInterval(dailyUpdate, 1000 * 60 * 60)
