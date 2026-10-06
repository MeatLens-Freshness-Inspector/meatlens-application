import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { ReportOrganization } from "@/entities/user/api";
import {
  getErrorMessage,
  validateSignupState,
} from "./signup";

export interface SignupWorkflowDependencies {
  signUp: (
    email: string,
    password: string,
    fullName: string,
    accessCode: string,
    reportOrganization: ReportOrganization,
  ) => Promise<void>;
  isReportOrganization: (value: unknown) => value is ReportOrganization;
}

export function useSignupPage({ signUp, isReportOrganization }: SignupWorkflowDependencies) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [reportOrganization, setReportOrganization] = useState<
    ReportOrganization | ""
  >("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsReadToEnd, setTermsReadToEnd] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyReadToEnd, setPrivacyReadToEnd] = useState(false);
  const [formError, setFormError] = useState("");
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateSignupState({
      acceptedPrivacy,
      acceptedTerms,
      termsReadToEnd,
      privacyReadToEnd,
      accessCode,
      reportOrganization,
    }, isReportOrganization);

    if (validationError) {
      setFormError(validationError);
      toast.error(validationError);
      return;
    }

    if (!isReportOrganization(reportOrganization)) {
      setFormError("Please select the report header organization before creating an account.");
      return;
    }

    setFormError("");
    setLoading(true);

    try {
      await signUp(
        email,
        password,
        fullName,
        accessCode.trim(),
        reportOrganization,
      );
      toast.success("Account created! Check your email to verify.");
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Sign up failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptedTermsChange = (checked: boolean) => {
    if (checked && !termsReadToEnd) {
      setAcceptedTerms(false);
      setFormError("Please open and read the Terms and Conditions through the end before accepting them.");
      return;
    }

    setAcceptedTerms(checked);
    if (checked) {
      setFormError("");
    }
  };

  const handleTermsReadToEnd = () => {
    setTermsReadToEnd(true);
  };

  const handleAcceptedPrivacyChange = (checked: boolean) => {
    if (checked && !privacyReadToEnd) {
      setAcceptedPrivacy(false);
      setFormError("Please open and read the Privacy Policy through the end before accepting it.");
      return;
    }

    setAcceptedPrivacy(checked);
    if (checked) {
      setFormError("");
    }
  };

  const handlePrivacyReadToEnd = () => {
    setPrivacyReadToEnd(true);
  };

  return {
    fullName,
    email,
    password,
    accessCode,
    reportOrganization,
    acceptedTerms,
    termsReadToEnd,
    acceptedPrivacy,
    privacyReadToEnd,
    formError,
    showTermsDialog,
    showPrivacyDialog,
    loading,
    setFullName,
    setEmail,
    setPassword,
    setAccessCode,
    setReportOrganization,
    setShowTermsDialog,
    setShowPrivacyDialog,
    handleSubmit,
    handleAcceptedTermsChange,
    handleTermsReadToEnd,
    handleAcceptedPrivacyChange,
    handlePrivacyReadToEnd,
  };
}
