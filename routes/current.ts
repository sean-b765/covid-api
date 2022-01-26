import { Router } from 'express'
import { getCurrentData } from '../lib/data'

const router = Router()

router.get('/history/:location', getCurrentData)

export default router
