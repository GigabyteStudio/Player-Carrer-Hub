function formatDate(date) {
    if (!date) return '-';

    const [year, month, day] = String(date).split('-');

    if (!year || !month || !day) return '-';

    return `${day}/${month}/${year}`;
}

module.exports = formatDate;