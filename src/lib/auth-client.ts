import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [
    inferAdditionalFields({
      user: {
        platformRole: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
