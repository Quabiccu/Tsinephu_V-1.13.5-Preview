import { useState } from "react";
import {
  Scroll,
  Check,
  X,
  Shield,
  FileText,
  UserCheck,
  Gavel,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";

interface TermsOfServicePageProps {
  onAccept?: () => void;
  onClose?: () => void;
  showAcceptButton?: boolean;
}

// Structured ToS sections for proper rendering
const tosSections = [
  {
    icon: UserCheck,
    title: "User Responsibility",
    content:
      "Quabiccu does not assume responsibility for any user's illegal actions on the Tsinephu platform. All responsibility for publications, posts, comments, messages, and any other user-generated content belongs solely and exclusively to the user who created and published such content.",
  },
  {
    icon: Gavel,
    title: "Legal Compliance",
    content:
      "By accessing or using Tsinephu, the user expressly agrees to post responsibly and in strict accordance with the laws, regulations, and legal frameworks applicable in their jurisdiction. The user acknowledges that they are solely responsible for ensuring their content complies with all applicable local, national, and international laws.",
  },
  {
    icon: Shield,
    title: "Assumption of Liability",
    content:
      "The user assumes any and all liability in the event of a violation of legal norms, statutory provisions, or third-party rights caused by their publications or conduct on the platform. This includes, without limitation, liability for defamation, copyright infringement, harassment, hate speech, or any other unlawful activity.",
  },
  {
    icon: Globe,
    title: "Platform Role",
    content:
      "Tsinephu serves as a neutral platform for user-generated content. Quabiccu acts solely as a service provider and does not monitor, endorse, verify, or assume editorial control over user content except where required by applicable law.",
  },
  {
    icon: AlertTriangle,
    title: "Enforcement",
    content:
      "Quabiccu reserves the right to suspend, terminate, or restrict access to any user account that violates these terms or engages in illegal activity, without prior notice.",
  },
  {
    icon: FileText,
    title: "Governing Law & Acceptance",
    content:
      "These terms shall be governed by and construed in accordance with the laws of the user's jurisdiction. By creating an account or using Tsinephu in any capacity, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.",
  },
];

export function TermsOfServicePage({
  onAccept,
  onClose,
  showAcceptButton = false,
}: TermsOfServicePageProps) {
  const { t } = useLanguage();
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 sticky top-0 bg-background/95 backdrop-blur-sm py-4 z-10 border-b">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DC143C] to-yellow-400 flex items-center justify-center">
            <Scroll className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t("termsShort") || "Terms of Service"}
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
            Welcome to Tsinephu. These Terms of Service govern your use of the
            Tsinephu platform, operated by Quabiccu. By accessing or using our
            services, you agree to these terms. Please read them carefully.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {tosSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="bg-muted/30 rounded-xl p-6 border border-border/50 hover:border-[#DC143C]/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#DC143C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <span className="text-[#DC143C] text-sm">
                        {index + 1}.
                      </span>
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full legal text (collapsible) */}
        <div className="mt-8 p-4 bg-muted/20 rounded-xl">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-[#DC143C] transition-colors">
              <FileText className="h-4 w-4" />
              {t("viewFullLegalText") || "View Full Legal Text"}
            </summary>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {t("termsOfService")}
            </p>
          </details>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-[#DC143C]/5 rounded-xl border border-[#DC143C]/20">
          <p className="text-sm text-[#DC143C] font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("tosRequired") ||
              "By using Tsinephu, you acknowledge and agree to these terms."}
          </p>
        </div>

        {/* Accept button */}
        {showAcceptButton && (
          <div className="mt-8 space-y-4 sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-xl border shadow-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept-tos"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="accept-tos"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t("acceptTerms") ||
                  "I have read and accept the Terms of Service. I understand that I am solely responsible for all content I post on Tsinephu."}
              </label>
            </div>
            <Button
              className="w-full bg-[#DC143C] hover:bg-[#B01030]"
              disabled={!accepted}
              onClick={onAccept}
            >
              <Check className="h-4 w-4 mr-2" />
              {t("continue") || "Continue"}
            </Button>
            {!accepted && (
              <p className="text-xs text-muted-foreground text-center">
                {t("mustAcceptTerms") ||
                  "You must accept the Terms of Service to use Tsinephu."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
