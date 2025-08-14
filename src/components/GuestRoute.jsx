// src/components/GuestRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function GuestRoute({ children }) {
  const user = auth.currentUser;

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
