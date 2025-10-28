import React from "react";
import "@testing-library/jest-dom";
import "whatwg-fetch";
import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  WritableStream,
  TransformStream,
});

class BroadcastChannelStub {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(): void {}
  close(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
}

if (typeof globalThis.BroadcastChannel === "undefined") {
  Object.assign(globalThis, { BroadcastChannel: BroadcastChannelStub });
}

jest.mock("next/link", () => {
  const LinkMock = ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string | { pathname?: string };
  }) => {
    const resolvedHref =
      typeof href === "string" ? href : typeof href?.pathname === "string" ? href.pathname : "#";

    return React.createElement("a", { href: resolvedHref, ...rest }, children);
  };

  LinkMock.displayName = "NextLinkMock";

  return LinkMock;
});

let serverModule: Promise<typeof import("./src/mocks/server")> | undefined;

function getServer() {
  if (!serverModule) {
    serverModule = import("./src/mocks/server");
  }

  return serverModule;
}

beforeAll(async () => {
  const { server } = await getServer();
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(async () => {
  const { server } = await getServer();
  server.resetHandlers();
});

afterAll(async () => {
  const { server } = await getServer();
  server.close();
});
