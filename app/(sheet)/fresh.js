"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";

// Next keeps visited screens mounted (hidden). Edit sheets should open fresh on every visit, so a
// half-edited or stale form is never shown or saved; browser back still restores what you typed.
export default function Fresh({ children }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
