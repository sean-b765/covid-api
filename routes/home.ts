import { Request, Response, Router } from 'express'
import countryCodes from '../lib/countryCodes'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
	res.status(200).send(
		`<h1>Hit /history/{{location}} to get historical data of the specified location. /current/{{location}} will return the up-to-date statistics.</h1>
			<p>/locations lists all the available locations.</p>
			`
	)
})
router.get('/locations', async (req: Request, res: Response) => {
	res.status(200).json(
		countryCodes.map((value) => {
			return {
				name: value.db_name,
				lat: value.latitude,
				lng: value.longitude,
				alpha2: value.alpha2code,
				alpha3: value.alpha3code,
			}
		})
	)
})

export default router
