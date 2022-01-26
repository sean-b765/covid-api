import mongoose from 'mongoose'
import { HistoricalRecord } from '../types'

export interface ICountry extends mongoose.Document {
	location: string
	provinces: Array<{
		county: string
		zip: string
		state: string
		lat: string
		lng: string
		cumulative: string
		deaths: string
		recovered: string
	}>
	data: Array<HistoricalRecord>
	lat: string
	lng: string
	cumulative: string
	deaths: string
	recovered: string
}

const countrySchema = new mongoose.Schema({
	location: { type: String, unique: true },
	provinces: [
		{
			county: { type: String, required: false },
			zip: { type: String, required: false },
			state: { type: String, required: false },
			lat: { type: String },
			lng: { type: String },
			cumulative: { type: String },
			deaths: { type: String },
			recovered: { type: String },
		},
	],
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
	lat: { type: String, required: false },
	lng: { type: String, required: false },
	cumulative: { type: String, required: false },
	deaths: { type: String, required: false },
	recovered: { type: String, required: false },
})

export default mongoose.model<ICountry>('Country', countrySchema)
