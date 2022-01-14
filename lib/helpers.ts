import axios from 'axios'
import moment from 'moment'
import Country from '../models/Country'
import { Record } from '../types'
import csv from 'csvtojson'

/*
  Should only be called for first initialization
*/
export const getAllData = () => {
	axios
		.get(process.env.SOURCE_URL)
		.then((res) => {
			// convert text (csv)
			csv()
				.fromString(res.data)
				.then(async (res: Record[]) => {
					await Country.create(res)
				})
		})
		.catch((err) => console.log(err))
}

/*
  Only used for testing getDataDaily(). Should never be called in production
*/
const deleteDay = async (date: string) => {
	const result = await Country.deleteMany({ date })
	console.log(`Deleted ${result.deletedCount} documents`)
}

/*
  Function ran on a timer to update collection daily
*/
export const appendData = () => {
	axios
		.get(process.env.SOURCE_URL)
		.then((res) => {
			csv()
				.fromString(res.data)
				.then(async (records: Record[]) => {
					try {
						const date = moment().format('YYYY-MM-DD')
						console.log(`DB_UPDATE::${date} - Starting daily DB update.`)

						// Filter the array by only World records
						const array = records.filter((item) => item.location === 'World')
						// if the array is not sorted, we can't grab the last record to find the last date
						let sorted = array.sort((a: Record, b: Record) =>
							moment(a.date).diff(b.date)
						)
						// The last index of the array will be the latest record
						const latestAvailableDate = sorted[array.length - 1].date

						// Check if the latest date is already in the database
						const isLatestInDb = await Country.exists({
							date: latestAvailableDate,
						})
						// Exit if no update is required
						if (isLatestInDb) {
							console.log(
								`DB_UPDATE::${date} - Already up-to-date, daily update not needed - latest available from source: ${latestAvailableDate}`
							)
							return
						}

						// The latest record does not exist in the database

						const latestDBResults: Record[] = await Country.find({
							location: 'World',
						})

						const latestInDb = latestDBResults[latestDBResults.length - 1]

						console.log(
							`DB_UPDATE::${date} - Adding data after ${latestInDb.date}`
						)

						// We need to filter JHU data by date and add all of the most recent records which do not appear in the DB
						const newData = records.filter((record) =>
							moment(record.date).isAfter(latestInDb.date)
						)

						// Create documents with new JHU data
						const result = await Country.create(newData)

						console.log(
							`DB_UPDATE::${date} - Daily update completed. Added ${
								result.length
							} new documents, starting at ${moment(latestInDb.date)
								.add(1, 'day')
								.format('YYYY-MM-DD')} to ${latestAvailableDate}.`
						)
					} catch (err) {
						console.log(err)
						console.log(
							`DB_UPDATE::${moment().format('YYYY-MM-DD')} - Error/exiting.`
						)
					}
				})
		})
		.catch((err) => console.log(err))
}
