import { Request, Response } from 'express'
import moment from 'moment'
import History from '../models/History'
import { Record } from '../types'

export const getHistoricalData = async (req: Request, res: Response) => {
	try {
		const { location } = req.params

		const result = await History.findOne({ location })

		if (!result) return res.status(400).json({ message: 'No results found.' })

		res.status(200).json(result)
	} catch (err) {
		return res.sendStatus(500)
	}
}
