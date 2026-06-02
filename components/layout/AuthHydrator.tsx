"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/lib/redux/store";
import { setUser, clearUser } from "@/lib/redux/slices/authSlice";

export function AuthHydrator() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user) {
      dispatch(
        setUser({
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }),
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, status, dispatch]);

  return null;
}
