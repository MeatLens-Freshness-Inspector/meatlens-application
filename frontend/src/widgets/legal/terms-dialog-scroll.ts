export function isTermsScrollAtBottom(
  scrollContainer: Pick<HTMLDivElement, "scrollTop" | "clientHeight" | "scrollHeight">,
): boolean {
  return (
    scrollContainer.scrollHeight > 0 &&
    scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1
  );
}
