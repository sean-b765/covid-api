import mongoose from 'mongoose'

// FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio
const currentSchema = new mongoose.Schema({
	zip: { type: String, required: false },
	county: { type: String, required: false },
	state: { type: String },
	country: { type: String },
	lat: { type: String },
	lng: { type: String },
	cumulative: { type: String },
	deaths: { type: String },
	recovered: { type: String },
})

export default mongoose.model('Current', currentSchema)
