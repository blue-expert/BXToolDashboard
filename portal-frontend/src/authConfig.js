import { LogLevel } from "@azure/msal-browser";

// Read values from your .env file
const CLIENT_ID = process.env.REACT_APP_AZURE_CLIENT_ID;
const TENANT_ID = process.env.REACT_APP_AZURE_TENANT_ID;

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin // Uses localhost:3000 or your prod URL
  },
  cache: {
    cacheLocation: "sessionStorage", // or "localStorage"
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            // console.info(message); // Avoid cluttering console
            return;
          case LogLevel.Verbose:
            // console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// This defines the "permissions" your app needs.
// "user.read" is the basic permission to read the user's profile.
export const loginRequest = {
  scopes: ["User.Read"]
};

// This is the scope your BACKEND API will require.
// You'll need to "Expose an API" in your Azure App Registration
// and create a scope like "access_as_user".
// For now, we'll use the default client ID scope.
export const protectedApiRequest = {
    scopes: [`api://${CLIENT_ID}/access_as_user`] // ⭐️ IMPORTANT: See note below
};