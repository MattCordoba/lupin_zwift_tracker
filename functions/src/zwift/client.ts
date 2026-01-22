import type { ZwiftAuthPayload } from "@lupin/types";

type AnyModule = Record<string, unknown>;
type AnyClient = Record<string, unknown>;

export interface ZwiftClient {
  getProfile(): Promise<unknown>;
  getActivities(): Promise<unknown>;
  getRoutes(): Promise<unknown>;
}

const loadModule = async (name: string): Promise<AnyModule> => {
  const mod = await import(name);
  return mod as AnyModule;
};

const loginIfNeeded = async (client: AnyClient, auth: ZwiftAuthPayload) => {
  const login = client.login;
  if (typeof login === "function") {
    await login.call(client, auth.username, auth.password, auth.accessToken, auth.refreshToken);
  }
};

const buildClientFromModule = async (
  mod: AnyModule,
  auth: ZwiftAuthPayload
): Promise<AnyClient> => {
  if (typeof mod.createClient === "function") {
    const client = (await mod.createClient(auth)) as AnyClient;
    await loginIfNeeded(client, auth);
    return client;
  }
  if (typeof mod.ZwiftAccount === "function") {
    const client = new (mod.ZwiftAccount as new (u: string, p: string) => AnyClient)(
      auth.username,
      auth.password
    );
    await loginIfNeeded(client, auth);
    return client;
  }
  if (typeof mod.ZwiftClient === "function") {
    const client = new (mod.ZwiftClient as new (u: string, p: string) => AnyClient)(
      auth.username,
      auth.password
    );
    await loginIfNeeded(client, auth);
    return client;
  }
  if (typeof mod.default === "function") {
    const client = new (mod.default as new (u: string, p: string) => AnyClient)(
      auth.username,
      auth.password
    );
    await loginIfNeeded(client, auth);
    return client;
  }
  if (typeof mod.default === "object" && mod.default) {
    await loginIfNeeded(mod.default as AnyClient, auth);
    return mod.default as AnyClient;
  }
  throw new Error("Unsupported Zwift client module shape.");
};

const callClientMethod = async (
  client: AnyClient,
  methodNames: string[]
): Promise<unknown> => {
  for (const name of methodNames) {
    const method = client[name];
    if (typeof method === "function") {
      return method.call(client);
    }
    if (method !== undefined) {
      return method;
    }
  }
  throw new Error(`Missing Zwift client method: ${methodNames.join(", ")}`);
};

export const createZwiftClient = async (
  auth: ZwiftAuthPayload
): Promise<ZwiftClient> => {
  try {
    const mobileModule = await loadModule("zwift-mobile-api");
    const mobileClient = await buildClientFromModule(mobileModule, auth);
    return {
      getProfile: async () =>
        callClientMethod(mobileClient, ["getProfile", "profile", "getUserProfile"]),
      getActivities: async () =>
        callClientMethod(mobileClient, ["getActivities", "activities", "activityFeed"]),
      getRoutes: async () =>
        callClientMethod(mobileClient, ["getRoutes", "routes", "getWorldRoutes"])
    };
  } catch (error) {
    const fallbackModule = await loadModule("zwift-client");
    const fallbackClient = await buildClientFromModule(fallbackModule, auth);
    return {
      getProfile: async () =>
        callClientMethod(fallbackClient, ["getProfile", "profile", "getUserProfile"]),
      getActivities: async () =>
        callClientMethod(fallbackClient, ["getActivities", "activities", "activityFeed"]),
      getRoutes: async () =>
        callClientMethod(fallbackClient, ["getRoutes", "routes", "getWorldRoutes"])
    };
  }
};
