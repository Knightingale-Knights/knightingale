import { redirect } from "next/navigation";

// Documents now live under Account.
export default function Documents() {
  redirect("/carer/account");
}
