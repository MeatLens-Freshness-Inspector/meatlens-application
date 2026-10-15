import type { ReportOrganization } from "@/features/reports/model/types";
import type { FreshnessClassification, Inspection } from "@/entities/inspection";
import type { ModelAccuracySnapshot } from "@/entities/model-accuracy";

export type FilterOption = "all" | FreshnessClassification;

export type HistoryFilterOption = {
  key: FilterOption;
  label: string;
};

export type HistoryMonthlyCount = {
  label: string;
  count: number;
};

export type DetailedHistoryReportInput = {
  averageConfidence: number;
  generatedAt: string;
  inspections: Inspection[];
  selectedReportDay: string;
  reportOrganization: ReportOrganization | null | undefined;
  modelAccuracyHistory?: ModelAccuracySnapshot[];
};

export type HistoryExportScopeInput = {
  allInspections: Inspection[];
  selectedDayInspections: Inspection[];
  selectedReportDay: string;
  formattedReportDayLabel: string | null;
  averageConfidence: number;
  selectedDayAverageConfidence: number;
};

export type HistoryExportScope = {
  hasSelectedDay: boolean;
  inspections: Inspection[];
  reportDayLabel: string;
  filenameScope: string;
  scopeLabel: string;
  averageConfidence: number;
};
