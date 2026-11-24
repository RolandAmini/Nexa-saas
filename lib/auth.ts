import bcrypt from "bcryptjs";

// Hachage du mot de passe avant l'enregistrement en base de données
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Vérification du mot de passe lors de la connexion
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}