import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('Testing Bedrock access...')

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

const requestBody = {
  messages: [
    {
      role: 'user',
      content: [{ text: 'Say hello in one word.' }],
    },
  ],
  inferenceConfig: {
    maxTokens: 10,
    temperature: 0.5,
  },
}

const command = new InvokeModelCommand({
  modelId: 'amazon.nova-pro-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify(requestBody),
})

try {
  const response = await client.send(command)
  const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'))
  console.log('\n✅ Bedrock access WORKS')
  console.log('Response:', responseBody?.output?.message?.content?.[0]?.text)
} catch (error) {
  console.log('\n❌ Bedrock access FAILED')
  console.log('Error:', error.message)
  console.log('Error code:', error.name)
}
