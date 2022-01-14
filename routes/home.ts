import { Request, Response, Router } from 'express'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
	res.status(200).json({
		message:
			'Hit /history/{{location}} to get historical data of the specified location.  e.g. /history/North America, /history/World, /history/USA',
	})
})

export default router
