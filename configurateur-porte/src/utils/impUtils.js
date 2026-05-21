export function calcImpW(imp, elements, hasOuvrant) {
  return elements
    .filter((e) => imp.coveredIds.includes(e.id))
    .reduce(
      (sum, e) => sum + (e.type === "ouvrant" && !hasOuvrant ? 0 : e.w),
      0,
    );
}
