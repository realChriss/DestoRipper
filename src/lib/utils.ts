export function genId(length: number = 5): string {
    return Math.random().toString(36).substring(2, length+2);
}