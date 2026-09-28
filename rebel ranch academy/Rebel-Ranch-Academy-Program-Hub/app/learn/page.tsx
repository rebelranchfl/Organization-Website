import { redirect } from "next/navigation";

// Version 1 has no Dashboard yet (it arrives with sign-in), so /learn opens the Library.
export default function LearnIndex() {
  redirect("/learn/library");
}
