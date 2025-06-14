export function quantizeEmbedding(embedding: number[]): number[] {
  return embedding.map(x => Math.round(x * 1000));
}