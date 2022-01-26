import { Request, Response } from 'express'
import moment from 'moment'
import Current from '../models/Current'
import { RawHistoricalRecord } from '../types'

export const getCurrentData = async (req: Request, res: Response) => {
	try {
		const { location } = req.params

		const result = await Current.find({ location })

		if (!result) return res.status(400).json({ message: 'No results found.' })

		res.status(200).json(result)
	} catch (err) {
		return res.sendStatus(500)
	}
}
