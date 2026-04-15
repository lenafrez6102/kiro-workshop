import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('Environment variables loaded:')
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET')
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET')
console.log('AWS_SESSION_TOKEN:', process.env.AWS_SESSION_TOKEN ? 'SET' : 'NOT SET')
console.log('AWS_REGION:', process.env.AWS_REGION)

const client = new STSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

try {
  const command = new GetCallerIdentityCommand({})
  const response = await client.send(command)
  console.log('\n✅ Credentials are VALID')
  console.log('Account:', response.Account)
  console.log('UserId:', response.UserId)
  console.log('Arn:', response.Arn)
} catch (error) {
  console.log('\n❌ Credentials are INVALID')
  console.log('Error:', error.message)
}
