import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const hashPassword = async (plain: string): Promise<string> => {
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = async (
  plain: string,
  hash: string
): Promise<boolean> => bcrypt.compare(plain, hash);
