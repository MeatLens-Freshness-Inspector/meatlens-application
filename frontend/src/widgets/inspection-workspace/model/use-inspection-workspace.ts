import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/entities/user";
import {
  buildInspectionInsert,
  uploadClient,
  useSubmitInspection,
} from "@/features/inspection-submission";
import { useInspectionDispute } from "@/features/inspection-disputes/model/use-inspection-dispute";
import { useImmediateAnalysis } from "./use-immediate-analysis";
import { queueDocumentationPhoto, removeScan } from "@/features/offline-sync";
import { documentationPhotoClient } from "@/entities/documentation-photo";
import {
  clearDeveloperOptionsSession,
  DEFAULT_DEVELOPER_OPTIONS_FLAGS,
  developerOptionsClient,
  getDeveloperOptionsFlags,
  getDeveloperOptionsSession,
  isDeveloperOptionsSessionExpired,
  saveDeveloperAnalysisSnapshot,
  type DeveloperOptionsFlags,
} from "@/features/developer-tools";
import { getConfidenceTextClass } from "@/shared/lib/confidence-level";
import {
  EXPIRED_CERTIFICATE_REASON,
  PROTOCOL_SPOILED_REASON,
  buildProtocolSpoiledAnalysisResult,
  createEmptyPreScanForm,
  getInspectionDecisionSource,
  getProtocolSpoiledReason,
  hasProtocolFailure,
  isPreScanChecklistComplete as isPreScanChecklistCompleteHelper,
  isCertificateExpired,
  type InspectionPreScanForm,
} from "@/entities/inspection";
import {
  analyzeOffline,
  getMockOfflineAnalysisResult,
  hasMockOfflineAnalysisResult,
  isModelReady as getAnalysisReady,
  loadActiveAnalysisModel,
  setActiveAnalysisModel,
} from "@/features/offline-analysis";
import {
  formatInspectionLocationLabel,
  getCoordinateStatusText,
  requestCurrentCoordinates,
  type CoordinateCaptureStatus,
  type InspectionCoordinates,
} from "@/entities/inspection";
import type { AnalysisResult, InspectionDecisionSource } from "@/entities/inspection";
import type { CapturedImagePayload } from "@/features/inspection-capture";
import type {
  InspectPageViewModel,
  InspectionCaptureMode,
  InspectionSaveStatus,
} from "./types";
import { useInspectionAnalysis } from "./use-inspection-analysis";
import { resolveInspectionModelSelection } from "./analysis-model-selection";
import { persistPendingScan as persistPendingScanPayload } from "./pending-scan";
import { resolveInspectionSegmentationDisabled } from "./segmentation-selection";
import {
  createClientSubmissionId,
  DEFAULT_MEAT_TYPE,
  FORCE_RETAKE_CONFIDENCE_THRESHOLD,
  getDocumentationPhotoStallNumber,
  getCaptureStatusText,
  getConfidenceText,
  getSaveButtonLabel,
} from "./inspect-page";
import { useInspectionLocation } from "./use-inspection-location";
import {
  resolveInspectionLocationState,
  type InspectionLocationResolution,
} from "./inspection-location-resolution";

