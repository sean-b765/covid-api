import mongoose from 'mongoose'
import { RawData } from '../types'

export interface IHistory extends mongoose.Document {
	location: string
	data: Array<RawData>
}

const historySchema = new mongoose.Schema({
	location: String,
	data: [
		{
			date: String,
			new_cases: String,
			new_deaths: String,
			total_cases: String,
			total_deaths: String,
			weekly_cases: String,
			weekly_deaths: String,
			biweekly_cases: String,
			biweekly_deaths: String,
		},
	],
})

export default mongoose.model<IHistory>('History', historySchema)
