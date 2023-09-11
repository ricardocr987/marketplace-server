export function createJsonResponse(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}


export function splitId(str: string): [Buffer, Buffer] {
    return [Buffer.from(str, 'hex'), Buffer.from(str, 'hex')]
}
