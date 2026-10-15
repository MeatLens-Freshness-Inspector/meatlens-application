export type TutorialId = "safety" | "profile" | "inspect" | "history" | "messages";

export interface TutorialBlockDefinition {
  id: string;
  title: string;
  description: string;
  tone?: "neutral" | "accent" | "warning";
  hotspotLabel?: string;
}

export interface TutorialStepDefinition {
  id: string;
  tutorialId: TutorialId;
  sectionTitle: string;
  stepTitle: string;
  instruction: string;
  sceneTitle: string;
  sceneSubtitle: string;
  hotspotLabel: string;
  blocks: TutorialBlockDefinition[];
}

export const tutorialDefinitions: Record<TutorialId, TutorialStepDefinition[]> = {
  safety: [
    {
      id: "safety-acknowledge",
      tutorialId: "safety",
      sectionTitle: "Safety acknowledgement",
      stepTitle: "Read the reminder before you inspect",
      instruction:
        "Tap the highlighted acknowledgement to confirm that MeatLens supports, but does not replace, your official field judgment.",
      sceneTitle: "Inspection Reminder",
      sceneSubtitle: "Before you inspect",
      hotspotLabel: "I understand the reminder",
      blocks: [
        {
          id: "safety-warning",
          title: "Official protocol still applies",
          description:
            "Use MeatLens as decision support only and keep final decisions aligned with your LGU or institutional procedure.",
          tone: "warning",
        },
        {
          id: "safety-acknowledge",
          title: "Acknowledge the reminder",
          description: "Confirm the safety reminder to continue into the tutorial.",
          tone: "accent",
          hotspotLabel: "I understand the reminder",
        },
      ],
    },
  ],
  profile: [
    {
      id: "profile-account-details",
      tutorialId: "profile",
      sectionTitle: "Profile walkthrough",
      stepTitle: "Find your account details",
      instruction:
        "This is a simulated profile page. Tap the highlighted account summary to learn where your name and email live.",
      sceneTitle: "My Profile",
      sceneSubtitle: "Inspector account center",
      hotspotLabel: "Show my account details",
      blocks: [
        {
          id: "profile-summary",
          title: "Account details",
          description: "Review your display name and account email here.",
          tone: "accent",
          hotspotLabel: "Show my account details",
        },
        {
          id: "profile-access-code",
          title: "Inspector code",
          description: "Your assigned access code stays visible in Profile.",
        },
        {
          id: "profile-help",
          title: "Help tutorials",
          description: "Replay guided demos later from here.",
        },
      ],
    },
    {
      id: "profile-access-code",
      tutorialId: "profile",
      sectionTitle: "Profile walkthrough",
      stepTitle: "Find your access code",
      instruction:
        "Tap the highlighted access-code area to learn where your assigned inspector code is shown.",
      sceneTitle: "My Profile",
      sceneSubtitle: "Inspector account center",
      hotspotLabel: "Show my access code",
      blocks: [
        {
          id: "profile-summary",
          title: "Account details",
          description: "Review your display name and account email here.",
        },
        {
          id: "profile-access-code",
          title: "Inspector code",
          description: "Your assigned access code stays visible in Profile.",
          tone: "accent",
          hotspotLabel: "Show my access code",
        },
        {
          id: "profile-help",
          title: "Help tutorials",
          description: "Replay guided demos later from here.",
        },
      ],
    },
    {
      id: "profile-help",
      tutorialId: "profile",
      sectionTitle: "Profile walkthrough",
      stepTitle: "Find help later",
      instruction:
        "Tap the highlighted help area to learn where you can reopen these guided demos after onboarding.",
      sceneTitle: "My Profile",
      sceneSubtitle: "Inspector account center",
      hotspotLabel: "Open help from profile",
      blocks: [
        {
          id: "profile-summary",
          title: "Account details",
          description: "Review your display name and account email here.",
        },
        {
          id: "profile-access-code",
          title: "Inspector code",
          description: "Your assigned access code stays visible in Profile.",
        },
        {
          id: "profile-help",
          title: "Help tutorials",
          description: "Replay guided demos later from here.",
          tone: "accent",
          hotspotLabel: "Open help from profile",
        },
      ],
    },
  ],
  inspect: [
    {
      id: "inspect-mode",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Choose what you want to do",
      instruction:
        "Choose Analyze sample to check freshness, or Take photo only to document a stall without a result. Take photo only also works offline and syncs later.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Choose a simple camera task",
      hotspotLabel: "Choose a camera task",
      blocks: [
        {
          id: "inspect-mode",
          title: "Choose a camera task",
          description: "Analyze sample checks freshness. Take photo only saves a stall photo without analysis.",
          tone: "accent",
          hotspotLabel: "Choose a camera task",
        },
        {
          id: "inspect-market",
          title: "Market selector",
          description: "The selected market is saved with the photo or inspection.",
        },
      ],
    },
    {
      id: "inspect-scope",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Confirm the inspection scope",
      instruction:
        "Read the scope reminder before capture. The app supports field decisions, while official inspection protocol remains authoritative.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Decision support for field work",
      hotspotLabel: "Review inspection scope",
      blocks: [
        {
          id: "inspect-scope",
          title: "Decision support only",
          description: "Keep official LGU or institutional procedure as the final authority.",
          tone: "warning",
          hotspotLabel: "Review inspection scope",
        },
        {
          id: "inspect-market",
          title: "Market selector",
          description: "Set the active inspection location before capture.",
        },
        {
          id: "inspect-prescan",
          title: "Pre-scan safety protocol",
          description: "Complete the required checklist before opening the camera.",
        },
      ],
    },
    {
      id: "inspect-market",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Choose the active market",
      instruction:
        "Tap the highlighted market selector first. Inspect always starts by confirming the active location.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Field capture workflow",
      hotspotLabel: "Choose market",
      blocks: [
        {
          id: "inspect-market",
          title: "Market selector",
          description: "Set the active inspection location before capture.",
          tone: "accent",
          hotspotLabel: "Choose market",
        },
        {
          id: "inspect-capture",
          title: "Capture sample",
          description: "Open the guided camera flow to frame the meat sample.",
        },
        {
          id: "inspect-save",
          title: "Save result",
          description: "Store the finished inspection record after review.",
        },
      ],
    },
    {
      id: "inspect-prescan",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Complete the pre-scan safety protocol",
      instruction:
        "Review the required pre-scan fields before opening the camera. A failed safety answer records a protocol result instead of running AI.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Pre-scan safety protocol",
      hotspotLabel: "Review pre-scan protocol",
      blocks: [
        {
          id: "inspect-prescan",
          title: "Pre-scan safety protocol",
          description: "Complete the required checklist before opening the camera.",
          tone: "accent",
          hotspotLabel: "Review pre-scan protocol",
        },
        {
          id: "inspect-capture",
          title: "Capture sample",
          description: "Open the guided camera flow after the checklist is complete.",
        },
      ],
    },
    {
      id: "inspect-capture",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Capture and start analysis",
      instruction:
        "Tap the highlighted capture action. After you accept the photo, MeatLens starts analysis automatically—there is no second analysis button.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Field capture workflow",
      hotspotLabel: "Capture sample",
      blocks: [
        {
          id: "inspect-market",
          title: "Market selector",
          description: "Set the active inspection location before capture.",
        },
        {
          id: "inspect-capture",
          title: "Capture sample",
          description: "Frame the meat sample and accept the photo. Analysis starts automatically after capture.",
          tone: "accent",
          hotspotLabel: "Capture sample",
        },
        {
          id: "inspect-save",
          title: "Save result",
          description: "Store the finished inspection record after reviewing the result.",
        },
      ],
    },
    {
      id: "inspect-save",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Save the result",
      instruction:
        "Review the freshness result, then tap Save Record to keep the inspection. You can dispute the result after it is saved.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Review and save result",
      hotspotLabel: "Save Record",
      blocks: [
        {
          id: "inspect-capture",
          title: "Captured sample",
          description: "The accepted photo has already been analyzed automatically.",
        },
        {
          id: "inspect-result",
          title: "Review result",
          description: "Check the classification, confidence, and explanation before saving.",
        },
        {
          id: "inspect-save",
          title: "Save result",
          description: "Store the finished inspection record before opening a dispute.",
          tone: "accent",
          hotspotLabel: "Save Record",
        },
        {
          id: "inspect-dispute",
          title: "Dispute result",
          description: "This action becomes available after the inspection is saved.",
        },
      ],
    },
    {
      id: "inspect-dispute",
      tutorialId: "inspect",
      sectionTitle: "Inspect demo",
      stepTitle: "Dispute a saved result",
      instruction:
        "After saving, use Dispute result if the classification does not match your field evidence. An administrator or developer will review it.",
      sceneTitle: "Inspect",
      sceneSubtitle: "Saved result review",
      hotspotLabel: "Dispute result",
      blocks: [
        {
          id: "inspect-saved-result",
          title: "Saved inspection",
          description: "The result is now stored in your inspection history.",
        },
        {
          id: "inspect-dispute",
          title: "Dispute result",
          description: "Explain the evidence when the result does not match your field judgment.",
          tone: "accent",
          hotspotLabel: "Dispute result",
        },
      ],
    },
  ],
  history: [
    {
      id: "history-open-record",
      tutorialId: "history",
      sectionTitle: "History demo",
      stepTitle: "Find a saved inspection",
      instruction:
        "Use the search if needed, then tap Open record to review a saved inspection. Report tools stay visible below the list: without a date, export all saved inspections.",
      sceneTitle: "History",
      sceneSubtitle: "Saved inspections",
      hotspotLabel: "Open record",
      blocks: [
        {
          id: "history-record",
          title: "Saved inspection",
          description: "Find a saved record by meat or place.",
          tone: "accent",
          hotspotLabel: "Open record",
        },
        {
          id: "history-confidence",
          title: "Simple search",
          description: "Search by meat or place when you need to find a record.",
        },
        {
          id: "history-back",
          title: "Result filter",
          description: "Use Show results only when you need a freshness status filter.",
        },
        {
          id: "history-report",
          title: "Export a report",
          description: "Without a date, export all saved inspections. Choose a date when you only need one day.",
        },
        {
          id: "history-totals",
          title: "Inspection totals",
          description: "Review the saved-inspection totals below the report controls.",
        },
      ],
    },
    {
      id: "history-review-details",
      tutorialId: "history",
      sectionTitle: "History demo",
      stepTitle: "Review the saved result",
      instruction:
        "Review the Result and Confidence, then use Dispute result if the saved result does not match your field evidence.",
      sceneTitle: "Inspection details",
      sceneSubtitle: "Saved result review",
      hotspotLabel: "Review saved result",
      blocks: [
        {
          id: "history-record",
          title: "Result",
          description: "Fresh",
        },
        {
          id: "history-confidence",
          title: "Confidence",
          description: "Review the saved confidence and explanation here.",
          tone: "accent",
          hotspotLabel: "Review saved result",
        },
        {
          id: "history-back",
          title: "Dispute result",
          description: "Ask for a review when your field evidence disagrees with the saved result.",
        },
      ],
    },
    {
      id: "history-back-to-list",
      tutorialId: "history",
      sectionTitle: "History demo",
      stepTitle: "Return to saved inspections",
      instruction:
        "Tap Back to return to the saved-inspection list and finish the History walkthrough.",
      sceneTitle: "Inspection details",
      sceneSubtitle: "Saved result review",
      hotspotLabel: "Back to saved inspections",
      blocks: [
        {
          id: "history-record",
          title: "Result",
          description: "Fresh",
        },
        {
          id: "history-confidence",
          title: "Confidence and details",
          description: "The saved result keeps its confidence and explanation.",
        },
        {
          id: "history-back",
          title: "Back to saved inspections",
          description: "Return to the saved-inspection list after review.",
          tone: "accent",
          hotspotLabel: "Back to saved inspections",
        },
      ],
    },
    {
      id: "history-export-report",
      tutorialId: "history",
      sectionTitle: "History demo",
      stepTitle: "Export all saved inspections",
      instruction:
        "The report tools stay visible below the saved records. Tap Export all inspections as PDF to include every saved inspection, or choose a date first when you only need one day.",
      sceneTitle: "History",
      sceneSubtitle: "Report and totals",
      hotspotLabel: "Export all inspections as PDF",
      blocks: [
        {
          id: "history-report",
          title: "Export a report",
          description: "Without a date, the report includes all saved inspections.",
          tone: "accent",
          hotspotLabel: "Export all inspections as PDF",
        },
        {
          id: "history-date",
          title: "Choose a date",
          description: "Choose a date when you only need inspections from one day.",
        },
        {
          id: "history-totals",
          title: "Inspection totals",
          description: "Review the saved-inspection totals below the report controls.",
        },
      ],
    },
  ],
  messages: [
    {
      id: "messages-directory",
      tutorialId: "messages",
      sectionTitle: "Messages walkthrough",
      stepTitle: "Find someone to message",
      instruction:
        "Find the person you need under People you can message, then tap Message to open the chat.",
      sceneTitle: "Messages",
      sceneSubtitle: "Choose someone to message.",
      hotspotLabel: "Message",
      blocks: [
        {
          id: "messages-directory",
          title: "People you can message",
          description: "Find available support contacts here.",
          tone: "accent",
          hotspotLabel: "Message",
        },
        {
          id: "messages-thread",
          title: "Message someone",
          description: "Tap Message beside a person to open the chat.",
        },
        {
          id: "messages-status",
          title: "Connection status",
          description: "Live updates require an online authenticated session.",
        },
      ],
    },
    {
      id: "messages-thread",
      tutorialId: "messages",
      sectionTitle: "Messages walkthrough",
      stepTitle: "Send your first message",
      instruction:
        "Read the chat, type your message, and tap Send. Connection status is shown above the conversation.",
      sceneTitle: "Conversation Thread",
      sceneSubtitle: "Chat and send a message",
      hotspotLabel: "Send",
      blocks: [
        {
          id: "messages-directory",
          title: "Chat with a support contact",
          description: "The selected person appears at the top of the chat.",
        },
        {
          id: "messages-thread",
          title: "Send a message",
          description: "Type your message and tap Send.",
          tone: "accent",
          hotspotLabel: "Send",
        },
        {
          id: "messages-status",
          title: "Connection status",
          description: "Messaging pauses while the app is offline.",
        },
      ],
    },
  ],
};

export const firstRunTutorialOrder: TutorialId[] = [
  "safety",
  "profile",
  "inspect",
  "history",
  "messages",
];

export const firstRunOnboardingSteps: TutorialStepDefinition[] =
  firstRunTutorialOrder.flatMap((id) => tutorialDefinitions[id]);
