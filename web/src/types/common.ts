export interface NuiMessageData<T = unknown> {
  action: string;
  data: T;
}

export type NuiHandlerSignature<T> = (data: T) => void;

export interface DebugEvent<T = any> {
    action: string;
    data: T;
}

export interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
}
