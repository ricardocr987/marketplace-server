export function parseUrlParams(url: string): Record<string, string> {
    const parts = url.split("?");
    const params: Record<string, string> = {};

    if (parts.length === 2) {
        const queryString = parts[1];

        queryString.split("&").forEach(param => {
            const [key, value] = param.split("=");
            const match = key.match(/\[(.*?)\]/);
            if (match) {
                const paramName = match[1];
                params[paramName] = decodeURIComponent(value);
            } else {
                params[key] = decodeURIComponent(value);
            }
        });
    }

    return params;
}

export function validateRequiredParams(params: Record<string, string>, requiredParams: string[]): boolean {
    for (const param of requiredParams) {
        if (!params[param]) {
            return false;
        }
    }
    return true;
}