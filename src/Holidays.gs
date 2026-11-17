/** Admin: list holidays for a year. */
function getHolidays(year) {
  requireAdmin();
  const y = Number(year);
  return readTable(TAB.HOL)
    .map(h => ({
      date: toYmd(h.Date),
      name: h.Name || '',
      type: h.Type || '',
      hours: Number(h.Hours) || 8
    }))
    .filter(h => h.date && Number(h.date.slice(0, 4)) === y)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Admin: add one holiday. Counts as leave for every employee. */
function addHoliday(dateStr, name, type, hours) {
  requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Pick a valid date.');
  const wd = new Date(dateStr + 'T00:00:00').getDay();
  if (wd === 5 || wd === 6) throw new Error('Friday and Saturday are already weekends. Pick a working day.');
  if (!String(name || '').trim()) throw new Error('Enter a holiday name.');
  if (['Public', 'Government'].indexOf(type) < 0) throw new Error('Type must be Public or Government.');
  const h = Number(hours) || 8;
  if (!(h > 0 && h <= 8)) throw new Error('Holiday hours must be between 0.25 and 8.');

  return withLock_(function () {
    const exists = readTable(TAB.HOL).some(x => toYmd(x.Date) === dateStr);
    if (exists) throw new Error('A holiday is already set for ' + dateStr + '.');
    const sh = ss().getSheetByName(TAB.HOL);
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1).setNumberFormat('@');
    sh.getRange(r, 1, 1, 4).setValues([[dateStr, String(name).trim(), type, h]]);
    notifyHoliday_(dateStr, String(name).trim(), type);
    return { added: dateStr };
  });
}

/** Admin: remove one holiday. */
function deleteHoliday(dateStr) {
  requireAdmin();
  return withLock_(function () {
    const sh = ss().getSheetByName(TAB.HOL);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (toYmd(values[r][0]) === dateStr) {
        sh.deleteRow(r + 1);
        return { deleted: dateStr };
      }
    }
    throw new Error('Holiday not found.');
  });
}
