export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface StreamedAnswer {
  stream: ReadableStream<Uint8Array>;
  done: Promise<string>;
}