// Inspection workflow: pre-scan/capture -> local inference -> online save or offline queue.
export function useInspectionWorkspace(): InspectPageViewModel {
  const { user, profile, isAdmin, isDeveloper } = useAuth();
  const [capturedInput, setCapturedInput] = useState<CapturedImagePayload | null>(null);
  const [captureMode, setCaptureMode] = useState<InspectionCaptureMode>("analyze");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preScanForm, setPreScanForm] = useState<InspectionPreScanForm>(() =>
    createEmptyPreScanForm(),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImmediateAnalysisPending, setIsImmediateAnalysisPending] = useState(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(() => !navigator.onLine || getAnalysisReady());
  const [saveStatus, setSaveStatus] = useState<InspectionSaveStatus>("idle");
  const [clientSubmissionId, setClientSubmissionId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<InspectionCoordinates | null>(null);
  const [coordinateStatus, setCoordinateStatus] = useState<CoordinateCaptureStatus>("idle");
  const [locationResolution, setLocationResolution] = useState<InspectionLocationResolution>("pending");
  const [locationDistanceMeters, setLocationDistanceMeters] = useState<number | null>(null);
  const [inspectionDecisionSource, setInspectionDecisionSource] =
    useState<InspectionDecisionSource | null>(null);
  const [captureResetKey, setCaptureResetKey] = useState(0);
  const [developerFlags, setDeveloperFlags] = useState<DeveloperOptionsFlags>(DEFAULT_DEVELOPER_OPTIONS_FLAGS);
  const [isDeveloperUnlocked, setIsDeveloperUnlocked] = useState(false);
  const saveLockRef = useRef(false);
  const autoSaveAttemptedRef = useRef(false);
  const coordinateRequestIdRef = useRef(0);
  const queuedAtRef = useRef<string | null>(null);
  const createInspection = useSubmitInspection();
  const { savedInspectionId, isSubmitDisputePending, isDisputeSubmitted, setSavedInspectionId, reset: resetDispute, onSubmit: handleSubmitDispute } = useInspectionDispute();
  const {
    isOnline,
    marketLocations,
    marketLocationRecords,
    selectedLocation,
    handleSelectedLocationChange,
    setResolvedLocation,
  } = useInspectionLocation(user?.id ?? null);

  const applyLocationResolution = useCallback((nextCoordinates: InspectionCoordinates | null) => {
    const resolution = resolveInspectionLocationState({
      coordinates: nextCoordinates,
      marketLocations: marketLocationRecords,
      selectedLocation,
      isOnline,
    });
    setResolvedLocation(resolution.selectedLocation);
    setLocationResolution(resolution.locationResolution);
    setLocationDistanceMeters(resolution.locationDistanceMeters);
  }, [isOnline, marketLocationRecords, selectedLocation, setResolvedLocation]);

  const handleManualLocationChange = useCallback((value: string) => {
    setLocationResolution("manual");
    setLocationDistanceMeters(null);
    handleSelectedLocationChange(value);
  }, [handleSelectedLocationChange]);

  useEffect(() => {
    if (!user || !isDeveloper) {
      setDeveloperFlags(DEFAULT_DEVELOPER_OPTIONS_FLAGS);
      setIsDeveloperUnlocked(false);
      return;
    }

    const flags = getDeveloperOptionsFlags(user.id);
    setDeveloperFlags(flags);

    const session = getDeveloperOptionsSession(user.id);
    if (!session || isDeveloperOptionsSessionExpired(session)) {
      if (session) {
        clearDeveloperOptionsSession(user.id);
      }
      setIsDeveloperUnlocked(false);
      return;
    }

    setIsDeveloperUnlocked(true);

    if (!navigator.onLine) {
      return;
    }

    void developerOptionsClient.verify(session.token).then((valid) => {
      if (valid) return;
      clearDeveloperOptionsSession(user.id);
      setIsDeveloperUnlocked(false);
    }).catch(() => {
      // Keep local unlocked session while offline verification is unavailable.
    });
  }, [isDeveloper, user]);

  const selectedAnalysisModel = resolveInspectionModelSelection(
    user ? { id: user.id } : null,
    isAdmin,
    isDeveloper,
    isDeveloperUnlocked,
    developerFlags.selectedModel,
  );

  useEffect(() => {
    setActiveAnalysisModel(selectedAnalysisModel);
    let isCancelled = false;
    let retryTimerId: number | null = null;

    const updateReadiness = (ready: boolean) => {
      if (isCancelled) return;
      setIsModelReady(!navigator.onLine || ready);
    };

    const warmup = async () => {
      if (!navigator.onLine) {
        updateReadiness(true);
        return;
      }

      if (getAnalysisReady()) {
        updateReadiness(true);
        return;
      }

      updateReadiness(false);
      const loaded = await loadActiveAnalysisModel({ forceRetry: true });
      if (isCancelled) return;

      if (loaded || getAnalysisReady()) {
        updateReadiness(true);
        return;
      }

      retryTimerId = window.setTimeout(() => {
        void warmup();
      }, 1500);
    };

    const handleOnline = () => {
      void warmup();
    };

    const handleOffline = () => {
      updateReadiness(true);
    };

    void warmup();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isCancelled = true;
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedAnalysisModel]);

  const isPreScanBypassed = Boolean(
    user &&
    isAdmin &&
    isDeveloperUnlocked &&
    developerFlags.bypassPreScanChecklist,
  );
  const isPreScanChecklistComplete = isPreScanBypassed
    ? true
    : isPreScanChecklistCompleteHelper(preScanForm);
  const disableRoiSegmentation = resolveInspectionSegmentationDisabled(
    isDeveloper,
    isDeveloperUnlocked,
    developerFlags.disableRoiSegmentation,
  );

  const persistPendingScan = useCallback(
    async (
      submissionId: string,
      capture: CapturedImagePayload,
      queuedAt: string,
      analysisResult?: AnalysisResult,
      nextCoordinates?: InspectionCoordinates | null,
    ) => {
      if (!user) {
        return;
      }

      await persistPendingScanPayload({
        submissionId,
        capture,
        queuedAt,
        userId: user.id,
        selectedLocation,
        inspectionDecisionSource,
        isPreScanBypassed,
        preScanForm,
        analysisResult,
        nextCoordinates,
      });
    },
    [
      inspectionDecisionSource,
      isPreScanBypassed,
      preScanForm,
      selectedLocation,
      user,
    ],
  );

  const persistPendingDocumentationPhoto = useCallback(
    async (submissionId: string, capture: CapturedImagePayload, queuedAt: string) => {
      if (!user) return;

      await queueDocumentationPhoto({
        id: submissionId,
        imageData: await capture.file.arrayBuffer(),
        imageType: capture.file.type,
        imageName: capture.file.name,
        location: selectedLocation.trim() || null,
        locationLatitude: coordinates?.latitude ?? null,
        locationLongitude: coordinates?.longitude ?? null,
        stallNumber: getDocumentationPhotoStallNumber(preScanForm),
        capturedAt: capture.capturedAt,
        queuedAt,
        userId: user.id,
      });
    },
    [coordinates, preScanForm, selectedLocation, user],
  );

  const handlePreScanFieldChange = useCallback(
    (field: keyof InspectionPreScanForm, value: string) => {
      setPreScanForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleCapture = useCallback((capture: CapturedImagePayload) => {
    if (saveStatus === "saving") return;
    if (captureMode === "analyze" && !isPreScanChecklistComplete) return;

    const submissionId = createClientSubmissionId();
    const requestId = coordinateRequestIdRef.current + 1;
    if (captureMode === "photo-only") {
      coordinateRequestIdRef.current = requestId;
      setCapturedInput(capture);
      setResult(null);
      setIsImmediateAnalysisPending(false);
      setSaveStatus("idle");
      resetDispute();
      saveLockRef.current = false;
      autoSaveAttemptedRef.current = false;
      setClientSubmissionId(submissionId);
      setCoordinates(null);
      setCoordinateStatus("capturing");
      setLocationResolution("pending");
      setLocationDistanceMeters(null);
      setInspectionDecisionSource(null);
      queuedAtRef.current = null;

      void requestCurrentCoordinates().then((nextCoordinates) => {
        if (coordinateRequestIdRef.current !== requestId) return;
        setCoordinates(nextCoordinates);
        setCoordinateStatus(nextCoordinates ? "captured" : "unavailable");
        applyLocationResolution(nextCoordinates);
      });
      return;
    }

    const protocolTriggered =
      isCertificateExpired(preScanForm.meatExpiryDate) ||
      (!isPreScanBypassed && hasProtocolFailure(preScanForm));
    const protocolReason =
      getProtocolSpoiledReason(preScanForm) ?? PROTOCOL_SPOILED_REASON;
    coordinateRequestIdRef.current = requestId;
    setCapturedInput(capture);
    setResult(
      protocolTriggered
        ? buildProtocolSpoiledAnalysisResult(
            isCertificateExpired(preScanForm.meatExpiryDate)
              ? EXPIRED_CERTIFICATE_REASON
              : protocolReason,
          )
        : null,
    );
    setSaveStatus("idle");
    resetDispute();
    saveLockRef.current = false;
    autoSaveAttemptedRef.current = false;
    setClientSubmissionId(submissionId);
    setCoordinates(null);
    setCoordinateStatus("capturing");
    setLocationResolution("pending");
    setLocationDistanceMeters(null);
    setInspectionDecisionSource(protocolTriggered ? "protocol_pre_scan" : null);
    queuedAtRef.current = null;
    const mockAnalysisResult = getMockOfflineAnalysisResult();
    setIsImmediateAnalysisPending(!protocolTriggered && !mockAnalysisResult);

    void requestCurrentCoordinates().then((nextCoordinates) => {
      if (coordinateRequestIdRef.current !== requestId) {
        return;
      }

      if (nextCoordinates) {
        setCoordinates(nextCoordinates);
        setCoordinateStatus("captured");
      } else {
        setCoordinates(null);
        setCoordinateStatus("unavailable");
      }
      applyLocationResolution(nextCoordinates);

      if (!protocolTriggered && mockAnalysisResult) {
        setInspectionDecisionSource("ai");
        setResult(mockAnalysisResult);
      }
    });

    if (!navigator.onLine && user) {
      void (async () => {
        try {
          const queuedAt = new Date().toISOString();
          queuedAtRef.current = queuedAt;
          await persistPendingScan(submissionId, capture, queuedAt);
          toast.info("Captured offline - image cached locally for sync.");
        } catch {
          toast.error("Failed to cache offline capture.");
        }
      })();
    }
  }, [
    isPreScanBypassed,
    isPreScanChecklistComplete,
    persistPendingScan,
    preScanForm,
    resetDispute,
    saveStatus,
    user,
    captureMode,
    applyLocationResolution,
  ]);

  useEffect(() => {
    if (!capturedInput || !clientSubmissionId || !queuedAtRef.current) {
      return;
    }

    if (coordinates == null && result == null) {
      return;
    }

    void persistPendingScan(
      clientSubmissionId,
      capturedInput,
      queuedAtRef.current,
      result ?? undefined,
      coordinates,
    );
  }, [capturedInput, clientSubmissionId, coordinates, persistPendingScan, result]);

  const handleAnalyze = useCallback(async () => {
    if (captureMode !== "analyze") return;
    if (!capturedInput?.file) return;
    if (inspectionDecisionSource === "protocol_pre_scan") return;
    if (navigator.onLine && !isModelReady && !hasMockOfflineAnalysisResult()) {
      toast.info("Preparing MobileNetV3 model. Please wait a moment.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResult: AnalysisResult = await analyzeOffline(capturedInput.file, DEFAULT_MEAT_TYPE, {
        guideBox: capturedInput.guideBox,
        disableRoiSegmentation,
      });

      if (analysisResult.confidence_score < FORCE_RETAKE_CONFIDENCE_THRESHOLD) {
        if (!navigator.onLine && clientSubmissionId) {
          try {
            await removeScan(clientSubmissionId);
            queuedAtRef.current = null;
          } catch {
            // Keep analysis flow even if local queue cleanup fails.
          }
        }

        toast.warning(
          `Confidence ${analysisResult.confidence_score}% is below ${FORCE_RETAKE_CONFIDENCE_THRESHOLD}%. Retake is strongly recommended, but you may save manually if needed.`,
        );
      } else {
        toast.success("MobileNetV3 ONNX analysis complete.");
      }

      setInspectionDecisionSource("ai");
      setResult(analysisResult);
      if (user && isAdmin && isDeveloperUnlocked && developerFlags.persistAnalysisSnapshots) {
        saveDeveloperAnalysisSnapshot(user.id, {
          capturedAt: capturedInput.capturedAt,
          source: capturedInput.source,
          meatType: DEFAULT_MEAT_TYPE,
          location: selectedLocation.trim() || null,
          result: analysisResult,
        });
      }
    } catch (error) {
      setResult(null);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Analysis failed");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    clientSubmissionId,
    capturedInput,
    disableRoiSegmentation,
    developerFlags.persistAnalysisSnapshots,
    inspectionDecisionSource,
    isAdmin,
    isDeveloperUnlocked,
    isModelReady,
    selectedLocation,
    user,
    captureMode,
  ]);

  useImmediateAnalysis(
    isImmediateAnalysisPending,
    capturedInput,
    inspectionDecisionSource,
    result,
    !navigator.onLine || isModelReady,
    handleAnalyze,
    () => setIsImmediateAnalysisPending(false),
  );

  const handleSave = useCallback(async () => {
    if (!capturedInput?.file || saveLockRef.current || saveStatus === "saved" || saveStatus === "queued") {
      return;
    }
    if (!user) {
      toast.error(captureMode === "photo-only" ? "Please sign in to save photos" : "Please sign in to save inspections");
      return;
    }
    if (!selectedLocation.trim()) {
      toast.error("Select the closest market before saving.");
      return;
    }

    const submissionId = clientSubmissionId ?? createClientSubmissionId();
    setClientSubmissionId(submissionId);

    if (captureMode === "photo-only") {
      saveLockRef.current = true;
      setSaveStatus("saving");
      try {
        if (!navigator.onLine) {
          const queuedAt = queuedAtRef.current ?? new Date().toISOString();
          queuedAtRef.current = queuedAt;
          await persistPendingDocumentationPhoto(submissionId, capturedInput, queuedAt);
          setSaveStatus("queued");
          toast.info("Photo saved on this phone. It will sync when you reconnect.");
          return;
        }

        let imageUrl: string;
        try {
          imageUrl = await uploadClient.uploadInspectionImage(capturedInput.file);
        } catch {
          const queuedAt = queuedAtRef.current ?? new Date().toISOString();
          queuedAtRef.current = queuedAt;
          await persistPendingDocumentationPhoto(submissionId, capturedInput, queuedAt);
          setSaveStatus("queued");
          toast.info("Photo saved on this phone. It will sync when the connection is ready.");
          return;
        }

        await documentationPhotoClient.create({
          client_submission_id: submissionId,
          image_url: imageUrl,
          location: selectedLocation.trim() || null,
          location_latitude: coordinates?.latitude ?? null,
          location_longitude: coordinates?.longitude ?? null,
          stall_number: getDocumentationPhotoStallNumber(preScanForm),
          captured_at: capturedInput.capturedAt,
        });
        setSaveStatus("saved");
        toast.success("Photo saved");
      } catch (error) {
        try {
          const queuedAt = queuedAtRef.current ?? new Date().toISOString();
          queuedAtRef.current = queuedAt;
          await persistPendingDocumentationPhoto(submissionId, capturedInput, queuedAt);
          setSaveStatus("queued");
          toast.info("Photo saved on this phone. It will sync when the connection is ready.");
        } catch (queueError) {
          saveLockRef.current = false;
          setSaveStatus("idle");
          console.error("Documentation photo save error:", error, queueError);
          toast.error("Could not save the photo. Please try again.");
        }
      }
      return;
    }

    if (!result) return;
    const decisionSource = inspectionDecisionSource ?? getInspectionDecisionSource(preScanForm);

    if (!navigator.onLine) {
      try {
        const queuedAt = queuedAtRef.current ?? new Date().toISOString();
        queuedAtRef.current = queuedAt;
        await persistPendingScan(submissionId, capturedInput, queuedAt, result, coordinates);
        setSaveStatus("queued");
        toast.info("You're offline - save queued. It will upload and record when you reconnect.");
      } catch {
        toast.error("Failed to queue save for offline storage.");
      }
      return;
    }

    saveLockRef.current = true;
    setSaveStatus("saving");

    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await uploadClient.uploadInspectionImage(capturedInput.file);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        try {
          const queuedAt = queuedAtRef.current ?? new Date().toISOString();
          queuedAtRef.current = queuedAt;
          await persistPendingScan(submissionId, capturedInput, queuedAt, result, coordinates);
          setSaveStatus("queued");
          toast.info("Inspection saved on this phone. It will sync with its photo when the connection is ready.");
        } catch (queueError) {
          saveLockRef.current = false;
          setSaveStatus("idle");
          console.error("Inspection image queue error:", uploadError, queueError);
          toast.error("Could not save the inspection photo. Please try again.");
        }
        return;
      }

      const createdInspection = await createInspection.mutateAsync(
        buildInspectionInsert({
          userId: user.id,
          submissionId,
          capturedAt: capturedInput.capturedAt,
          location: selectedLocation,
          coordinates,
          decisionSource,
          preScanForm,
          result,
          imageUrl,
        }),
      );
      setSavedInspectionId(createdInspection.id);
      setSaveStatus("saved");
      toast.success("Inspection saved");
    } catch (error) {
      saveLockRef.current = false;
      setSaveStatus("idle");
      console.error("Save error:", error);
      toast.error("Failed to save inspection");
    }
  }, [
    capturedInput,
    clientSubmissionId,
    coordinates,
    createInspection,
    captureMode,
    inspectionDecisionSource,
    persistPendingDocumentationPhoto,
    persistPendingScan,
    preScanForm,
    result,
    setSavedInspectionId,
    saveStatus,
    selectedLocation,
    user,
  ]);

  useEffect(() => {
    if (!result || !capturedInput?.file || !user) return;
    if (coordinateStatus === "capturing") return;
    if (saveStatus !== "idle") return;
    if (saveLockRef.current || autoSaveAttemptedRef.current) return;

    const shouldAutoSave =
      inspectionDecisionSource === "protocol_pre_scan" ||
      result.confidence_score >= FORCE_RETAKE_CONFIDENCE_THRESHOLD;
    if (!shouldAutoSave) return;

    autoSaveAttemptedRef.current = true;
    void handleSave();
  }, [
    capturedInput,
    coordinateStatus,
    handleSave,
    inspectionDecisionSource,
    result,
    saveStatus,
    user,
  ]);

  const handleReset = useCallback(() => {
    coordinateRequestIdRef.current += 1;
    setCaptureResetKey((current) => current + 1);
    setCapturedInput(null);
    setCaptureMode("analyze");
    setResult(null);
    setIsImmediateAnalysisPending(false);
    setPreScanForm(createEmptyPreScanForm());
    setCoordinates(null);
    setCoordinateStatus("idle");
    setLocationResolution("pending");
    setLocationDistanceMeters(null);
    setInspectionDecisionSource(null);
    setSaveStatus("idle");
    resetDispute();
    saveLockRef.current = false;
    autoSaveAttemptedRef.current = false;
    setClientSubmissionId(null);
    queuedAtRef.current = null;
  }, [resetDispute]);

  const handleCaptureModeChange = useCallback((mode: InspectionCaptureMode) => {
    if (capturedInput || saveStatus === "saving") return;
    setCaptureMode(mode);
  }, [capturedInput, saveStatus]);

  const isDebugFileUploadEnabled = Boolean(
    user &&
    isAdmin &&
    isDeveloperUnlocked &&
    developerFlags.enableDebugFileUpload,
  );
  const isInAppCameraEnabled = Boolean(
    user &&
    isAdmin &&
    isDeveloperUnlocked,
  );
  const confidenceSummaryClass = result ? getConfidenceTextClass(result.confidence_score) : "";
  const analysisState = useInspectionAnalysis({
    isModelReady,
    isAnalyzing,
    result,
    inspectionDecisionSource,
    online: navigator.onLine,
  });
  const isAnalyzeBlockedByModel = analysisState.isAnalyzeBlockedByModel;
  const locationDisplayLabel =
    formatInspectionLocationLabel(
      selectedLocation,
      coordinates?.latitude ?? null,
      coordinates?.longitude ?? null,
    ) || selectedLocation;
  const coordinateStatusText =
    coordinateStatus === "captured"
      ? null
      : getCoordinateStatusText(coordinateStatus, coordinates);

  return {
    capturedInput,
    captureMode,
    result,
    preScanForm,
    marketLocations,
    marketLocationRecords,
    selectedLocation,
    locationDisplayLabel,
    locationResolution,
    locationDistanceMeters,
    isOnline,
    coordinateStatusText,
    inspectionDecisionSource,
    isAnalyzing,
    isAnalysisPending: isImmediateAnalysisPending || isAnalyzing,
    isCaptureCommitted: Boolean(capturedInput),
    isAnalyzeBlockedByModel,
    isCaptureDisabled:
      saveStatus === "saving" ||
      createInspection.isPending ||
      isImmediateAnalysisPending ||
      isAnalyzing ||
      (captureMode === "analyze" && !isPreScanChecklistComplete),
    isCreateInspectionPending: createInspection.isPending,
    isDebugFileUploadEnabled,
    isInAppCameraEnabled,
    isPreScanBypassed,
    isPreScanChecklistComplete,
    isLocationSelectionDisabled:
      saveStatus === "saving"
      || createInspection.isPending
      || marketLocations.length === 0
      || (isOnline && !capturedInput && locationResolution !== "manual")
      || locationResolution === "automatic",
    isPhotoOnlyMode: captureMode === "photo-only",
    saveStatus,
    savedInspectionId,
    isSubmitDisputePending,
    isDisputeSubmitted,
    showDetailedResults: Boolean(profile?.show_detailed_results),
    showModelInputPreview: developerFlags.showModelInputPreview,
    disableRoiSegmentation,
    captureResetKey,
    showSaveActions: Boolean(result) || (captureMode === "photo-only" && Boolean(capturedInput)),
    captureStatusText: getCaptureStatusText(capturedInput),
    analysisStatusText: analysisState.analysisStatusText,
    confidenceText: getConfidenceText(result),
    confidenceSummaryClass,
    saveButtonLabel: captureMode === "photo-only"
      ? saveStatus === "queued" ? "Saved on phone" : "Save photo"
      : getSaveButtonLabel(saveStatus),
    resetButtonLabel: captureMode === "photo-only" ? "New photo" : "New scan",
    onCaptureModeChange: handleCaptureModeChange,
    onPreScanFieldChange: handlePreScanFieldChange,
    onSelectedLocationChange: handleManualLocationChange,
    onCapture: handleCapture,
    onReset: handleReset,
    onSave: handleSave,
    onSubmitDispute: handleSubmitDispute,
  };
}
