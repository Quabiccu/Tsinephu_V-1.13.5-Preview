import { useState } from "react";
import {
  Lock,
  Eye,
  Database,
  Globe,
  Trash2,
  Shield,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface PrivacyPolicyPageProps {
  onClose?: () => void;
}

const privacySections = [
  {
    icon: Database,
    title: "Data We Collect",
    content: `Tsinephu collects the following information to provide our services:

• Account Information: Username, display name, password hash, and optional profile photo.
• Content: Parniks (posts), ReParniks, replies, direct messages, polls, and map data you create.
• Usage Data: Language preference, theme settings, and notification preferences (stored locally on your device).
• Interactions: Likes, follows, blocks, and reports you make on the platform.

We do NOT collect: Real names, email addresses (unless using Google login), phone numbers, precise geolocation, or tracking data for advertising purposes.`,
  },
  {
    icon: Lock,
    title: "How We Protect Your Data",
    content: `All data is stored locally on your device using browser LocalStorage. Tsinephu does not operate a centralized server. This means:

• Your data stays on your device unless you explicitly share content with other users.
• Passwords are hashed with a salt before storage. We never store plain-text passwords.
• Admin authentication uses an additional secure hash layer separate from user passwords.
• No third-party analytics or tracking scripts are embedded in the application.`,
  },
  {
    icon: Eye,
    title: "Data Visibility",
    content: `Your content visibility depends on your actions:

• Public Parniks: Visible to all Tsinephu users.
• Direct Messages: Only visible to participants in the conversation.
• Profile Information: Username, display name, bio, and avatar are public.
• Blocked Users: Cannot view your profile or interact with your content.
• Observer Mode: Browse without creating an account; no data is stored.`,
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    content: `Tsinephu uses the following external services:

• OpenStreetMap / Leaflet: For interactive map features. Map tile requests go to OpenStreetMap servers.
• DiceBear API: For generating default avatar images. Only your username seed is sent.
• Google OAuth (optional): If you choose to log in with Google, their privacy policy applies.

No data is sold to or shared with advertisers, data brokers, or analytics companies.`,
  },
  {
    icon: Trash2,
    title: "Your Rights & Data Deletion",
    content: `You have full control over your data:

• Delete Account: Remove your account and all associated content from the platform.
• Delete Parniks: Remove individual posts at any time.
• Clear Local Data: Use your browser settings to clear LocalStorage for Tsinephu.
• Export Data: You can export your map data and content in standard formats (GeoJSON, JSON).

Because data is stored locally, clearing your browser storage will permanently delete all your Tsinephu data.`,
  },
  {
    icon: Shield,
    title: "Content Moderation & Safety",
    content: `Tsinephu provides the following safety tools:

• Block Users: Prevent specific users from viewing your profile or contacting you.
• Report Content: Flag inappropriate content for review.
• Admin Oversight: Platform administrators can suspend accounts that violate the Terms of Service.
• No Automated Scanning: We do not use AI to scan or moderate content automatically.

All moderation actions require human admin review with authenticated credentials.`,
  },
];

export function PrivacyPolicyPage({ onClose }: PrivacyPolicyPageProps) {
  const { t } = useLanguage();
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 sticky top-0 bg-background/95 backdrop-blur-sm py-4 z-10 border-b">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DC143C] to-yellow-400 flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t("privacyPolicy") || "Privacy Policy"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Tsinephu — Quabiccu | 2026
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Intro */}
        <div className="bg-gradient-to-r from-[#DC143C]/5 to-yellow-400/5 rounded-xl p-6 mb-8 border border-[#DC143C]/10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("privacyIntro") ||
              "At Tsinephu, we believe privacy is a fundamental right. This Privacy Policy explains what data we collect, how we protect it, and your rights as a user. Tsinephu is designed with privacy-first principles — most of your data never leaves your device."}
          </p>
        </div>

        {/* Sections - Accordion style */}
        <div className="space-y-3">
          {privacySections.map((section, index) => {
            const Icon = section.icon;
            const isOpen = openSection === index;
            return (
              <div
                key={index}
                className="border border-border/50 rounded-xl overflow-hidden hover:border-[#DC143C]/20 transition-colors"
              >
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenSection(isOpen ? null : index)}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#DC143C]" />
                  </div>
                  <span className="font-semibold flex-1">{section.title}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-[4.5rem]">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-[#DC143C]/5 rounded-xl border border-[#DC143C]/20">
          <p className="text-sm text-[#DC143C] font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("privacyFooter") ||
              "Your privacy matters. If you have questions, contact quabiccuteamoff@gmail.com"}
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {t("lastUpdated") || "Last updated"}: 2026 — Quabiccu
        </div>
      </div>
    </div>
  );
}
