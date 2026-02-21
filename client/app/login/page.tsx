import React, { Suspense } from "react";
import LoginForm from "../../components/login/login-form";

export const metadata = {
  title: "Login — Vegas Swap",
};

export default function LoginPage() {
  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Suspense fallback={<div />}> 
        <LoginForm />
      </Suspense>
    </main>
  );
}
