"use client";

import { useState, useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RecaptchaGateProps {
  children: React.ReactNode;
}

const RECAPTCHA_VERIFICATION_KEY = "recaptcha_verified";
const VERIFICATION_EXPIRY_HOURS = 24; // Verification expires after 24 hours

export function RecaptchaGate({ children }: RecaptchaGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = () => {
      try {
        const stored = localStorage.getItem(RECAPTCHA_VERIFICATION_KEY);
        if (stored) {
          const { timestamp } = JSON.parse(stored);
          const now = Date.now();
          const expiryTime = VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds
          
          // Check if verification is still valid (within 24 hours)
          if (now - timestamp < expiryTime) {
            setIsVerified(true);
            setIsLoading(false);
            return;
          } else {
            // Expired, remove it
            localStorage.removeItem(RECAPTCHA_VERIFICATION_KEY);
          }
        }
        setIsVerified(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking verification:", error);
        setIsVerified(false);
        setIsLoading(false);
      }
    };

    checkVerification();
  }, []);

  const handleRecaptchaChange = (token: string | null) => {
    if (token) {
      // Verify token on server
      verifyToken(token);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/verify-recaptcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      if (response.ok) {
        // Store verification with timestamp
        localStorage.setItem(
          RECAPTCHA_VERIFICATION_KEY,
          JSON.stringify({ timestamp: Date.now() })
        );
        setIsVerified(true);
      } else {
        // Verification failed
        toast.error("فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى");
        recaptchaRef.current?.reset();
      }
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      toast.error("حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى");
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking
  if (isLoading && isVerified === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show reCAPTCHA gate if not verified
  if (!isVerified) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">التحقق من الأمان</h2>
              <p className="text-muted-foreground">
                يرجى إكمال التحقق من reCAPTCHA للوصول إلى الموقع
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
              onChange={handleRecaptchaChange}
              theme="light"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التحقق...</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              هذا التحقق يساعدنا في حماية الموقع من الروبوتات والهجمات الضارة
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is verified, show content
  return <>{children}</>;
}

