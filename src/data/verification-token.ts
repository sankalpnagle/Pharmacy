import { prisma } from "@/lib/prisma";
export const verificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { email },
    });
    return verificationToken;
  } catch (error) {
    console.log(error);
  }
};

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token: token },
    });
    return verificationToken;
  } catch (error) {
    console.log(error);
  }
};
