import Chat from "@/components/chat";
import { StreamHandler } from "@/components/stream-handler";
import { generateUUID } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

type tParams = Promise<{ id: string }>;

export default async function Page({ params }: { params: tParams }) {
  const { id } = await params;
  const { userId } = await auth();
  const generatedId = generateUUID();

  return (
    <>
      <Chat key={generatedId} id={id} clerkUserId={userId as string} />
      <StreamHandler id={id} />
    </>
  );
}
