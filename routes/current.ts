import { Router } from 'express'
import { getCurrentData } from '../controllers/current'

const router = Router()

router.get('/current/:location', getCurrentData)

export default router
