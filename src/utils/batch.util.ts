/**
 * 批量处理数组工具函数
 * @param items 待处理的数组
 * @param batchSize 每批处理的数量（默认5）
 * @param handler 每批的处理函数（异步）
 * @returns 所有批次处理完成的Promise
 */
export async function batchHandler<T>(
    items: T[],
    handler: (batch: T) => Promise<T>,
    batchSize: number = 5,
): Promise<T[]> {
    // 边界处理：空数组直接返回
    if (!items || items.length === 0) {
        return;
    }

    const results: T[] = new Array(items.length);
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        chunks.push(items.slice(i, i + batchSize));
    }

    for (const [chunkIndex, chunk] of chunks.entries()) {
        const chunkResults = await Promise.all(
            chunk.map(async (chunkObj, index) => {
                const result = await handler(chunkObj);
                const originalIndex = chunkIndex * batchSize + index;
                return { originalIndex, result };
            })
        )

        chunkResults.forEach(({ originalIndex, result }) => {
            results[originalIndex] = result;
        })
    }
    // console.log('results>>>>>>',results);
    return results;
}