export const PAGE_SIZE = 40;

export function pageBounds(total: number, requested: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(pages, Math.max(1, requested));
  return { page, pages, start: (page - 1) * size, end: Math.min(total, page * size) };
}

