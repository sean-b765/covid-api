import { Request, Response } from 'express'
import moment from 'moment'
import Current from '../models/Current'
import { Record } from '../types'

export const getCurrentData = async (req: Request, res: Response) => {
	try {
		const result = await Current.find()

		if (!result) return res.status(400).json({ message: 'No results found.' })

		res.status(200).json(result)
	} catch (err) {
		return res.sendStatus(500)
	}
}
