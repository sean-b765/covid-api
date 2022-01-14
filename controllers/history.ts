import { Request, Response } from 'express'
import moment from 'moment'
import Country from '../models/Country'
import { Record } from '../types'

export const getHistoricalData = async (req: Request, res: Response) => {
	try {
		const { location } = req.params

		const result = await Country.find({ location })

		if (!result) return res.status(400).json({ message: 'No results found.' })

		let sorted = result.sort((a: Record, b: Record) =>
			moment(a.date).diff(b.date)
		)

		res.status(200).json(sorted)
	} catch (err) {
		return res.sendStatus(500)
	}
}
