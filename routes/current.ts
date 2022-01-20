import { Router } from 'express'
import { getCurrentData } from '../lib/helpers'

const router = Router()

router.get('/history/:location', getCurrentData)

export default router
