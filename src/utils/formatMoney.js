function formatMoney(value) {
    if (value === null || value === undefined || value === '') return '-';

    const number = Number(value);

    if (Number.isNaN(number)) return '-';

    if (number >= 1000000) {
        const millions = number / 1000000;
        return `€ ${millions.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} mi`;
    }

    if (number >= 1000) {
        const thousands = number / 1000;
        return `€ ${thousands.toLocaleString('pt-BR', {
            maximumFractionDigits: 0
        })} mil`;
    }

    return `€ ${number.toLocaleString('pt-BR')}`;
}

module.exports = formatMoney;