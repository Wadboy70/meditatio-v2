/// <reference types="nativewind/types" />

declare module '*.css';
declare module '*.sqlite' {
  const assetId: number;
  export default assetId;
}
