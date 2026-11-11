const PAGE = 1000; // Supabase's default max rows per request.

// Runs a query page by page until every row is read.
export async function selectAll(makeQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await makeQuery().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}
