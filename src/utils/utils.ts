export function fromTinybarToHbar(valueInTinyBar: number): number {
    return valueInTinyBar / 10 ** 8;
}

export function fromBaseToDisplayUnit(
    rawBalance: number,
    decimals: number
): number {
    return rawBalance / 10 ** decimals;
}

export function fromDisplayToBaseUnit(
    displayBalance: number,
    decimals: number
): number {
    return displayBalance * 10 ** decimals;
}
