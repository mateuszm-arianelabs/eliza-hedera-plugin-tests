export function fromTinybarToHbar(valueInTinyBar: number): number {
    return valueInTinyBar / 10 ** 8;
}

export function formBaseToDisplayUnit(
    rawBalance: number,
    decimals: number
): number {
    return rawBalance / 10 ** decimals;
}

export function formDisplayToBaseUnit(
    displayBalance: number,
    decimals: number
): number {
    return displayBalance * 10 ** decimals;
}
