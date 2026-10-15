import { HistoryHeader, InspectionTimelineSection } from "@/widgets/history";
import { InspectionDetailSheet } from "@/widgets/inspection-history/ui/inspection-detail-sheet";
import { useHistory } from "@/widgets/history/model/use-history";

const HistoryPage = () => {
  const {
    isLoading,
    activeFilter,
    searchText,
    selectedInspection,
    totalInspections,
    filteredInspections,
    pagedInspections,
    totalPages,
    safePage,
    setCurrentPage,
    updateSearchText,
    updateActiveFilter,
    selectInspection,
    setSelectedInspection,
  } = useHistory();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))] pb-24">
      <div className="mx-auto w-full max-w-6xl min-w-0 px-4 pt-4">
        <HistoryHeader
          totalInspections={totalInspections}
        />

        <div className="mt-4 min-w-0 space-y-4">
          <InspectionTimelineSection
            activeFilter={activeFilter}
            filteredCount={filteredInspections.length}
            isLoading={isLoading}
            pagedInspections={pagedInspections}
            safePage={safePage}
            searchText={searchText}
            totalPages={totalPages}
            onActiveFilterChange={updateActiveFilter}
            onInspectionSelect={selectInspection}
            onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onSearchTextChange={updateSearchText}
          />
        </div>
      </div>

      <InspectionDetailSheet
        inspection={selectedInspection}
        open={selectedInspection !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInspection(null);
          }
        }}
      />
    </div>
  );
};

export default HistoryPage;
