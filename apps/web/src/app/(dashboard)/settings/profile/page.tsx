"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/profile");
  }, [router]);

  return (
    <div className="p-8 text-center text-warm-500 font-medium text-sm">
      Forwarding to your Account Profile...
    </div>
  );
}
