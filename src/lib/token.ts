import { verificationTokenByEmail } from "@/data/verification-token";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date().getTime() + 1000 * 60 * 60 * 1;
  const existingToken = await verificationTokenByEmail(email);

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires: new Date(expires),
    },
  });
  return verificationToken;
};
