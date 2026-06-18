import * as bcrypt from 'bcryptjs';

/**
 * Password utility functions
 * USE: Auth aur user operations mein password handling ke liye
 */
export class PasswordUtil {
  /**
   * Hash password with bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   * USE: Register aur change password mein
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare plain password with hashed password
   * @param plainPassword - User ka input password
   * @param hashedPassword - Database mein stored password
   * @returns Boolean - match hua ya nahi
   * USE: Login aur change password validation mein
   */
  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}