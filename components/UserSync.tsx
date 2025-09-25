"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const ensureUser = useMutation(api.auth.ensureUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Automatically create/sync user in Convex when they sign in
      ensureUser().then((result) => {
        if (result?.isNew) {
          console.log("New user created in Convex database");
        }
      }).catch((error) => {
        console.error("Failed to sync user:", error);
      });
    }
  }, [isLoaded, user, ensureUser]);

  return null; // This component doesn't render anything
}