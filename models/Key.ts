import mongoose from 'mongoose'

export interface ILastDate extends mongoose.Document {
	lastPullDate: string
}

const historySchema = new mongoose.Schema({
	lastPullDate: { type: String, unique: true },
})

export default mongoose.model<ILastDate>('Key', historySchema)
