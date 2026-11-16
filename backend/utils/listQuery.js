export function getListOptions(query, allowedSortFields, defaultSort = '-createdAt') {
  const page = parsePositiveInteger(query.page, 1, 'page');
  const limit = parsePositiveInteger(query.limit, 10, 'limit');

  if (page.error) {
    return { error: page.error };
  }

  if (limit.error) {
    return { error: limit.error };
  }

  if (limit.value > 100) {
    return { error: 'Limit cannot be greater than 100.' };
  }

  const sortValue = query.sort === undefined ? defaultSort : query.sort;

  if (typeof sortValue !== 'string') {
    return { error: 'Sort must be a single field name.' };
  }

  const isDescending = sortValue.startsWith('-');
  const sortField = isDescending ? sortValue.slice(1) : sortValue;

  if (!allowedSortFields.includes(sortField)) {
    return { error: `Sort must be one of: ${allowedSortFields.join(', ')}.` };
  }

  let direction = isDescending ? -1 : 1;
  if (query.order !== undefined) {
    if (query.order !== 'asc' && query.order !== 'desc') {
      return { error: 'Order must be either asc or desc.' };
    }

    direction = query.order === 'desc' ? -1 : 1;
  }

  const skip = (page.value - 1) * limit.value;
  if (!Number.isSafeInteger(skip)) {
    return { error: 'Requested page is outside the supported range.' };
  }

  return {
    page: page.value,
    limit: limit.value,
    skip,
    sort: { [sortField]: direction }
  };
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInteger(value, defaultValue, fieldName) {
  if (value === undefined) {
    return { value: defaultValue };
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return { error: `${fieldName} must be a positive whole number.` };
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue)) {
    return { error: `${fieldName} is outside the supported range.` };
  }

  return { value: parsedValue };
}
