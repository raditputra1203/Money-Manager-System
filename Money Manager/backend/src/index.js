import app from './app.js'
import { config } from './config.js'

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`)
  console.log(`Health: http://localhost:${config.port}/health`)
})
