import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming'

let client = null

function getClient() {
  if (!client) {
    // Use default credential provider chain
    client = new TranscribeStreamingClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
  }
  return client
}

/**
 * Starts an AWS Transcribe streaming session and yields transcript events.
 *
 * @param {AsyncIterable<Uint8Array|Buffer>} audioStream - Binary audio chunks from the WebSocket client
 * @yields {{ type: 'transcript', text: string } | { type: 'error', message: string }}
 */
export async function* startTranscriptionSession(audioStream) {
  // Wrap the raw audio stream into the shape Transcribe expects:
  // an async iterable of { AudioEvent: { AudioChunk: Uint8Array } }
  async function* toAudioEvents(stream) {
    for await (const chunk of stream) {
      yield {
        AudioEvent: {
          AudioChunk: chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk),
        },
      }
    }
  }

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: 'en-US',
    MediaEncoding: 'pcm',       // PCM 16-bit signed integer
    MediaSampleRateHertz: 16000, // 16 kHz
    AudioStream: toAudioEvents(audioStream),
  })

  try {
    const response = await getClient().send(command)

    for await (const event of response.TranscriptResultStream) {
      // Each event may contain a TranscriptEvent with one or more results
      if (!event.TranscriptEvent) continue

      const results = event.TranscriptEvent?.Transcript?.Results ?? []

      for (const result of results) {
        // Skip partial results - only send final transcripts
        if (result.IsPartial) continue;
        
        // Each result has one or more Alternatives; the first is the best guess
        const text = result.Alternatives?.[0]?.Transcript?.trim()

        if (text) {
          yield { type: 'transcript', text: text + ' ' }
        }
      }
    }
  } catch (err) {
    yield { type: 'error', message: err.message }
  }
}
