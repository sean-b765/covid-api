import axios from 'axios'
import moment from 'moment'
import History from '../models/History'
import { CurrentRecord, RawData, Record } from '../types'
import csv from 'csvtojson'
import Current from '../models/Current'

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
					// Eliminate data redundancy before storing
					// Create an array of historical data rather than storing
					//  the same country data for all dates

					let _obj: { [key: string]: { data?: Array<RawData> } } = {}

					res.map((record) => {
						// Already have an existing location key
						if (Object.keys(_obj).includes(record.location)) {
							_obj[record.location].data.push({
								date: record.date,
								new_cases: record.new_cases,
								new_deaths: record.new_deaths,
								total_cases: record.total_cases,
								total_deaths: record.total_deaths,
								weekly_cases: record.weekly_cases,
								weekly_deaths: record.weekly_deaths,
								biweekly_cases: record.biweekly_cases,
								biweekly_deaths: record.biweekly_deaths,
							})
						} else {
							// Need to create the location key, initializing the data
							_obj[record.location] = {
								data: [],
							}
						}
					})

					// Ensure all data are sorted
					Object.values(_obj).map((data) => {
						data.data = data.data.sort((a: RawData, b: RawData) =>
							moment(a.date).diff(b.date)
						)
					})

					// Create records
					Object.keys(_obj).map(async (data) => {
						await History.create({
							location: data,
							data: _obj[data].data,
						})
					})
				})
		})
		.catch((err) => console.log(err))
}

/*
  Only used for testing getDataDaily(). Should never be called in production
*/
const deleteDay = async (date: string) => {
	const result = await History.deleteMany({ date })
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
						const dateNow = moment().format('YYYY-MM-DD')

						console.log(`DB_UPDATE::${dateNow} - Starting daily DB update.`)

						// Filter the array by only World records
						const csvArray = records.filter((item) => item.location === 'World')
						// if the array is not sorted, we can't grab the last record to find the last date
						let sortedCSV = csvArray.sort((a: Record, b: Record) =>
							moment(a.date).diff(b.date)
						)
						// The last index of the array will be the latest record
						const latestAvailableDate = sortedCSV[csvArray.length - 1].date

						// Check if the latest date is already in the database
						const dbData = await History.findOne({
							location: 'World',
						})

						const latestInDb = dbData.data[dbData.data.length - 1]

						// Exit if no update is required,
						//  i.e. DB latest record date is the same as CSV data date
						if (latestInDb.date === latestAvailableDate) {
							console.log(
								`DB_UPDATE::${dateNow} - Already up-to-date, daily update not needed - latest available from source: ${latestAvailableDate}`
							)
							return
						}

						// The latest record does not exist in the database
						const _latestInDb = dbData.data[dbData.data.length - 1]

						console.log(
							`DB_UPDATE::${dateNow} - Adding data after ${_latestInDb.date}`
						)

						// We need to filter JHU data by date and add all of the most recent records which do not appear in the DB
						const newData = records.filter((record) =>
							moment(record.date).isAfter(_latestInDb.date)
						)

						// Create documents with new JHU data
						const result = await History.create(newData)

						console.log(
							`DB_UPDATE::${dateNow} - Daily update completed. Added ${
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

/*
	Get current data for the day, includes cumulative cases
*/
export const getCurrentData = () => {
	axios
		.get(
			`${process.env.CURRENT_SOURCE_URL}${moment()
				.subtract(1, 'day')
				.format('MM-DD-YYYY')}.csv`
		)
		.then((res) => {
			// convert text (csv)
			csv()
				.fromString(res.data)
				.then(async (res: CurrentRecord[]) => {
					// Make sure to filter out records without lat/long fields

					const records = res
						.map((item: CurrentRecord) => {
							return {
								zip: item?.FIPS,
								county: item?.Admin2,
								state: item?.Province_State,
								country: item?.Country_Region,
								lat: item?.Lat,
								lng: item?.Long_,
								cumulative: item?.Confirmed,
								deaths: item?.Deaths,
								recovered: item?.Recovered,
							}
						})
						.filter((item) => item.lat && item.lng)
					// create DB records
					await Current.create(records)
				})
		})
		.catch((err) => console.log(err))
}
