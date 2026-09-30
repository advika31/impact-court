"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AdminLogin from "@/components/AdminLogin";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AdminLogin
      onSuccess={() => {
        router.push("/?mode=admin");
      }}
      onBack={() => {
        router.push("/");
      }}
    />
  );
}
