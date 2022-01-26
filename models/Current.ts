import mongoose from 'mongoose'

export interface ICurrent extends mongoose.Document {
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
	lat: string
	lng: string
	cumulative: string
	deaths: string
	recovered: string
}

// FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio
const currentSchema = new mongoose.Schema({
	location: String,
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
	lat: { type: String, required: false },
	lng: { type: String, required: false },
	cumulative: { type: String, required: false },
	deaths: { type: String, required: false },
	recovered: { type: String, required: false },
})

export default mongoose.model<ICurrent>('Current', currentSchema)
