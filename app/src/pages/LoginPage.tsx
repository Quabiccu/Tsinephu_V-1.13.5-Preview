import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Chrome,
  User,
  ChevronDown,
  Camera,
  X,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LoginPage() {
  const { t } = useLanguage();
  const { login, startObserverMode } = useAuth();
  const [step, setStep] = useState<"welcome" | "auth">("welcome");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [languageSearch, setLanguageSearch] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError(t("usernameRequired") || "Please enter a username.");
      return;
    }
    if (!password || password.length < 4) {
      setError(
        t("passwordTooShort") || "Password must be at least 4 characters.",
      );
      return;
    }

    if (!isLoginMode) {
      if (password !== confirmPassword) {
        setError(t("passwordsDoNotMatch") || "Passwords do not match.");
        return;
      }
      if (!acceptedTerms) {
        setError(
          t("mustAcceptTerms") || "You must accept the Terms of Service.",
        );
        return;
      }
    }

    setIsLoading(true);
    const result = login(
      username,
      displayName || username,
      password,
      profilePhoto || undefined,
    );
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleObserverMode = () => {
    startObserverMode();
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Language Selector */}
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span>{t("language")}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                {/* Language search */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder={t("search") || "Search..."}
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                {/* Languages would be populated here */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Tsinephu" className="h-28 w-auto" />
            </div>
            <h1 className="text-4xl font-bold">{t("welcome")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("welcomeSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg gap-3 rounded-full border-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Chrome className="h-5 w-5" />
              {isLoading
                ? t("connecting") || "Connecting..."
                : t("continueWithGoogle") || "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("or") || "or"}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full h-14 text-lg gap-3 rounded-full"
              onClick={() => setStep("auth")}
            >
              <User className="h-5 w-5" />
              {t("createAccount") || "Create Account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("or") || "or"}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="lg"
              className="w-full h-14 text-lg gap-3 rounded-full border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
              onClick={handleObserverMode}
            >
              <span className="text-xl">👁️</span>
              {t("continueAsObserver") || "Continue as Observer"}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t("termsText") || "By signing up, you agree to our"}{" "}
            <button
              onClick={() => window.open("/terms", "_blank")}
              className="underline hover:text-primary"
            >
              {t("terms") || "Terms"}
            </button>{" "}
            {t("and") || "and"}{" "}
            <button
              onClick={() => window.open("/privacy", "_blank")}
              className="underline hover:text-primary"
            >
              {t("privacy") || "Privacy Policy"}
            </button>
            .
          </p>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>
              2026 Quabiccu. {t("allRightsReserved") || "All rights reserved."}
            </p>
            <p>quabiccuteamoff@gmail.com</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth step (login or register)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setStep("welcome")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-6"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
          {t("back") || "Back"}
        </button>

        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-bold">
            {isLoginMode
              ? t("signIn") || "Sign In"
              : t("createAccount") || "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLoginMode
              ? t("signInDesc") || "Welcome back! Enter your credentials."
              : t("createAccountDesc") ||
                "Choose your username and password to get started."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-full bg-muted p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${!isLoginMode ? "bg-[#DC143C] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              setIsLoginMode(false);
              setError("");
            }}
          >
            {t("newAccount") || "New Account"}
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${isLoginMode ? "bg-[#DC143C] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              setIsLoginMode(true);
              setError("");
            }}
          >
            {t("signIn") || "Sign In"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Profile photo - register only */}
          {!isLoginMode && (
            <div className="flex flex-col items-center space-y-3 mb-4">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                {profilePhoto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary hover:underline"
              >
                {profilePhoto
                  ? t("changePhoto") || "Change Photo"
                  : t("uploadPhoto") || "Upload Photo"}
              </button>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">{t("username") || "Username"}</Label>
            <Input
              id="username"
              placeholder="@username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/\s+/g, "_").toLowerCase())
              }
              className="h-12 rounded-xl"
              autoFocus
            />
          </div>

          {/* Display name - register only */}
          {!isLoginMode && (
            <div className="space-y-2">
              <Label htmlFor="displayName">
                {t("displayName") || "Display Name"}
              </Label>
              <Input
                id="displayName"
                placeholder={
                  t("displayNamePlaceholder") || "How you want to be called"
                }
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t("password") || "Password"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder") || "Min. 4 characters"}
                className="h-12 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password - register only */}
          {!isLoginMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("confirmPassword") || "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={
                  t("confirmPasswordPlaceholder") || "Repeat your password"
                }
                className="h-12 rounded-xl"
              />
            </div>
          )}

          {/* Terms - register only */}
          {!isLoginMode && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <Checkbox
                id="terms-checkbox"
                checked={acceptedTerms}
                onCheckedChange={(checked) =>
                  setAcceptedTerms(checked === true)
                }
                className="mt-0.5"
              />
              <label
                htmlFor="terms-checkbox"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t("acceptTerms") || "I accept the"}{" "}
                <button
                  type="button"
                  onClick={() => window.open("/terms", "_blank")}
                  className="text-primary underline hover:text-primary/80"
                >
                  {t("termsShort") || "Terms of Service"}
                </button>{" "}
                {t("and") || "and"}{" "}
                <button
                  type="button"
                  onClick={() => window.open("/privacy", "_blank")}
                  className="text-primary underline hover:text-primary/80"
                >
                  {t("privacyPolicy") || "Privacy Policy"}
                </button>
              </label>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-lg rounded-full bg-[#DC143C] hover:bg-[#B01030] text-white flex items-center justify-center gap-2"
            disabled={!username.trim() || !password || isLoading}
          >
            {isLoginMode ? (
              <LogIn className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            {isLoading
              ? "..."
              : isLoginMode
                ? t("signIn") || "Sign In"
                : t("createAccount") || "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
