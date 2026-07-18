import type { Metadata } from "next";
import { CallClient } from "./call-client";

export const metadata: Metadata = {
  title: "Consultation",
  robots: { index: false },
};

/** Public patient entry to a consultation — reached via the doctor's link. */
export default async function CallPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  return <CallClient room={room} />;
}
