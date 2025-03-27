"use server";
import { auth } from "@clerk/nextjs/server";

async function getUser() {
  const user = await auth();
  return user.userId;
}

export { getUser };
