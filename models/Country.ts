import mongoose from 'mongoose'

const countrySchema = new mongoose.Schema({
	date: String,
	location: String,
	new_cases: String,
	new_deaths: String,
	total_cases: String,
	total_deaths: String,
	weekly_cases: String,
	weekly_deaths: String,
	biweekly_cases: String,
	biweekly_deaths: String,
})

export default mongoose.model('Country', countrySchema)
