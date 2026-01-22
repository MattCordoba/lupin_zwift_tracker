import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function LupinWebApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
