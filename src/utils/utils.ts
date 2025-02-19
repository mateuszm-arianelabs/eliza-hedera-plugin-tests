export function fromTinybarToHbar(valueInTinyBar: number): number {
    return valueInTinyBar / 10 ** 8;
}

export function formBaseToDisplayUnit(
    rawBalance: number,
    decimals: number
): number {
    return rawBalance / 10 ** decimals;
}
