import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import History from '../models/History'
import {
	RawCurrentRecord,
	HistoricalRecord,
	RawHistoricalRecord,
	CurrentRecord,
} from '../types'
import csv from 'csvtojson'
import Current from '../models/Current'
import countryCodes from './countryCodes'
import Key from '../models/Key'

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
				.then(async (res: RawHistoricalRecord[]) => {
					// Eliminate data redundancy before storing
					// Create an array of historical data rather than storing
					//  the same country data for all dates

					let _obj: { [key: string]: { data?: Array<HistoricalRecord> } } = {}

					res.map((record) => {
						// Already have an existing location key
						// test
						if (record.date === '2022-01-20' || record.date === '2022-01-19')
							return

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

					// Ensure all data is sorted
					Object.values(_obj).map((data) => {
						data.data = data.data.sort(
							(a: HistoricalRecord, b: HistoricalRecord) =>
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
				.then(
					async function handleJsonRecords(records: RawHistoricalRecord[]) {
						try {
							const dateNow = moment().format('YYYY-MM-DD')

							console.log(`DB_UPDATE::${dateNow} - Starting daily DB update.`)

							// Filter the array by only World records
							const csvArray = records.filter(
								(item) => item.location === 'World'
							)
							// The last index of the array will be the latest record
							const latestAvailableDate = csvArray[csvArray.length - 1].date

							// Get all History data from Mongo
							const documents = await History.find()

							// Single test document to find latest date in data array
							const worldDocument = documents.filter(
								(doc) => doc.location === 'World'
							)[0]

							const latestInDb =
								worldDocument.data[worldDocument.data.length - 1]

							// Exit if no update is required,
							//  i.e. DB latest record date is the same as CSV data date
							if (latestInDb.date === latestAvailableDate) {
								console.log(
									`DB_UPDATE::${dateNow} - Already up-to-date, daily update not needed - latest available from source: ${latestAvailableDate}`
								)
								return
							}

							console.log(
								`DB_UPDATE::${dateNow} - Adding data after ${latestInDb.date}`
							)

							// We need to filter JHU data by date to isolate the newest data
							const newData = records.filter((record) =>
								moment(record.date).isAfter(latestInDb.date)
							)

							// Map through existing documents,
							//  pushing new data to the 'data' field
							documents.forEach(async (document) => {
								// filter the new JHU data,
								//  push each new record to the document.data array
								newData.filter((data) => {
									if (data.location !== document.location) return

									document.data.push({
										date: data.date,
										total_cases: data.total_cases,
										total_deaths: data.total_deaths,
										new_cases: data.new_cases,
										new_deaths: data.new_deaths,
										weekly_cases: data.weekly_cases,
										weekly_deaths: data.weekly_deaths,
										biweekly_cases: data.biweekly_cases,
										biweekly_deaths: data.biweekly_deaths,
									})
								})

								// save the document
								await document.save()
							})

							console.log(
								`DB_UPDATE::${dateNow} - Daily update completed. Added data from ${moment(
									latestInDb.date
								)
									.add(1, 'day')
									.format('YYYY-MM-DD')} to ${latestAvailableDate}, inclusive.`
							)
						} catch (err) {
							console.log(err)
							console.log(
								`DB_UPDATE::${moment().format('YYYY-MM-DD')} - Error/exiting.`
							)
						}
					},
					(error) => {
						console.log(error)
					}
				)
		})
		.catch((err) => console.log(err))
}

/*
	Get current data for the day, includes cumulative cases
*/
export const getCurrentData = async () => {
	let response = 0,
		pass = 0

	// If response is 404, there is no csv data for the date
	do {
		const { status } = await getCurrent(++pass)
		response = status

		console.log(pass, status)
	} while (response === 404)
}

type CurrentDictionary = {
	[key: string]: {
		location: string
		lat: string
		lng: string
		provinces: Array<{
			zip: string
			county: string
			state: string
			lat: string
			lng: string
			cumulative: string
			deaths: string
			recovered: string
		}>
		cumulative?: string
		deaths?: string
		recovered?: string
	}
}

async function getCurrent(pass: number) {
	let result: AxiosResponse<any, any>,
		dictionary: CurrentDictionary = {}

	const date = moment()
		.subtract(pass, pass === 1 ? 'day' : 'days')
		.format('MM-DD-YYYY')

	// GET the latest csv data from JHU
	try {
		result = await axios.get(`${process.env.CURRENT_SOURCE_URL}${date}.csv`)
	} catch (err) {
		return { status: 404 }
	}

	if (result.status !== 200) return { status: 404 }

	// CSV to JSON
	let res = await csv().fromString(result.data)

	// Make sure to filter out records without lat/long fields
	const _records: RawCurrentRecord[] = res.filter(
		(item) => item.lat !== '' && item.lng !== ''
	)

	_records.forEach((record: RawCurrentRecord) => {
		// Get the db_name, if it exists. United States = US in JHU data, so also take into account the alpha2 code
		const ccode = countryCodes.filter(
			(country) =>
				country.db_name === record.Country_Region ||
				country.alpha2code === record.Country_Region
		)[0]

		let db_name, latitude, longitude

		if (ccode) {
			db_name = ccode.db_name
			latitude = ccode.latitude
			longitude = ccode.longitude
		}

		if (db_name === undefined) return

		// Now we need to filter the array again, by Country_Region, to find the provinces
		// const provinces = _records.filter(
		// 	(record) => record.Country_Region === record.Country_Region
		// )

		// Store results in our dictionary object
		if (Object.keys(dictionary).includes(db_name)) {
			dictionary[db_name].provinces.push({
				zip: record?.FIPS,
				county: record?.Admin2,
				state: record?.Province_State,
				lat: record?.Lat,
				lng: record?.Long_,
				cumulative: record?.Confirmed,
				deaths: record?.Deaths,
				recovered: record?.Recovered,
			})
		} else {
			// If this is a state rather than country, initialize accordingly
			if (record?.Province_State !== '') {
				dictionary[db_name] = {
					location: db_name,
					lat: latitude,
					lng: longitude,
					provinces: [],
				}
				// Add to provinces
				dictionary[db_name].provinces.push({
					zip: record?.FIPS,
					county: record?.Admin2,
					state: record?.Province_State,
					lat: record?.Lat,
					lng: record?.Long_,
					cumulative: record?.Confirmed,
					deaths: record?.Deaths,
					recovered: record?.Recovered,
				})
			} else {
				// It is a country, not a state. Provinces will always be an empty array for countries without state data
				dictionary[db_name] = {
					location: db_name,
					lat: latitude,
					lng: longitude,
					provinces: [],
					cumulative: record?.Confirmed,
					deaths: record?.Deaths,
					recovered: record?.Recovered,
				}
			}
		}
	})

	// Create DB records
	Object.values(dictionary).map(async (value) => {
		await Current.create(
			value.provinces.length === 0
				? {
						location: value.location,
						lat: value.lat,
						lng: value.lng,
						provinces: [],
						cumulative: value.cumulative,
						deaths: value.deaths,
						recovered: value.recovered,
				  }
				: {
						location: value.location,
						lat: value.lat,
						lng: value.lng,
						provinces: value.provinces,
						cumulative: `${value.provinces
							.map((item) => Number(item.cumulative))
							.reduce((prev, next) => prev + next)}`,
						deaths: `${value.provinces
							.map((item) => Number(item.deaths))
							.reduce((prev, next) => prev + next)}`,
						recovered: `${value.provinces
							.map((item) => Number(item.recovered))
							.reduce((prev, next) => prev + next)}`,
				  }
		)
	})

	// Create the Key for the lastDate so we can perform the Current update once a day
	try {
		await Key.create({ lastPullDate: date })
	} catch (e) {}

	return { status: 200 }
}
