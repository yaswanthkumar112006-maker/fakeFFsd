// Shared password-strength rule for any flow that lets someone set their own
// password (currently: organization registration, which provisions that org's
// first System Admin account). Requires 8+ characters, at least one uppercase
// letter, one digit, and one symbol.
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;

export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.';
