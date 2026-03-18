import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { Profile } from "./backend";
import AuthScreen from "./components/AuthScreen";
import MainApp from "./components/MainApp";
import OnboardingWizard from "./components/OnboardingWizard";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor: backend, isFetching } = useActor();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!identity || !backend || isFetching) return;
    setProfileLoading(true);
    backend
      .getCallerUserProfile()
      .then((p) => setProfile(p))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [identity, backend, isFetching]);

  if (
    isInitializing ||
    profileLoading ||
    (identity && profile === undefined && !isFetching && backend)
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!identity;

  return (
    <>
      <Toaster position="top-center" richColors />
      {!isLoggedIn ? (
        <AuthScreen />
      ) : profile === null || profile === undefined ? (
        <OnboardingWizard onComplete={(p) => setProfile(p)} />
      ) : (
        <MainApp profile={profile} onProfileUpdate={setProfile} />
      )}
    </>
  );
}
