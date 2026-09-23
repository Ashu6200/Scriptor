import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
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

export const signInWithGoogle = (callbackURL = "/dashboard") =>
  authClient.signIn.social({ provider: "google", callbackURL });

export const signInWithGitHub = (callbackURL = "/dashboard") =>
  authClient.signIn.social({ provider: "github", callbackURL });
