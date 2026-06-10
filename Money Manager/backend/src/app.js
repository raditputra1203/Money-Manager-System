import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config.js'
import authRoutes from './routes/auth.routes.js'
import financeRoutes from './routes/finance.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
)
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'aol-money-manager-api' })
})

app.get('/api', (_req, res) => {
  res.json({
    name: 'AOL Money Manager API',
    version: '1.0.0',
    docs: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me', 'PATCH /api/auth/me'],
      finance: [
        'GET /api/finance',
        'POST /api/finance/books',
        'PATCH /api/finance/books/:id',
        'PATCH /api/finance/books/default',
        'DELETE /api/finance/books/:id',
        'PATCH /api/finance/settings',
        'POST /api/finance/accounts',
        'PATCH /api/finance/accounts/:id',
        'POST /api/finance/transactions',
        'PATCH /api/finance/transactions/:id',
        'DELETE /api/finance/transactions/:id',
        'POST /api/finance/transfers',
        'POST /api/finance/topups',
        'POST /api/finance/feedbacks',
      ],
    },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/finance', financeRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

export default app
