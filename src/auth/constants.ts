/*
## A JWT Token must be provided in the '.env' file at project root, or as .env var
*/

export const jwtConstants = () => {
  return process.env.JWT_SECRET
};