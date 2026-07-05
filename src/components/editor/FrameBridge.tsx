import { createContext, useContext } from "react";
import type { FrameCommand } from "@/types";

interface Bridge {
  send: ((cmd: FrameCommand) => void) | null;
}

const BridgeContext = createContext<Bridge>({ send: null });

export function FrameBridgeProvider({
  children,
  send,
}: {
  children: React.ReactNode;
  send: ((cmd: FrameCommand) => void) | null;
}) {
  return <BridgeContext.Provider value={{ send }}>{children}</BridgeContext.Provider>;
}

export function useFrameBridge(): ((cmd: FrameCommand) => void) | null {
  return useContext(BridgeContext).send;
}
