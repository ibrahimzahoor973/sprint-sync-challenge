--- Insert an admin user into the users table with password 'admin123'
INSERT INTO "users" ("id", "email", "passwordHash", "isAdmin", "createdAt","updatedAt")
VALUES (
  'ckj1q1q1q000000',
  'admin@sprintsync.com',
  '$2b$12$vej.vN.CJOSbd3WrWKiCNuXG3uJOtgguua.sQzSYk3rXbuvzqps4a',
  TRUE,
  NOW(),
  NOW()
);